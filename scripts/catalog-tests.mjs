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
  const publicCopy = await server.ssrLoadModule("/lib/products/public-copy.ts");
  const displayDetails = await server.ssrLoadModule("/lib/products/display-details.ts");
  const catalogFilters = await server.ssrLoadModule("/lib/products/catalog-filters.ts");
  const explorerConfig = await server.ssrLoadModule("/config/catalog-explorer.ts");
  const silverCollectionConfig = await server.ssrLoadModule("/config/silver-collections.ts");
  const carousel = await server.ssrLoadModule("/lib/products/carousel.ts");
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
  assert.equal(publicCatalog.length, 0, "El catálogo público nunca debe usar fixtures demo como fallback.");
  await assert.rejects(
    productRepository.getProductsForInventoryValidation(),
    /Sanity no está configurado/,
  );
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
    ["Material: Plata ley 925", "Color o acabado: Pulido", "Medidas: 45 cm"],
  );
  assert.equal(
    publicCopy.clarifyGreenZirconCopy("Piedra Verde, una piedra verde, la piedra verde y piedras verdes"),
    "Circón Verde, un circón verde, el circón verde y circones verdes",
  );
  assert.equal(
    publicCopy.clarifyGreenZirconCopy("Piedras verdes como detalle principal, rodeadas por elementos claros"),
    "Circones verdes como detalle principal, rodeados por elementos claros",
  );
  assert.equal(
    displayDetails.getProductDisplayDetails({
      category: "accesorios-plata",
      name: "Espiral Aurora con Circón Verde",
      shortDescription: "Anillo con un circón verde.",
      description: "Anillo con un circón verde.",
      catalogAttributes: { jewelryType: "anillo", hasStone: true },
    }).find((detail) => detail.key === "hasStone")?.value,
    "Con circón verde",
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
  assert.deepEqual(options.jewelryTypes, ["anillo", "cadena", "dije"]);
  assert.deepEqual(options.productTypes, ["anillo", "cadena", "dije"]);
  assert.deepEqual(options.ringSizes, ["6", "7"]);
  assert.deepEqual(options.lengths, ["45 cm"]);
  assert.equal(options.hasAvailabilityDifference, true);
  assert.equal(
    catalogFilters.filterCatalogProducts(filterFixtures, catalogFilters.emptyCatalogFilters)
      .some((product) => product.id === "filter-pendant-man"),
    true,
    "Los productos visibles sin stock deben permanecer en el catálogo.",
  );
  assert.equal(catalogFilters.jewelryFilterLabels.arete, "Aretes y topos");
  assert.deepEqual(explorerConfig.catalogExplorerConfigs.anillos.sortOptions, ["default", "price-asc", "price-desc", "name-asc", "name-desc"]);
  assert.equal(explorerConfig.catalogExplorerConfigs["aretes-y-topos"].earringType, true);
  assert.equal(explorerConfig.catalogExplorerConfigs.pulseras.search, false);

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
  assert.deepEqual(
    catalogFilters.filterCatalogProducts(publicTypeFixtures, {
      ...catalogFilters.emptyCatalogFilters,
      productTypes: ["topo"],
    }).map((product) => product.id),
    ["filter-stud"],
  );

  assert.deepEqual(
    silverCollectionConfig.silverCollections.map((collection) => collection.slug),
    ["anillos", "aretes-y-topos", "cadenas", "dijes", "pulseras"],
  );
  const ringCollection = silverCollectionConfig.getSilverCollection("anillos");
  const earringsCollection = silverCollectionConfig.getSilverCollection("aretes-y-topos");
  assert.equal(silverCollectionConfig.belongsToSilverCollection(filterFixtures[0], ringCollection), true);
  assert.equal(silverCollectionConfig.belongsToSilverCollection(filterFixtures[1], ringCollection), false);
  assert.equal(silverCollectionConfig.belongsToSilverCollection(publicTypeFixtures[1], earringsCollection), true);
  const ringSlides = carousel.getProductCarouselSlides([
    { ...filterFixtures[0], images: [
      { src: "/ring-one.png", alt: "Anillo uno" },
      { src: "/ring-two.png", alt: "Anillo dos" },
    ] },
  ], ringCollection.heroImages);
  assert.deepEqual(ringSlides.map((slide) => slide.src), ["/ring-one.png", "/ring-two.png"]);
  const fallbackSlides = carousel.getProductCarouselSlides([
    { ...filterFixtures[0], images: [{ src: "/single-ring.png", alt: "Anillo único" }] },
  ], ringCollection.heroImages);
  assert.deepEqual(fallbackSlides.map((slide) => slide.src), ringCollection.heroImages.map((slide) => slide.src));

  const andAcrossGroups = catalogFilters.filterCatalogProducts(filterFixtures, {
    ...catalogFilters.emptyCatalogFilters,
    jewelryTypes: ["cadena"],
    lengths: ["45 cm"],
    minPrice: 100000,
    availableOnly: true,
  });
  assert.deepEqual(andAcrossGroups.map((product) => product.id), ["filter-chain-unisex"]);

  const numericPriceRange = catalogFilters.filterCatalogProducts(filterFixtures, {
    ...catalogFilters.emptyCatalogFilters,
    minPrice: 80000,
    maxPrice: 100000,
  });
  assert.deepEqual(numericPriceRange.map((product) => product.id), ["filter-ring-woman"]);

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

  const searchFixtures = [
    { ...filterFixtures[0], id: "search-venecia", name: "Cadena Venécia", reference: "NELA-CA-002" },
    { ...filterFixtures[0], id: "search-brisa", name: "Brisa Verde", reference: "NELA-AN-006" },
  ];
  assert.deepEqual(
    catalogFilters.filterCatalogProducts(searchFixtures, {
      ...catalogFilters.emptyCatalogFilters,
      query: "  VENECIA  ",
    }).map((product) => product.id),
    ["search-venecia"],
  );
  assert.deepEqual(
    catalogFilters.filterCatalogProducts(searchFixtures, {
      ...catalogFilters.emptyCatalogFilters,
      query: "ca-00",
    }).map((product) => product.id),
    ["search-venecia"],
  );
  assert.deepEqual(
    catalogFilters.filterCatalogProducts([
      ...filterFixtures,
      { ...filterFixtures[0], id: "hidden-product", visible: false },
    ], catalogFilters.emptyCatalogFilters).map((product) => product.id),
    ["filter-ring-woman", "filter-chain-unisex", "filter-pendant-man"],
  );
  assert.deepEqual(
    catalogFilters.sortCatalogProducts(filterFixtures, "price-asc").map((product) => product.price),
    [70000, 90000, 120000],
  );
  assert.deepEqual(
    catalogFilters.sortCatalogProducts(searchFixtures, "name-desc").map((product) => product.id),
    ["search-venecia", "search-brisa"],
  );

  console.log("Catalog tests passed: dynamic category config, normalized search, exact attributes, numeric price, stable sorting and hidden-product protection.");
} finally {
  await server.close();
}
