const baseInput = process.argv.slice(2).find((argument) => argument !== "--") ??
  process.env.NELA_CLOUDFLARE_PREVIEW_URL;

if (!baseInput) {
  console.error(
    "Uso: pnpm run verify:cloudflare:preview -- https://<preview>.workers.dev",
  );
  process.exit(1);
}

const baseUrl = new URL(baseInput);
if (baseUrl.protocol !== "https:") {
  throw new Error("La preview debe usar HTTPS.");
}

baseUrl.pathname = "/";
baseUrl.search = "";
baseUrl.hash = "";

const timeoutMs = 20_000;
const results = [];

function normalize(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

async function request(pathname, options = {}) {
  const started = performance.now();
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    ...options,
  });
  const body = await response.text();
  const durationMs = Math.round(performance.now() - started);

  return { response, body, durationMs };
}

async function checkPage(pathname, expectedText) {
  const { response, body, durationMs } = await request(pathname);
  const containsExpected = normalize(body).includes(normalize(expectedText));
  const passed = response.status === 200 && containsExpected;

  results.push({
    check: pathname,
    status: response.status,
    durationMs,
    passed,
    detail: containsExpected ? expectedText : `No contiene: ${expectedText}`,
  });

  return { response, body };
}

const catalog = await checkPage("/accesorios-plata", "NELA");

await checkPage("/", "NELA");
await checkPage("/accesorios-plata/anillos", "Anillos");
await checkPage("/accesorios-plata/aretes-y-topos", "Aretes y topos");
await checkPage("/accesorios-plata/cadenas", "Cadenas");
await checkPage("/accesorios-plata/dijes", "Dijes");
await checkPage("/accesorios-plata/pulseras", "Pulseras");
await checkPage("/contacto", "Hablemos");
await checkPage("/preguntas-frecuentes", "Preguntas frecuentes");
await checkPage("/politica-de-privacidad", "privacidad");

const productMatch = catalog.body.match(/href=["']\/productos\/([^"'#?]+)["']/i);
if (!productMatch) {
  results.push({
    check: "producto real",
    status: 0,
    durationMs: 0,
    passed: false,
    detail: "El catálogo no expuso un enlace de producto.",
  });
} else {
  const productPath = `/productos/${productMatch[1]}`;
  const expectedProductName = decodeURIComponent(productMatch[1]).replaceAll("-", " ");
  await checkPage(productPath, expectedProductName);
}

for (const [pathname, expectedFragment] of [
  ["/robots.txt", "User-Agent"],
  ["/sitemap.xml", "/productos/"],
]) {
  const { response, body, durationMs } = await request(pathname);
  results.push({
    check: pathname,
    status: response.status,
    durationMs,
    passed: response.status === 200 && body.includes(expectedFragment),
    detail: response.headers.get("content-type") ?? "sin content-type",
  });
}

{
  const { response, durationMs } = await request("/ruta-que-no-existe");
  results.push({
    check: "404",
    status: response.status,
    durationMs,
    passed: response.status === 404,
    detail: "/ruta-que-no-existe",
  });
}

{
  const { response, body, durationMs } = await request("/admin/inventario", { redirect: "manual" });
  const accessRedirect = response.status >= 300 && response.status < 400 &&
    response.headers.get("location")?.includes("cloudflareaccess.com");
  const restricted = normalize(body).includes("acceso restringido") &&
    normalize(body).includes("no esta habilitado en este alojamiento");
  results.push({
    check: "panel administrativo",
    status: response.status,
    durationMs,
    passed: Boolean(accessRedirect) || (response.status === 200 && restricted),
    detail: accessRedirect
      ? "Protegido por Cloudflare Access"
      : restricted
        ? "Acceso restringido por la aplicación"
        : "La restricción no fue reconocida",
  });
}

{
  const { response, body, durationMs } = await request("/api/admin/inventory", { redirect: "manual" });
  const accessRedirect = response.status >= 300 && response.status < 400 &&
    response.headers.get("location")?.includes("cloudflareaccess.com");
  let errorMessage = body;
  try {
    errorMessage = JSON.parse(body).error ?? body;
  } catch {
    // Keep the raw response for the report.
  }

  results.push({
    check: "API administrativa",
    status: response.status,
    durationMs,
    passed: Boolean(accessRedirect) || response.status === 401,
    detail: accessRedirect
      ? "Protegida por Cloudflare Access"
      : String(errorMessage).slice(0, 120),
  });
}

{
  const { response } = await request("/");
  const xRobotsTag = response.headers.get("x-robots-tag");
  results.push({
    check: "protección de indexación",
    status: response.status,
    durationMs: 0,
    passed: xRobotsTag?.toLowerCase().includes("noindex") ?? false,
    detail: xRobotsTag ?? "X-Robots-Tag ausente",
  });
}

console.table(results);

const failures = results.filter((result) => !result.passed);
if (failures.length > 0) {
  console.error(`\nFallaron ${failures.length} de ${results.length} comprobaciones.`);
  process.exit(1);
}

const pageTimings = results.filter((result) => result.durationMs > 0);
const averageMs = Math.round(
  pageTimings.reduce((sum, result) => sum + result.durationMs, 0) / pageTimings.length,
);

console.log(`\nPreview verificada: ${baseUrl.origin}`);
console.log(`${results.length} comprobaciones aprobadas. Tiempo HTTP medio: ${averageMs} ms.`);
