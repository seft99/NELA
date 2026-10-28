import assert from "node:assert/strict";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
const apiVersion = (process.env.SANITY_API_VERSION || "2025-02-19").replace(
  /^v/u,
  "",
);

assert.equal(projectId, "0l7ykvj6", "Unexpected Sanity project ID.");
assert.equal(dataset, "production", "The deployment catalog must use production.");

const query = `*[
  _type == "product" &&
  category == "accesorios-plata" &&
  isDemo != true &&
  !(_id in path("drafts.**"))
]{
  _id,
  name,
  reference,
  "slug": slug.current,
  price,
  "stock": coalesce(stock, inventoryQuantity, 0),
  visible,
  "purchaseEnabled": coalesce(purchaseEnabled, available, false),
  "imageCount": count(images[]),
  "jewelryType": catalogAttributes.jewelryType
}`;
const endpoint = new URL(
  `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
);
endpoint.searchParams.set("query", query);

const response = await fetch(endpoint, {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
});

assert.equal(response.ok, true, `Sanity read failed with HTTP ${response.status}.`);

const payload = await response.json();
const products = payload.result ?? [];
assert.ok(products.length > 0, "Sanity production returned an empty catalog.");

for (const field of ["_id", "reference", "slug"]) {
  const values = products.map((product) => product[field]);
  assert.equal(
    values.every((value) => typeof value === "string" && value.trim().length > 0),
    true,
    `${field} must be present on every product.`,
  );
  assert.equal(new Set(values).size, values.length, `${field} must be unique.`);
}

for (const product of products) {
  assert.equal(typeof product.name, "string", `${product._id} is missing a name.`);
  assert.ok(product.name.trim(), `${product._id} has an empty name.`);
  assert.equal(Number.isFinite(product.price), true, `${product.reference} has an invalid price.`);
  assert.ok(product.price > 0, `${product.reference} must have a positive price.`);
  assert.equal(Number.isInteger(product.stock), true, `${product.reference} has invalid stock.`);
  assert.ok(product.stock >= 0, `${product.reference} has negative stock.`);
  assert.equal(typeof product.visible, "boolean", `${product.reference} has invalid visibility.`);
  assert.equal(
    typeof product.purchaseEnabled,
    "boolean",
    `${product.reference} has invalid purchase eligibility.`,
  );
  assert.ok(product.imageCount > 0, `${product.reference} has no product image.`);
  assert.ok(product.jewelryType, `${product.reference} has no jewelry type.`);
}

const typeCounts = Object.fromEntries(
  [...new Set(products.map((product) => product.jewelryType))]
    .sort()
    .map((type) => [
      type,
      products.filter((product) => product.jewelryType === type).length,
    ]),
);

process.stdout.write(
  `${JSON.stringify(
    {
      projectId,
      dataset,
      products: products.length,
      visible: products.filter((product) => product.visible).length,
      outOfStock: products.filter((product) => product.stock === 0).length,
      types: typeCounts,
    },
    null,
    2,
  )}\nSanity production read verification passed without a write token.\n`,
);
