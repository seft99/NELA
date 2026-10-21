import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  cacheDir: resolve(tmpdir(), `nela-catalog-tests-${process.pid}`),
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
  resolve: { alias: { "@": process.cwd() } },
});

try {
  const catalog = await server.ssrLoadModule("/data/demo-products.ts");
  const productRepository = await server.ssrLoadModule("/lib/products/index.ts");
  const publicDetails = await server.ssrLoadModule("/lib/products/public-details.ts");
  const catalogFilters = await server.ssrLoadModule("/lib/products/catalog-filters.ts");
  const categories = ["skincare", "accesorios-plata", "manillas-oro"];

  assert.equal(catalog.baseDemoProducts.length, 9);
  assert.equal(catalog.expandedDemoProducts.length, 45);
  assert.equal(catalog.demoProducts.length, 45);

  for (const category of categories) {
    assert.equal(
      catalog.baseDemoProducts.filter((product) => product.category === category).length,
      3,
    );
    assert.equal(
      catalog.expandedDemoProducts.filter((product) => product.category === category).length,
      15,
    );
  }

  for (const field of ["id", "slug", "name", "price"]) {
    const values = catalog.expandedDemoProducts.map((product) => product[field]);
    assert.equal(new Set(values).size, values.length, `${field} must be unique`);
  }

  assert.equal(catalog.expandedDemoProducts.every((product) => product.isDemo), true);
  assert.equal(catalog.expandedDemoProducts.every((product) => product.visible), true);
  assert.equal(catalog.expandedDemoProducts.every((product) => product.images.length > 0), true);
  const publicCatalog = await productRepository.getProducts();
  assert.equal(publicCatalog.length, 15);
  assert.equal(publicCatalog.every((product) => product.category === "accesorios-plata"), true);
  assert.equal(publicCatalog.every((product) => !("stock" in product)), true);
  assert.equal(publicCatalog.every((product) => !("variantInventory" in product)), true);
  const inventoryValidationCatalog = await productRepository.getProductsForInventoryValidation();
  assert.equal(inventoryValidationCatalog.length, 15);
  assert.equal(inventoryValidationCatalog.every((product) => product.category === "accesorios-plata"), true);
  const silverDemoProducts = catalog.expandedDemoProducts.filter((product) => product.category === "accesorios-plata");
  assert.equal(silverDemoProducts.every((product) => Boolean(product.catalogAttributes?.jewelryType)), true);
  assert.deepEqual(
    [...new Set(silverDemoProducts.map((product) => product.catalogAttributes.jewelryType))].sort(),
    ["anillo", "arete", "cadena", "collar", "dije", "ear-cuff", "pulsera", "tobillera"],
  );

  assert.deepEqual(
    publicDetails.getPublicProductDetails({
      category: "skincare",
      presentation: "Frasco con dosificador",
      quantityOrVolume: "  ",
      material: "Dato irrelevante",
    }),
    [{ key: "presentation", label: "Presentación", value: "Frasco con dosificador" }],
  );
  assert.deepEqual(
    publicDetails.getPublicProductDetails({
      category: "accesorios-plata",
      material: "Plata 925",
      finish: "Pulido",
      measurements: "45 cm",
      quantityOrVolume: "Dato irrelevante",
    }).map(({ label, value }) => `${label}: ${value}`),
    ["Material: Plata 925", "Color o acabado: Pulido", "Medidas: 45 cm"],
  );

  const filterFixtures = [
    {
      ...catalog.expandedDemoProducts.find((product) => product.category === "accesorios-plata"),
      id: "filter-ring-woman",
      name: "Anillo verificado",
      price: 90000,
      stock: 4,
      available: true,
      finish: "Pulido",
      catalogAttributes: { audience: "mujer", jewelryType: "anillo", ringSizes: ["6", "7"], stone: "Cuarzo" },
    },
    {
      ...catalog.expandedDemoProducts.find((product) => product.category === "accesorios-plata"),
      id: "filter-chain-unisex",
      name: "Cadena verificada",
      price: 120000,
      stock: 2,
      available: true,
      finish: "Mate",
      catalogAttributes: { audience: "unisex", jewelryType: "cadena", lengths: ["45 cm"], weaveType: "Tejido A" },
    },
    {
      ...catalog.expandedDemoProducts.find((product) => product.category === "accesorios-plata"),
      id: "filter-pendant-man",
      name: "Dije verificado",
      price: 70000,
      stock: 0,
      available: false,
      catalogAttributes: { audience: "hombre", jewelryType: "dije", motif: "Geométrico" },
    },
  ];
  const options = catalogFilters.getCatalogFilterOptions(filterFixtures);
  assert.equal(options.minPrice, 70000);
  assert.equal(options.maxPrice, 120000);
  assert.deepEqual(options.audiences, ["hombre", "mujer", "unisex"]);
  assert.deepEqual(options.jewelryTypes, ["anillo", "cadena", "dije"]);
  assert.equal(catalogFilters.jewelryFilterLabels.arete, "Aretes y topos");
  assert.deepEqual(
    catalogFilters.getCatalogPriceRanges(filterFixtures).map((range) => range.id),
    ["hasta-80000", "80000-100000", "100000-120000"],
  );

  const orWithinType = catalogFilters.filterCatalogProducts(filterFixtures, {
    ...catalogFilters.emptyCatalogFilters,
    jewelryTypes: ["anillo", "cadena"],
  });
  assert.deepEqual(orWithinType.map((product) => product.id), ["filter-ring-woman", "filter-chain-unisex"]);

  const publicTypeFixtures = [
    { ...filterFixtures[0], id: "filter-earring", catalogAttributes: { jewelryType: "arete" } },
    { ...filterFixtures[0], id: "filter-stud", catalogAttributes: { jewelryType: "topo" } },
    { ...filterFixtures[0], id: "filter-bracelet", catalogAttributes: { jewelryType: "pulsera" } },
    { ...filterFixtures[0], id: "filter-necklace", catalogAttributes: { jewelryType: "collar" } },
    { ...filterFixtures[0], id: "filter-ear-cuff", catalogAttributes: { jewelryType: "ear-cuff" } },
    { ...filterFixtures[0], id: "filter-anklet", catalogAttributes: { jewelryType: "tobillera" } },
  ];
  assert.deepEqual(
    catalogFilters.getCatalogFilterOptions(publicTypeFixtures).jewelryTypes,
    ["arete", "pulsera"],
  );
  assert.deepEqual(
    catalogFilters.filterCatalogProducts(publicTypeFixtures, {
      ...catalogFilters.emptyCatalogFilters,
      jewelryTypes: ["arete"],
    }).map((product) => product.id),
    ["filter-earring", "filter-stud"],
  );

  const andAcrossGroups = catalogFilters.filterCatalogProducts(filterFixtures, {
    ...catalogFilters.emptyCatalogFilters,
    jewelryTypes: ["anillo", "cadena"],
    audiences: ["unisex"],
    minPrice: 100000,
    availableOnly: true,
  });
  assert.deepEqual(andAcrossGroups.map((product) => product.id), ["filter-chain-unisex"]);

  const orWithinPrice = catalogFilters.filterCatalogProducts(filterFixtures, {
    ...catalogFilters.emptyCatalogFilters,
    priceRanges: ["hasta-80000", "100000-120000"],
  });
  assert.deepEqual(orWithinPrice.map((product) => product.id), ["filter-chain-unisex", "filter-pendant-man"]);

  assert.deepEqual(
    catalogFilters.filterCatalogProducts(filterFixtures, {
      ...catalogFilters.emptyCatalogFilters,
      ringSizes: ["7"],
    }).map((product) => product.id),
    ["filter-ring-woman"],
  );
  assert.equal(
    catalogFilters.filterCatalogProducts(filterFixtures, {
      ...catalogFilters.emptyCatalogFilters,
      minPrice: 200000,
    }).length,
    0,
  );

  console.log("Catalog tests passed: demo data, public details, price limits, OR/AND filters, attributes and empty results.");
} finally {
  await server.close();
}
