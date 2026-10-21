import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { resolve } from "node:path";

const script = resolve(process.cwd(), "scripts", "migrate-demo-products-to-sanity.mjs");
const requests = [];
const apiServer = createServer((request, response) => {
  requests.push({
    method: request.method,
    url: request.url,
    authorization: request.headers.authorization,
  });
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ result: [] }));
});

await new Promise((resolveListen, rejectListen) => {
  apiServer.once("error", rejectListen);
  apiServer.listen(0, "127.0.0.1", resolveListen);
});

const address = apiServer.address();
assert(address && typeof address === "object");

let dryRun;
try {
  dryRun = await runMigration({
    NODE_ENV: "test",
    NEXT_PUBLIC_SANITY_PROJECT_ID: "0l7ykvj6",
    NEXT_PUBLIC_SANITY_DATASET: "development",
    SANITY_API_WRITE_TOKEN: "",
    NELA_SANITY_MIGRATION_TEST_API_BASE_URL: `http://127.0.0.1:${address.port}`,
  });
} finally {
  apiServer.closeAllConnections?.();
  await new Promise((resolveClose) => apiServer.close(resolveClose));
}

const dryRunOutput = `${dryRun.stdout}\n${dryRun.stderr}`;
assert.equal(dryRun.code, 0, dryRunOutput);
assert.match(dryRunOutput, /Project ID: 0l7ykvj6/);
assert.match(dryRunOutput, /Dataset: development/);
assert.match(dryRunOutput, /Cantidad de productos: 45/);
assert.match(dryRunOutput, /Modo: DRY RUN/);
assert.match(dryRunOutput, /no se cargaron imágenes ni se escribieron documentos/i);
assert.doesNotMatch(dryRunOutput, /Assertion failed|UV_HANDLE_CLOSING/);
assert.equal(requests.length, 1, "El dry run solo debe consultar los productos existentes.");
assert.equal(requests[0].method, "GET");
assert.match(requests[0].url, /\/data\/query\/development\?/);
assert.equal(requests[0].authorization, undefined, "El dry run público no debe utilizar el token Editor.");
assert.equal(requests.some(({ url }) => url.includes("/data/mutate/")), false);
assert.equal(requests.some(({ url }) => url.includes("/assets/images/")), false);

const productionGuard = await runMigration({
  NODE_ENV: "test",
  NEXT_PUBLIC_SANITY_PROJECT_ID: "0l7ykvj6",
  NEXT_PUBLIC_SANITY_DATASET: "production",
  SANITY_API_WRITE_TOKEN: "",
  NELA_SANITY_MIGRATION_TEST_API_BASE_URL: "http://127.0.0.1:1",
});
const productionOutput = `${productionGuard.stdout}\n${productionGuard.stderr}`;

assert.notEqual(productionGuard.code, 0, "La migración demo a production debe fallar.");
assert.match(productionOutput, /Project ID: 0l7ykvj6/);
assert.match(productionOutput, /Dataset: production/);
assert.match(productionOutput, /Cantidad de productos: 45/);
assert.match(productionOutput, /Modo: DRY RUN/);
assert.match(productionOutput, /PROTECCIÓN ACTIVADA/);

console.log("Migration tests passed: development dry run exits 0 without writes/uploads, and production remains protected.");

function runMigration(overrides) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      windowsHide: true,
      env: { ...process.env, ...overrides },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", rejectRun);
    child.once("close", (code, signal) => resolveRun({ code, signal, stdout, stderr }));
  });
}
