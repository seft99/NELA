import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "vite";

const APPLY_FLAG = "--apply";
const apply = process.argv.includes(APPLY_FLAG);
const projectRoot = process.cwd();
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
const apiVersion = (process.env.SANITY_API_VERSION || "2025-02-19").replace(/^v/, "");
const testApiBaseUrl = process.env.NODE_ENV === "test"
  ? process.env.NELA_SANITY_MIGRATION_TEST_API_BASE_URL?.trim().replace(/\/$/, "")
  : undefined;
const migrationSource = "nela-demo-catalog-v1";

if (!projectId || looksLikePlaceholder(projectId)) {
  throw new Error("Configura NEXT_PUBLIC_SANITY_PROJECT_ID con el ID real antes de ejecutar la migración.");
}
if (!dataset) {
  throw new Error("Configura NEXT_PUBLIC_SANITY_DATASET de forma explícita antes de ejecutar la migración.");
}
if (!/^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/.test(dataset)) {
  throw new Error(`El nombre de dataset no es válido: ${dataset}`);
}
if (apply && !token) {
  throw new Error("Configura SANITY_API_WRITE_TOKEN en el servidor antes de usar --apply.");
}

const products = await loadDemoProducts();
printTargetConfirmation();

if (dataset === "production" && products.some((product) => product.isDemo)) {
  throw new Error(
    "PROTECCIÓN ACTIVADA: los productos demo nunca pueden migrarse a production. Usa NEXT_PUBLIC_SANITY_DATASET=development.",
  );
}

const imagePaths = [...new Set(products.flatMap((product) => product.images.map((image) => image.src)))];
const imagePlans = await Promise.all(imagePaths.map(async (publicPath) => {
  const filePath = resolve(projectRoot, "public", publicPath.replace(/^\//, ""));
  const bytes = await readFile(filePath);
  return {
    publicPath,
    filePath,
    filename: publicPath.split("/").at(-1),
    bytes,
    sha1: createHash("sha1").update(bytes).digest("hex"),
    size: bytes.byteLength,
  };
}));

const canInspectRemote = Boolean(projectId && !looksLikePlaceholder(projectId));
const existingProducts = canInspectRemote ? await listExistingProducts() : [];
const existingById = new Map(existingProducts.map((product) => [product._id, product]));
const existingBySlug = new Map(existingProducts.filter((product) => product.slug).map((product) => [product.slug, product]));
const existingByLegacyId = new Map(existingProducts.filter((product) => product.legacyId).map((product) => [product.legacyId, product]));
const creates = [];
const skipped = [];
const conflicts = [];

for (const product of products) {
  const byId = existingById.get(product.id);
  if (byId) {
    skipped.push({ id: product.id, reason: "Ya existe el ID estable." });
    continue;
  }
  const duplicate = existingBySlug.get(product.slug) || existingByLegacyId.get(product.id);
  if (duplicate) {
    conflicts.push({
      id: product.id,
      slug: product.slug,
      existingId: duplicate._id,
      reason: "El slug o ID de origen ya pertenece a otro documento.",
    });
    continue;
  }
  creates.push(product);
}

printPlan();

if (!apply) {
  console.log("\nDRY RUN: no se cargaron imágenes ni se escribieron documentos.");
  if (!canInspectRemote) {
    console.log("La comprobación remota de duplicados se omitió porque el Project ID real aún no está configurado.");
  }
} else {
  if (conflicts.length) {
    throw new Error("La importación se detuvo por conflictos de slug o ID. Resuélvelos antes de volver a ejecutar --apply.");
  }

  const assetIds = new Map();
  for (const image of imagePlans) {
    const existingAssetId = await findAssetByHash(image.sha1);
    const assetId = existingAssetId || await uploadImage(image);
    assetIds.set(image.publicPath, assetId);
    console.log(`${existingAssetId ? "REUTILIZADA" : "CARGADA"} ${image.publicPath} -> ${assetId}`);
  }

  if (!creates.length) {
    console.log("\nNo hay productos nuevos por crear. La migración ya estaba aplicada.");
  } else {
    const mutations = creates.map((product) => ({
      createIfNotExists: toSanityDocument(product, assetIds),
    }));
    await sanityRequest(`data/mutate/${dataset}?returnDocuments=false`, {
      method: "POST",
      body: JSON.stringify({ mutations }),
    });

    console.log(`\nIMPORTACIÓN COMPLETADA: ${creates.length} productos creados; ${skipped.length} existentes respetados.`);
  }
}

async function loadDemoProducts() {
  const server = await createServer({
    configFile: false,
    cacheDir: resolve(tmpdir(), `nela-sanity-migration-vite-${process.pid}`),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
    resolve: { alias: { "@": projectRoot } },
  });
  try {
    const loadedModule = await server.ssrLoadModule("/data/demo-products.ts");
    return loadedModule.expandedDemoProducts;
  } finally {
    await server.close();
  }
}

async function listExistingProducts() {
  const query = encodeURIComponent(`*[_type == "product"]{_id, "slug": slug.current, legacyId}`);
  const payload = await sanityRequest(`data/query/${dataset}?query=${query}`, {}, false);
  return payload.result || [];
}

async function findAssetByHash(hash) {
  const query = encodeURIComponent(`*[_type == "sanity.imageAsset" && sha1hash == "${hash}"][0]._id`);
  const payload = await sanityRequest(`data/query/${dataset}?query=${query}`);
  return payload.result || null;
}

async function uploadImage(image) {
  const contentType = extname(image.filename).toLowerCase() === ".png" ? "image/png" : "application/octet-stream";
  const payload = await sanityRequest(
    `assets/images/${dataset}?filename=${encodeURIComponent(image.filename)}`,
    { method: "POST", headers: { "Content-Type": contentType }, body: image.bytes },
  );
  if (!payload.document?._id) throw new Error(`Sanity no devolvió el ID del asset ${image.filename}.`);
  return payload.document._id;
}

async function sanityRequest(path, init = {}, requireToken = true) {
  if (!projectId) throw new Error("Falta NEXT_PUBLIC_SANITY_PROJECT_ID.");
  if (requireToken && !token) throw new Error("Falta SANITY_API_WRITE_TOKEN.");
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  const apiBaseUrl = testApiBaseUrl || `https://${projectId}.api.sanity.io`;
  const response = await fetch(`${apiBaseUrl}/v${apiVersion}/${path}`, { ...init, headers });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Sanity respondió ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response.json();
}

function toSanityDocument(product, assetIds) {
  return clean({
    _id: product.id,
    _type: "product",
    name: product.name,
    slug: { _type: "slug", current: product.slug },
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    reference: product.reference,
    presentation: product.presentation,
    quantityOrVolume: product.quantityOrVolume,
    material: product.material,
    finish: product.finish,
    measurements: product.measurements,
    catalogAttributes: product.catalogAttributes
      ? { _type: "catalogAttributes", ...product.catalogAttributes }
      : undefined,
    variants: product.variants?.map((variant) => ({
      _key: safeKey(variant.id),
      _type: "variant",
      name: variant.name,
      required: variant.required ?? false,
      options: variant.options.map((option) => ({
        _key: safeKey(option.id),
        _type: "variantOption",
        label: option.label,
      })),
    })),
    images: product.images.map((image, index) => ({
      _key: `image-${index + 1}`,
      _type: "image",
      alt: image.alt,
      asset: { _type: "reference", _ref: assetIds.get(image.src) },
    })),
    stock: product.stock ?? 0,
    purchaseEnabled: product.purchaseEnabled,
    variantInventory: product.variantInventory?.map((line) => ({
      _key: safeKey(line.id),
      _type: "variantInventoryLine",
      label: line.label,
      optionIds: line.optionIds.map(safeKey),
      stock: line.stock,
    })),
    featured: product.featured,
    visible: product.visible,
    displayOrder: product.displayOrder,
    legacyId: product.id,
    migrationSource,
    isDemo: Boolean(product.isDemo),
  });
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, clean(child)]));
  }
  return value;
}

function safeKey(value) {
  return String(value).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 96);
}

function looksLikePlaceholder(value) {
  return /PEGA|REEMPLAZAR|AQU[IÍ]|YOUR|EXAMPLE/i.test(value);
}

function printPlan() {
  const categoryCounts = Object.fromEntries(
    [...new Set(products.map((product) => product.category))]
      .map((category) => [category, products.filter((product) => product.category === category).length]),
  );
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    projectId: projectId && !looksLikePlaceholder(projectId) ? projectId : "NO_CONFIGURADO",
    dataset,
    productsFound: products.length,
    categoryCounts,
    productsToCreate: creates.length,
    productsSkipped: skipped.length,
    conflicts,
    images: imagePlans.map(({ publicPath, filename, sha1, size }) => ({ publicPath, filename, sha1, size })),
    migrationSource,
  }, null, 2));
}

function printTargetConfirmation() {
  const mode = apply ? "IMPORTACIÓN REAL (--apply)" : "DRY RUN (sin escrituras)";
  console.log([
    "",
    "============================================================",
    "CONFIRMACIÓN DE DESTINO DE LA MIGRACIÓN DEMO",
    `Project ID: ${projectId}`,
    `Dataset: ${dataset}`,
    `Cantidad de productos: ${products.length}`,
    `Modo: ${mode}`,
    "============================================================",
  ].join("\n"));
}
