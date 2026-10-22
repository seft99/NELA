import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";

export const PRODUCTION_PROJECT_ID = "0l7ykvj6";
export const PRODUCTION_DATASET = "production";
export const PRODUCTION_MIGRATION_SOURCE = "nela-production-catalog-v1";
export const EXPECTED_PRODUCT_COUNT = 44;
export const EXPECTED_STOCK_UNITS = 58;
export const EXPECTED_IMAGE_REFERENCES = 50;
export const EXPECTED_UNIQUE_IMAGES = 49;
export const ROSARIO_SKU = "NELA-CA-006";

const EXPECTED_TYPE_COUNTS = Object.freeze({
  anillo: 17,
  argolla: 2,
  cadena: 6,
  dije: 15,
  pulso: 2,
  topo: 2,
});

export const EXPECTED_SKUS = Object.freeze([
  ...sequence("AN", 17),
  ...sequence("AR", 2),
  ...sequence("CA", 6),
  ...sequence("DI", 15),
  ...sequence("PU", 2),
  ...sequence("TO", 2),
]);

const EXCLUDED_TERMS = ["denario", "flor cristal con circon verde"];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function sequence(type, count) {
  return Array.from({ length: count }, (_, index) => `NELA-${type}-${String(index + 1).padStart(3, "0")}`);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

function assertValid(condition, message, errors) {
  if (!condition) errors.push(message);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function clean(value) {
  if (Array.isArray(value)) {
    const cleaned = value.map(clean).filter((item) => item !== undefined);
    return cleaned.length ? cleaned : undefined;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, child]) => [key, clean(child)])
      .filter(([, child]) => child !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  return value;
}

function formatNumericValue(value) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

export function deterministicProductId(sku) {
  return `product-${String(sku).trim().toLocaleLowerCase("en").replace(/[^a-z0-9_-]/g, "-")}`;
}

export function stableImageKey(image, index, sha256) {
  return `image-${index + 1}-${sha256.slice(0, 16)}`;
}

export function transformCanonicalProduct(product) {
  const ringSizes = product.size === null || product.size === undefined
    ? undefined
    : [formatNumericValue(product.size)];
  const lengths = product.lengthCm === null || product.lengthCm === undefined
    ? undefined
    : [`${formatNumericValue(product.lengthCm)} cm`];

  return clean({
    _id: deterministicProductId(product.sku),
    _type: "product",
    name: product.name,
    slug: { _type: "slug", current: product.slug },
    category: "accesorios-plata",
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    currency: product.currency,
    reference: product.sku,
    material: product.material,
    catalogAttributes: {
      _type: "catalogAttributes",
      jewelryType: product.jewelryType,
      ringSizes,
      lengths,
      hasStone: product.hasStone,
    },
    stock: product.stock,
    purchaseEnabled: product.purchaseEnabled,
    featured: product.featured,
    visible: product.visible,
    displayOrder: product.sortOrder,
    legacyId: product.sku,
    migrationSource: product.migrationSource,
    isDemo: false,
  });
}

export function createSanityDocument(product, packageData, assetIdBySha256) {
  const base = transformCanonicalProduct(product);
  return {
    ...base,
    images: product.images.map((image, index) => {
      const asset = packageData.imagesByFile.get(image.file);
      const assetId = assetIdBySha256.get(asset.sha256);
      if (!assetId) throw new Error(`No existe un asset resuelto para ${image.file}.`);
      return {
        _key: stableImageKey(image, index, asset.sha256),
        _type: "image",
        alt: image.alt,
        asset: { _type: "reference", _ref: assetId },
      };
    }),
  };
}

export function buildMigrationPlan(products, existingDocuments) {
  const byId = new Map(existingDocuments.map((document) => [document._id, document]));
  const bySku = new Map(existingDocuments.filter((document) => document.reference).map((document) => [document.reference, document]));
  const bySlug = new Map(existingDocuments.filter((document) => document.slug).map((document) => [document.slug, document]));
  const byLegacyId = new Map(existingDocuments.filter((document) => document.legacyId).map((document) => [document.legacyId, document]));
  const creates = [];
  const skipped = [];
  const conflicts = [];

  for (const product of products) {
    const expected = transformCanonicalProduct(product);
    const existingById = byId.get(expected._id);
    if (existingById) {
      const sameIdentity = existingById.reference === product.sku
        && existingById.slug === product.slug
        && existingById.legacyId === product.sku
        && existingById.migrationSource === PRODUCTION_MIGRATION_SOURCE
        && existingById.isDemo !== true;
      if (sameIdentity) {
        skipped.push({ sku: product.sku, id: expected._id, reason: "El documento idempotente ya existe." });
      } else {
        conflicts.push({ sku: product.sku, id: expected._id, existingId: existingById._id, field: "_id" });
      }
      continue;
    }

    const identityConflicts = [
      ["reference", bySku.get(product.sku)],
      ["slug", bySlug.get(product.slug)],
      ["legacyId", byLegacyId.get(product.sku)],
    ].filter(([, document]) => Boolean(document));
    if (identityConflicts.length) {
      for (const [field, document] of identityConflicts) {
        conflicts.push({ sku: product.sku, id: expected._id, existingId: document._id, field });
      }
      continue;
    }
    creates.push(product);
  }

  return { creates, skipped, conflicts };
}

export async function loadAndValidateProductionPackage(packageDir) {
  const productsPath = join(packageDir, "products.production.json");
  const manifestPath = join(packageDir, "assets-manifest.json");
  const reportPath = join(packageDir, "validation-report.json");
  const imagesDir = join(packageDir, "images");
  const [products, manifest, report, imageEntries] = await Promise.all([
    readJson(productsPath),
    readJson(manifestPath),
    readJson(reportPath),
    readdir(imagesDir, { withFileTypes: true }),
  ]);
  const errors = [];

  assertValid(Array.isArray(products), "products.production.json debe contener un arreglo.", errors);
  assertValid(Array.isArray(manifest), "assets-manifest.json debe contener un arreglo.", errors);
  if (!Array.isArray(products) || !Array.isArray(manifest)) throwValidation(errors);

  assertValid(products.length === EXPECTED_PRODUCT_COUNT, `Se esperaban ${EXPECTED_PRODUCT_COUNT} productos y se encontraron ${products.length}.`, errors);
  assertValid(manifest.length === EXPECTED_UNIQUE_IMAGES, `Se esperaban ${EXPECTED_UNIQUE_IMAGES} entradas de imagen y se encontraron ${manifest.length}.`, errors);
  assertValid(report?.status === "PASS", "El reporte de validación incluido no está en estado PASS.", errors);
  assertValid(report?.targetDataset === PRODUCTION_DATASET, "El reporte no apunta a production.", errors);

  const skus = products.map((product) => product.sku);
  const slugs = products.map((product) => product.slug);
  assertValid(unique(skus), "Los SKU no son únicos.", errors);
  assertValid(unique(slugs), "Los slugs no son únicos.", errors);
  assertValid(
    EXPECTED_SKUS.every((sku) => skus.includes(sku)) && skus.every((sku) => EXPECTED_SKUS.includes(sku)),
    "El conjunto de 44 SKU no coincide con el inventario esperado.",
    errors,
  );

  for (const product of products) {
    const prefix = product?.sku || "Producto sin SKU";
    assertValid(typeof product.sku === "string" && /^NELA-(AN|AR|CA|DI|PU|TO)-\d{3}$/.test(product.sku), `${prefix}: SKU inválido.`, errors);
    assertValid(product.category === "joyeria-plata", `${prefix}: la categoría canónica debe ser joyeria-plata.`, errors);
    assertValid(Object.hasOwn(EXPECTED_TYPE_COUNTS, product.jewelryType), `${prefix}: tipo de joya inválido.`, errors);
    assertValid(typeof product.name === "string" && Boolean(product.name.trim()), `${prefix}: falta el nombre.`, errors);
    assertValid(typeof product.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug), `${prefix}: slug inválido.`, errors);
    assertValid(typeof product.shortDescription === "string" && Boolean(product.shortDescription.trim()), `${prefix}: falta la descripción corta.`, errors);
    assertValid(typeof product.description === "string" && Boolean(product.description.trim()), `${prefix}: falta la descripción completa.`, errors);
    assertValid(product.material === "Plata 925", `${prefix}: el material debe ser Plata 925.`, errors);
    assertValid(Number.isInteger(product.stock) && product.stock >= 0, `${prefix}: stock inválido.`, errors);
    assertValid(product.currency === "COP", `${prefix}: la moneda debe ser COP.`, errors);
    assertValid(Number.isInteger(product.price) && product.price > 0, `${prefix}: precio inválido.`, errors);
    assertValid(typeof product.visible === "boolean", `${prefix}: visible debe ser booleano.`, errors);
    assertValid(typeof product.purchaseEnabled === "boolean", `${prefix}: purchaseEnabled debe ser booleano.`, errors);
    assertValid(typeof product.featured === "boolean", `${prefix}: featured debe ser booleano.`, errors);
    assertValid(Number.isInteger(product.sortOrder) && product.sortOrder >= 0, `${prefix}: sortOrder inválido.`, errors);
    assertValid(typeof product.hasStone === "boolean", `${prefix}: hasStone debe ser booleano.`, errors);
    assertValid(product.size === null || (typeof product.size === "number" && product.size > 0), `${prefix}: talla inválida.`, errors);
    assertValid(product.lengthCm === null || (typeof product.lengthCm === "number" && product.lengthCm > 0), `${prefix}: longitud inválida.`, errors);
    assertValid(product.isDemo === false, `${prefix}: ningún producto puede ser demo.`, errors);
    assertValid(product.migrationSource === PRODUCTION_MIGRATION_SOURCE, `${prefix}: migrationSource inválido.`, errors);
    assertValid(Array.isArray(product.images) && product.images.length > 0, `${prefix}: falta la galería.`, errors);
    for (const image of product.images ?? []) {
      assertValid(typeof image.file === "string" && basename(image.file) === image.file, `${prefix}: ruta de imagen inválida.`, errors);
      assertValid(typeof image.alt === "string" && Boolean(image.alt.trim()), `${prefix}: falta texto alternativo.`, errors);
    }
  }

  const typeCounts = countBy(products, (product) => product.jewelryType);
  assertValid(JSON.stringify(typeCounts) === JSON.stringify(EXPECTED_TYPE_COUNTS), "Las cantidades por tipo no coinciden con el inventario esperado.", errors);
  assertValid(products.reduce((total, product) => total + product.stock, 0) === EXPECTED_STOCK_UNITS, `El stock total debe ser ${EXPECTED_STOCK_UNITS}.`, errors);

  const zeroStock = products.filter((product) => product.stock === 0);
  assertValid(zeroStock.length === 1 && zeroStock[0]?.sku === ROSARIO_SKU, `${ROSARIO_SKU} debe ser el único producto con stock cero.`, errors);
  const rosario = products.find((product) => product.sku === ROSARIO_SKU);
  assertValid(rosario?.stock === 0 && rosario?.visible === false && rosario?.purchaseEnabled === false, `${ROSARIO_SKU} debe permanecer oculto, agotado y con compra deshabilitada.`, errors);

  const imageReferences = products.flatMap((product) => product.images.map((image) => image.file));
  assertValid(imageReferences.length === EXPECTED_IMAGE_REFERENCES, `Se esperaban ${EXPECTED_IMAGE_REFERENCES} referencias de imagen y se encontraron ${imageReferences.length}.`, errors);
  assertValid(new Set(imageReferences).size === EXPECTED_UNIQUE_IMAGES, `Se esperaban ${EXPECTED_UNIQUE_IMAGES} nombres de imagen únicos.`, errors);
  assertValid(imageReferences.filter((file) => file === "CADENA VENECIA.png").length === 2, "CADENA VENECIA.png debe estar referenciada exactamente dos veces.", errors);
  assertValid(!products.some((product) => excluded(product.name) || product.images.some((image) => excluded(image.file))), "El paquete contiene Denario o Dije Flor Cristal con Circón Verde.", errors);

  const actualFiles = imageEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  assertValid(actualFiles.length === EXPECTED_UNIQUE_IMAGES, `La carpeta images debe contener ${EXPECTED_UNIQUE_IMAGES} archivos.`, errors);
  assertValid(actualFiles.every((file) => file.toLocaleLowerCase("en").endsWith(".png")), "Todas las imágenes deben ser PNG.", errors);
  assertValid(unique(actualFiles.map(ambiguousFileKey)), "Existen nombres de imagen ambiguos.", errors);
  assertValid(unique(manifest.map((image) => image.file)), "El manifiesto contiene nombres duplicados.", errors);
  assertValid(unique(manifest.map((image) => image.sha256)), "El manifiesto contiene hashes físicos duplicados.", errors);

  const manifestByFile = new Map(manifest.map((image) => [image.file, image]));
  const imagesByFile = new Map();
  for (const filename of actualFiles) {
    const entry = manifestByFile.get(filename);
    assertValid(Boolean(entry), `La imagen ${filename} no aparece en el manifiesto.`, errors);
    if (!entry) continue;
    const bytes = await readFile(join(imagesDir, filename));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const sha1 = createHash("sha1").update(bytes).digest("hex");
    const isPng = bytes.length >= 24
      && bytes.subarray(0, 8).equals(PNG_SIGNATURE)
      && bytes.subarray(12, 16).toString("ascii") === "IHDR";
    assertValid(isPng, `${filename} no es un PNG válido.`, errors);
    assertValid(entry.mimeType === "image/png", `${filename}: mimeType inválido en el manifiesto.`, errors);
    assertValid(entry.sizeBytes === bytes.byteLength, `${filename}: tamaño distinto al manifiesto.`, errors);
    assertValid(entry.sha256 === sha256, `${filename}: SHA-256 distinto al manifiesto.`, errors);
    assertValid(entry.width === bytes.readUInt32BE(16) && entry.height === bytes.readUInt32BE(20), `${filename}: dimensiones distintas al manifiesto.`, errors);
    imagesByFile.set(filename, { ...entry, bytes, sha256, sha1, filePath: join(imagesDir, filename) });
  }

  for (const filename of imageReferences) {
    assertValid(actualFiles.includes(filename), `Falta la imagen referenciada ${filename}.`, errors);
  }
  for (const entry of manifest) {
    assertValid(actualFiles.includes(entry.file), `El manifiesto referencia un archivo inexistente: ${entry.file}.`, errors);
  }

  if (errors.length) throwValidation(errors);
  return {
    packageDir,
    products,
    manifest,
    report,
    imagesDir,
    imagesByFile,
    imageReferences,
    typeCounts,
  };
}

export function summarizePlan(packageData, plan) {
  const assetHashes = new Set(plan.creates.flatMap((product) => product.images.map((image) => packageData.imagesByFile.get(image.file).sha256)));
  return {
    products: packageData.products.length,
    stockUnits: packageData.products.reduce((total, product) => total + product.stock, 0),
    typeCounts: packageData.typeCounts,
    imageReferences: packageData.imageReferences.length,
    uniqueImages: packageData.imagesByFile.size,
    productsToCreate: plan.creates.length,
    productsSkipped: plan.skipped.length,
    conflicts: plan.conflicts,
    assetsToUploadOrReuse: assetHashes.size,
    documentIdsToCreate: plan.creates.map((product) => deterministicProductId(product.sku)),
  };
}

export function buildAssetPlan(packageData, products, existingAssets = []) {
  const existingBySha1 = new Map(existingAssets.filter((asset) => asset.sha1hash).map((asset) => [asset.sha1hash, asset._id]));
  const referencedFiles = [...new Set(products.flatMap((product) => product.images.map((image) => image.file)))];
  const uniqueImages = [...new Map(referencedFiles.map((file) => {
    const image = packageData.imagesByFile.get(file);
    return [image.sha256, image];
  })).values()];
  const upload = [];
  const reuse = [];
  for (const image of uniqueImages) {
    const existingAssetId = existingBySha1.get(image.sha1);
    if (existingAssetId) reuse.push({ file: image.file, sha256: image.sha256, assetId: existingAssetId });
    else upload.push({ file: image.file, sha256: image.sha256 });
  }
  return { upload, reuse, uniqueImages };
}

export function verifyImportedDocuments(documents) {
  const errors = [];
  assertValid(documents.length === EXPECTED_PRODUCT_COUNT, `Production debe contener exactamente ${EXPECTED_PRODUCT_COUNT} productos publicados.`, errors);
  assertValid(documents.every((document) => !String(document._id).startsWith("drafts.")), "Se encontraron borradores.", errors);
  assertValid(documents.every((document) => document.isDemo === false), "Se encontraron productos demo.", errors);
  assertValid(documents.every((document) => document.migrationSource === PRODUCTION_MIGRATION_SOURCE), "Hay productos con un origen de migración distinto.", errors);
  assertValid(documents.every((document) => document.category === "accesorios-plata"), "Hay productos fuera de la categoría pública esperada.", errors);
  assertValid(unique(documents.map((document) => document.reference)), "Los SKU publicados no son únicos.", errors);
  assertValid(unique(documents.map((document) => document.slug)), "Los slugs publicados no son únicos.", errors);
  const imageRefs = documents.flatMap((document) => document.images ?? []);
  assertValid(imageRefs.length === EXPECTED_IMAGE_REFERENCES, `Se esperaban ${EXPECTED_IMAGE_REFERENCES} referencias de asset.`, errors);
  assertValid(new Set(imageRefs).size === EXPECTED_UNIQUE_IMAGES, `Se esperaban ${EXPECTED_UNIQUE_IMAGES} assets únicos.`, errors);
  const rosario = documents.find((document) => document.reference === ROSARIO_SKU);
  assertValid(rosario?.stock === 0 && rosario?.visible === false && rosario?.purchaseEnabled === false, `${ROSARIO_SKU} no conserva su estado protegido.`, errors);
  if (errors.length) throwValidation(errors);
  return { products: documents.length, imageReferences: imageRefs.length, uniqueAssets: new Set(imageRefs).size };
}

function countBy(values, selector) {
  return Object.fromEntries([...new Set(values.map(selector))].sort().map((key) => [key, values.filter((value) => selector(value) === key).length]));
}

function ambiguousFileKey(filename) {
  return normalizeText(filename).replace(/\s+/g, " ");
}

function excluded(value) {
  const normalized = normalizeText(value);
  return EXCLUDED_TERMS.some((term) => normalized.includes(term));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function throwValidation(errors) {
  throw new Error(`El paquete de producción no superó la validación:\n- ${errors.join("\n- ")}`);
}
