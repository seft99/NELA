import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import {
  EXPECTED_IMAGE_REFERENCES,
  EXPECTED_PRODUCT_COUNT,
  EXPECTED_SKUS,
  EXPECTED_UNIQUE_IMAGES,
  PRODUCTION_MIGRATION_SOURCE,
  buildAssetPlan,
  buildMigrationPlan,
  deterministicProductId,
  loadAndValidateProductionPackage,
  transformCanonicalProduct,
  verifyImportedDocuments,
} from "./production-migration-lib.mjs";

const projectRoot = process.cwd();
const packageDir = resolve(projectRoot, "imports", "nela-production");
const packageData = await loadAndValidateProductionPackage(packageDir);

assert.equal(packageData.products.length, EXPECTED_PRODUCT_COUNT);
assert.equal(packageData.imagesByFile.size, EXPECTED_UNIQUE_IMAGES);
assert.equal(packageData.imageReferences.length, EXPECTED_IMAGE_REFERENCES);
assert.deepEqual(packageData.products.map((product) => product.sku).sort(), [...EXPECTED_SKUS].sort());
assert.equal(packageData.products.some((product) => product.isDemo), false);
assert.equal(packageData.products.every((product) => product.migrationSource === PRODUCTION_MIGRATION_SOURCE), true);
assert.equal(packageData.products.reduce((total, product) => total + product.stock, 0), 58);

const rosario = packageData.products.find((product) => product.sku === "NELA-CA-006");
assert.deepEqual(
  { stock: rosario.stock, visible: rosario.visible, purchaseEnabled: rosario.purchaseEnabled },
  { stock: 0, visible: false, purchaseEnabled: false },
);
assert.equal(packageData.products.filter((product) => product.stock === 0).length, 1);
assert.equal(packageData.products.some((product) => /denario|flor cristal/i.test(product.name)), false);

const veneciaProducts = packageData.products.filter((product) => product.images.some((image) => image.file === "CADENA VENECIA.png"));
assert.equal(veneciaProducts.length, 2);
assert.equal(
  packageData.imagesByFile.get(veneciaProducts[0].images[0].file).sha256,
  packageData.imagesByFile.get(veneciaProducts[1].images[0].file).sha256,
);

const ring = packageData.products.find((product) => product.sku === "NELA-AN-001");
const transformedRing = transformCanonicalProduct(ring);
assert.equal(transformedRing._id, "product-nela-an-001");
assert.equal(deterministicProductId(ring.sku), transformedRing._id);
assert.equal(transformedRing.category, "accesorios-plata");
assert.equal(transformedRing.reference, ring.sku);
assert.equal(transformedRing.currency, "COP");
assert.deepEqual(transformedRing.catalogAttributes.ringSizes, ["5"]);
assert.equal(transformedRing.catalogAttributes.hasStone, true);
assert.equal(transformedRing.isDemo, false);
assert.equal("images" in transformedRing, false);

const emptyPlan = buildMigrationPlan(packageData.products, []);
assert.equal(emptyPlan.creates.length, EXPECTED_PRODUCT_COUNT);
assert.equal(emptyPlan.skipped.length, 0);
assert.equal(emptyPlan.conflicts.length, 0);
const emptyAssetPlan = buildAssetPlan(packageData, emptyPlan.creates, []);
assert.equal(emptyAssetPlan.upload.length, EXPECTED_UNIQUE_IMAGES);
assert.equal(emptyAssetPlan.reuse.length, 0);
const veneciaAsset = packageData.imagesByFile.get("CADENA VENECIA.png");
const reusedAssetPlan = buildAssetPlan(packageData, emptyPlan.creates, [{ _id: "image-existing-venecia", sha1hash: veneciaAsset.sha1 }]);
assert.equal(reusedAssetPlan.upload.length, EXPECTED_UNIQUE_IMAGES - 1);
assert.equal(reusedAssetPlan.reuse.length, 1);

const existingIdentities = packageData.products.map((product) => ({
  _id: deterministicProductId(product.sku),
  reference: product.sku,
  slug: product.slug,
  legacyId: product.sku,
  migrationSource: PRODUCTION_MIGRATION_SOURCE,
  isDemo: false,
}));
const idempotentPlan = buildMigrationPlan(packageData.products, existingIdentities);
assert.equal(idempotentPlan.creates.length, 0);
assert.equal(idempotentPlan.skipped.length, EXPECTED_PRODUCT_COUNT);
assert.equal(idempotentPlan.conflicts.length, 0);

const idConflict = buildMigrationPlan([ring], [{ ...existingIdentities[0], reference: "OTRO-SKU" }]);
assert.equal(idConflict.conflicts.some((conflict) => conflict.field === "_id"), true);
const skuConflict = buildMigrationPlan([ring], [{ ...existingIdentities[0], _id: "product-externo", slug: "otro-slug", legacyId: "otro-id" }]);
assert.equal(skuConflict.conflicts.some((conflict) => conflict.field === "reference"), true);
const slugConflict = buildMigrationPlan([ring], [{ ...existingIdentities[0], _id: "product-externo", reference: "OTRO-SKU", legacyId: "otro-id" }]);
assert.equal(slugConflict.conflicts.some((conflict) => conflict.field === "slug"), true);

const assetIdByFile = new Map([...packageData.imagesByFile.keys()].map((file, index) => [file, `image-asset-${index}`]));
const verificationDocuments = packageData.products.map((product) => ({
  _id: deterministicProductId(product.sku),
  reference: product.sku,
  slug: product.slug,
  category: "accesorios-plata",
  stock: product.stock,
  visible: product.visible,
  purchaseEnabled: product.purchaseEnabled,
  migrationSource: product.migrationSource,
  isDemo: false,
  images: product.images.map((image) => assetIdByFile.get(image.file)),
}));
assert.deepEqual(verifyImportedDocuments(verificationDocuments), {
  products: EXPECTED_PRODUCT_COUNT,
  imageReferences: EXPECTED_IMAGE_REFERENCES,
  uniqueAssets: EXPECTED_UNIQUE_IMAGES,
});

const publicRepository = await readFile(resolve(projectRoot, "lib", "products", "index.ts"), "utf8");
const productPage = await readFile(resolve(projectRoot, "app", "productos", "[slug]", "page.tsx"), "utf8");
assert.doesNotMatch(publicRepository, /data\/demo-products/);
assert.doesNotMatch(productPage, /data\/demo-products|demoProducts/);
assert.match(publicRepository, /isDemo != true/);

const requests = [];
const server = createServer((request, response) => {
  requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization });
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ result: [] }));
});
await new Promise((resolveListen, rejectListen) => {
  server.once("error", rejectListen);
  server.listen(0, "127.0.0.1", resolveListen);
});

try {
  const address = server.address();
  const secretSentinel = "TOKEN-QUE-NUNCA-DEBE-APARECER";
  const baseEnv = {
    ...process.env,
    NODE_ENV: "test",
    NEXT_PUBLIC_SANITY_PROJECT_ID: "0l7ykvj6",
    SANITY_MIGRATION_DATASET: "production",
    SANITY_API_WRITE_TOKEN: secretSentinel,
    NELA_PRODUCTION_MIGRATION_TEST_API_BASE_URL: `http://127.0.0.1:${address.port}`,
  };
  const dryRun = await runMigration([], baseEnv);
  assert.equal(dryRun.code, 0, dryRun.stderr || dryRun.stdout);
  assert.match(dryRun.stdout, /Project ID: 0l7ykvj6/);
  assert.match(dryRun.stdout, /Dataset: production/);
  assert.match(dryRun.stdout, /Productos esperados: 44/);
  assert.match(dryRun.stdout, /Imágenes referenciadas: 50/);
  assert.match(dryRun.stdout, /Imágenes únicas: 49/);
  assert.match(dryRun.stdout, /Modo: DRY RUN/);
  assert.match(dryRun.stdout, /productsToCreate": 44/);
  assert.match(dryRun.stdout, /assetsToUpload": 49/);
  assert.match(dryRun.stdout, /assetsToReuse": 0/);
  assert.match(dryRun.stdout, /DRY RUN COMPLETADO/);
  assert.doesNotMatch(`${dryRun.stdout}${dryRun.stderr}`, new RegExp(secretSentinel));
  assert.equal(requests.length, 2);
  assert.equal(requests.every((request) => request.method === "GET"), true);
  assert.equal(requests.every((request) => !request.authorization), true);
  assert.equal(requests.some((request) => /mutate|assets\/images/.test(request.url)), false);

  const unsafeDataset = await runMigration([], { ...baseEnv, SANITY_MIGRATION_DATASET: "development" });
  assert.notEqual(unsafeDataset.code, 0);
  assert.match(`${unsafeDataset.stdout}${unsafeDataset.stderr}`, /debe ser exactamente production/);

  const missingConfirmation = await runMigration(["--apply"], baseEnv);
  assert.notEqual(missingConfirmation.code, 0);
  assert.match(`${missingConfirmation.stdout}${missingConfirmation.stderr}`, /--confirm-production/);
  assert.doesNotMatch(`${missingConfirmation.stdout}${missingConfirmation.stderr}`, new RegExp(secretSentinel));
  assert.equal(requests.length, 2);
} finally {
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
}

console.log("Production migration tests passed: package, transformation, dry run, protection, idempotency and conflicts.");

function runMigration(args, env) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [resolve(projectRoot, "scripts", "migrate-production-products-to-sanity.mjs"), ...args], {
      cwd: projectRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
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
