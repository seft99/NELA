import { resolve } from "node:path";
import {
  EXPECTED_IMAGE_REFERENCES,
  EXPECTED_PRODUCT_COUNT,
  EXPECTED_UNIQUE_IMAGES,
  PRODUCTION_DATASET,
  PRODUCTION_PROJECT_ID,
  buildAssetPlan,
  buildMigrationPlan,
  createSanityDocument,
  loadAndValidateProductionPackage,
  summarizePlan,
  verifyImportedDocuments,
} from "./production-migration-lib.mjs";

const APPLY_FLAG = "--apply";
const CONFIRM_FLAG = "--confirm-production";
const VERIFY_FLAG = "--verify";
const apply = process.argv.includes(APPLY_FLAG);
const verify = process.argv.includes(VERIFY_FLAG);
const confirmed = process.argv.includes(CONFIRM_FLAG);
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.SANITY_MIGRATION_DATASET?.trim();
const apiVersion = (process.env.SANITY_API_VERSION || "2025-02-19").replace(/^v/, "");
const testApiBaseUrl = process.env.NODE_ENV === "test"
  ? process.env.NELA_PRODUCTION_MIGRATION_TEST_API_BASE_URL?.trim().replace(/\/$/, "")
  : undefined;
const packageDir = resolve(process.cwd(), "imports", "nela-production");

if (apply && verify) throw new Error("No combines --apply y --verify.");
if (projectId !== PRODUCTION_PROJECT_ID) {
  throw new Error(`NEXT_PUBLIC_SANITY_PROJECT_ID debe ser exactamente ${PRODUCTION_PROJECT_ID}.`);
}
if (dataset !== PRODUCTION_DATASET) {
  throw new Error("PROTECCIÓN ACTIVADA: SANITY_MIGRATION_DATASET debe ser exactamente production.");
}

const writeToken = apply ? process.env.SANITY_API_WRITE_TOKEN?.trim() : undefined;
if (apply && !confirmed) {
  throw new Error(`La escritura real requiere la confirmación adicional ${CONFIRM_FLAG}.`);
}
if (apply && !writeToken) {
  throw new Error("La escritura real requiere SANITY_API_WRITE_TOKEN exclusivamente en el servidor.");
}

const packageData = await loadAndValidateProductionPackage(packageDir);
if (packageData.products.length !== EXPECTED_PRODUCT_COUNT
  || packageData.imageReferences.length !== EXPECTED_IMAGE_REFERENCES
  || packageData.imagesByFile.size !== EXPECTED_UNIQUE_IMAGES) {
  throw new Error("Las cantidades del paquete cambiaron después de la validación.");
}
printTargetConfirmation();

if (verify) {
  const documents = await listVerificationDocuments();
  const result = verifyImportedDocuments(documents);
  console.log(JSON.stringify({ mode: "verify", projectId, dataset, ...result }, null, 2));
  console.log("VERIFICACIÓN COMPLETADA: el dataset production coincide con el inventario real esperado.");
} else {
  const existingDocuments = await listExistingProducts();
  const plan = buildMigrationPlan(packageData.products, existingDocuments);
  const existingAssets = await listExistingAssets();
  const assetPlan = buildAssetPlan(packageData, plan.creates, existingAssets);
  const summary = summarizePlan(packageData, plan);
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    projectId,
    dataset,
    ...summary,
    assetsToUpload: assetPlan.upload.length,
    assetsToReuse: assetPlan.reuse.length,
    assetFilesToUpload: assetPlan.upload.map((asset) => asset.file),
  }, null, 2));

  if (plan.conflicts.length) {
    throw new Error(`La migración se detuvo por ${plan.conflicts.length} conflicto(s) de ID, SKU o slug.`);
  }

  if (!apply) {
    console.log("DRY RUN COMPLETADO: no se creó cliente de escritura, no se cargaron imágenes y no se enviaron mutaciones.");
  } else if (!plan.creates.length) {
    console.log("MIGRACIÓN IDEMPOTENTE: los 44 documentos ya existen y no se realizaron escrituras.");
  } else {
    await applyMigration(plan, assetPlan);
  }
}

async function applyMigration(plan, assetPlan) {
  const productsToCreate = plan.creates;
  const reusableAssets = new Map(assetPlan.reuse.map((asset) => [asset.sha256, asset.assetId]));
  const assetIdBySha256 = new Map();

  for (const image of assetPlan.uniqueImages) {
    const existingId = reusableAssets.get(image.sha256);
    const assetId = existingId || await uploadImage(image);
    assetIdBySha256.set(image.sha256, assetId);
    console.log(`${existingId ? "ASSET REUTILIZADO" : "ASSET CARGADO"}: ${image.file}`);
  }

  const refreshedPlan = buildMigrationPlan(packageData.products, await listExistingProducts());
  if (refreshedPlan.conflicts.length) {
    throw new Error("La escritura se detuvo porque apareció un conflicto después de cargar los assets.");
  }
  const expectedCreateIds = new Set(productsToCreate.map((product) => product.sku));
  const refreshedCreateIds = new Set(refreshedPlan.creates.map((product) => product.sku));
  if (expectedCreateIds.size !== refreshedCreateIds.size || [...expectedCreateIds].some((sku) => !refreshedCreateIds.has(sku))) {
    throw new Error("El estado remoto cambió durante la migración. No se crearán documentos en esta ejecución.");
  }

  const documents = productsToCreate.map((product) => createSanityDocument(product, packageData, assetIdBySha256));
  const mutations = documents.map((document) => ({ createIfNotExists: document }));
  await sanityRequest(`data/mutate/${dataset}?returnDocuments=false`, {
    method: "POST",
    body: JSON.stringify({ mutations }),
  }, true);
  for (const product of productsToCreate) console.log(`DOCUMENTO CREADO: ${product.sku}`);
  console.log(`MIGRACIÓN COMPLETADA: ${documents.length} documentos publicados mediante createIfNotExists.`);
}

async function listExistingProducts() {
  const query = `*[_type == "product"]{
    _id,
    reference,
    "slug": slug.current,
    legacyId,
    migrationSource,
    isDemo
  }`;
  const payload = await sanityRequest(`data/query/${dataset}?query=${encodeURIComponent(query)}`);
  return payload.result ?? [];
}

async function listExistingAssets() {
  const query = `*[_type == "sanity.imageAsset"]{_id, sha1hash}`;
  const payload = await sanityRequest(`data/query/${dataset}?query=${encodeURIComponent(query)}`);
  return payload.result ?? [];
}

async function listVerificationDocuments() {
  const query = `*[_type == "product"]{
    _id,
    reference,
    "slug": slug.current,
    category,
    stock,
    visible,
    purchaseEnabled,
    migrationSource,
    isDemo,
    "images": images[].asset._ref
  }`;
  const payload = await sanityRequest(`data/query/${dataset}?query=${encodeURIComponent(query)}`);
  return payload.result ?? [];
}

async function uploadImage(image) {
  const payload = await sanityRequest(
    `assets/images/${dataset}?filename=${encodeURIComponent(image.file)}`,
    { method: "POST", headers: { "Content-Type": "image/png" }, body: image.bytes },
    true,
  );
  if (!payload.document?._id) throw new Error(`Sanity no confirmó el asset ${image.file}.`);
  return payload.document._id;
}

async function sanityRequest(path, init = {}, requireWriteToken = false) {
  const headers = new Headers(init.headers || {});
  if (requireWriteToken) {
    if (!writeToken) throw new Error("Falta el token de escritura del servidor.");
    headers.set("Authorization", `Bearer ${writeToken}`);
  }
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  const apiBaseUrl = testApiBaseUrl || `https://${projectId}.api.sanity.io`;
  const response = await fetch(`${apiBaseUrl}/v${apiVersion}/${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Sanity respondió con estado ${response.status}.`);
  }
  return response.json();
}

function printTargetConfirmation() {
  if (apply) console.log("ADVERTENCIA: ESCRITURA EN PRODUCTION");
  console.log([
    `Project ID: ${projectId}`,
    `Dataset: ${dataset}`,
    apply ? `Productos: ${packageData.products.length}` : `Productos esperados: ${packageData.products.length}`,
    apply ? null : `Imágenes referenciadas: ${packageData.imageReferences.length}`,
    `Imágenes únicas: ${packageData.imagesByFile.size}`,
    `Modo: ${verify ? "VERIFY" : apply ? "APPLY" : "DRY RUN"}`,
  ].filter(Boolean).join("\n"));
}

