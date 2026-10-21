import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  cacheDir: resolve(tmpdir(), `nela-cart-tests-${process.pid}`),
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
  resolve: { alias: { "@": process.cwd() } },
});

try {
  const cart = await server.ssrLoadModule("/lib/cart/cart-utils.ts");
  const storage = await server.ssrLoadModule("/lib/cart/storage.ts");
  const whatsapp = await server.ssrLoadModule("/lib/cart/whatsapp-checkout.ts");
  const whatsappLinks = await server.ssrLoadModule("/lib/whatsapp.ts");
  const site = await server.ssrLoadModule("/config/site.ts");
  const productUrls = await server.ssrLoadModule("/lib/products/product-url.ts");
  const publicSiteUrl = "https://nela.com.co/tienda";

  assert.equal(site.siteConfig.contact.whatsappNumber, "573156951945");
  assert.equal(site.siteConfig.contact.instagramUrl, "https://www.instagram.com/nela_joyeria/");
  assert.equal(
    whatsappLinks.createWhatsappUrl(site.siteConfig.contact.whatsappNumber)?.startsWith(
      "https://wa.me/573156951945?text=",
    ),
    true,
  );

  const product = {
    id: "test-product",
    name: "Producto de prueba",
    slug: "producto-de-prueba",
    category: "skincare",
    shortDescription: "Prueba",
    description: "Prueba",
    price: 50000,
    reference: "NELA-01",
    images: [{ src: "/test.png", alt: "Producto de prueba" }],
    variants: [{
      id: "size",
      name: "Talla",
      required: true,
      options: [{ id: "s", label: "S" }, { id: "m", label: "M" }],
    }],
    featured: false,
    stock: 5,
    purchaseEnabled: true,
    available: true,
    visible: true,
    displayOrder: 1,
  };
  const selection = [{
    variantId: "size",
    variantName: "Talla",
    optionId: "s",
    optionLabel: "S",
  }];

  assert.match(cart.validateProductSelection(product, []), /Selecciona talla/);
  assert.equal(cart.validateProductSelection(product, selection), null);
  assert.equal(
    cart.createLineId(product.id, selection),
    cart.createLineId(product.id, [...selection].reverse()),
  );
  assert.notEqual(
    cart.createLineId(product.id, selection),
    cart.createLineId(product.id, [{ ...selection[0], optionId: "m", optionLabel: "M" }]),
  );

  const item = cart.createCartItem(product, 2, selection);
  assert.equal(cart.getCartUnitCount([item]), 2);
  assert.equal(cart.getCartSubtotal([item]), 100000);
  assert.equal(item.availableStock, 5);

  const publicProduct = { ...product };
  delete publicProduct.stock;
  const publicItem = cart.createCartItem(publicProduct, 2, selection);
  assert.equal(publicItem.availableStock, null);
  assert.equal(
    storage.parsePersistedCart(storage.serializeCart([publicItem]))[0].availableStock,
    null,
  );

  assert.deepEqual(storage.parsePersistedCart("{dato-corrupto"), []);
  assert.deepEqual(storage.parsePersistedCart(JSON.stringify({ version: 99, items: [item] })), []);
  assert.equal(
    storage.parsePersistedCart(storage.serializeCart([item]))[0].lineId,
    item.lineId,
  );

  const changedProduct = { ...product, price: 56000 };
  const reconciled = cart.reconcileCartItems([item], [changedProduct]);
  assert.equal(reconciled.items[0].unitPrice, 56000);
  assert.match(reconciled.notices[0].message, /Actualizamos el precio/);
  assert.equal(cart.reconcileCartItems([item], []).items[0].issue, "product-removed");
  assert.equal(
    cart.reconcileCartItems([item], [{ ...product, purchaseEnabled: false, available: false }]).items[0].issue,
    "product-unavailable",
  );
  assert.equal(
    cart.reconcileCartItems([{ ...item, quantity: 6 }], [product]).items[0].issue,
    "stock-exceeded",
  );

  const checkout = whatsapp.createOrderCheckout("57 300 123 4567", [item], publicSiteUrl);
  assert.equal(checkout.isNumberValid, true);
  assert.match(checkout.message, /Producto de prueba/);
  assert.match(checkout.message, /Talla: S/);
  assert.match(checkout.message, /Referencia: NELA-01/);
  assert.match(checkout.message, /Productos diferentes: 1/);
  assert.match(checkout.message, /Total de unidades: 2/);
  assert.match(checkout.message, /https:\/\/nela\.com\.co\/productos\/producto-de-prueba/);
  assert.match(checkout.url, /^https:\/\/wa\.me\/573001234567\?text=/);
  assert.equal(whatsapp.createOrderCheckout("123", [item]).isNumberValid, false);
  assert.equal(whatsapp.createOrderCheckout("573001234567", [{ ...item, quantity: 6 }]).inventoryValid, false);

  const directCheckout = whatsapp.createDirectPurchaseCheckout(
    "57 300 123 4567",
    product,
    3,
    selection,
    publicSiteUrl,
  );
  assert.match(directCheckout.message, /Estoy interesada en comprar este producto:/);
  assert.match(directCheckout.message, /Nombre: Producto de prueba/);
  assert.match(directCheckout.message, /Referencia: NELA-01/);
  assert.match(directCheckout.message, /Características: Talla: S/);
  assert.match(directCheckout.message, /Subtotal: \$\s?150\.000/);
  assert.match(directCheckout.message, /\*Ver producto:\*/);
  assert.match(directCheckout.message, /https:\/\/nela\.com\.co\/productos\/producto-de-prueba/);
  assert.match(directCheckout.url, /^https:\/\/wa\.me\/573001234567\?text=/);
  assert.equal(directCheckout.inventoryValid, true);
  assert.equal(
    whatsapp.createDirectPurchaseCheckout("573001234567", { ...product, stock: 0, available: false }, 1).url,
    null,
  );

  const silverProduct = {
    ...product,
    id: "silver-test",
    slug: "accesorio-plata-prueba",
    category: "accesorios-plata",
    material: "Plata 925",
    finish: "Pulido",
    measurements: "45 cm",
    quantityOrVolume: "Dato que no corresponde a esta categoría",
    variants: [],
  };
  const silverMessage = whatsapp.createDirectPurchaseMessage(silverProduct, 1, [], publicSiteUrl);
  assert.match(silverMessage, /Características: Material: Plata 925, Color o acabado: Pulido, Medidas: 45 cm/);
  assert.doesNotMatch(silverMessage, /Dato que no corresponde/);
  const persistedSilver = storage.parsePersistedCart(
    storage.serializeCart([cart.createCartItem(silverProduct, 1)]),
  )[0];
  assert.equal(persistedSilver.material, "Plata 925");
  assert.equal(persistedSilver.quantityOrVolume, undefined);

  const productWithoutReference = { ...product, reference: undefined, name: "Aretes Sol & Luna" };
  const optionalMessage = whatsapp.createDirectPurchaseMessage(
    productWithoutReference,
    1,
    [],
    "http://localhost:5173",
  );
  assert.doesNotMatch(optionalMessage, /Referencia:/);
  assert.doesNotMatch(optionalMessage, /Características:/);
  assert.doesNotMatch(optionalMessage, /localhost/);
  assert.equal(
    productUrls.getAbsoluteProductUrl(publicSiteUrl, "aretes edición especial"),
    "https://nela.com.co/productos/aretes%20edici%C3%B3n%20especial",
  );
  assert.equal(productUrls.getAbsoluteProductUrl("http://127.0.0.1:5173", product.slug), null);
  assert.equal(productUrls.getAbsoluteProductUrl("https://catalogo.local", product.slug), null);

  const multiItemOrder = Array.from({ length: 4 }, (_, index) => ({
    ...item,
    lineId: `${item.lineId}-${index}`,
    name: `${item.name} ${index + 1}`,
  }));
  const multiItemCheckout = whatsapp.createOrderCheckout("573001234567", multiItemOrder, publicSiteUrl);
  assert.match(multiItemCheckout.url, /^https:\/\/wa\.me\/573001234567\?text=/);
  assert.equal(new URL(multiItemCheckout.url).searchParams.get("text"), multiItemCheckout.message);
  assert.match(multiItemCheckout.message, /Producto de prueba 4/);
  assert.match(multiItemCheckout.message, /Productos diferentes: 4/);
  const largeOrder = Array.from({ length: 35 }, (_, index) => ({
    ...item,
    lineId: `${item.lineId}-large-${index}`,
    name: `${item.name} extenso ${index + 1}`,
  }));
  const largeCheckout = whatsapp.createOrderCheckout("573001234567", largeOrder, publicSiteUrl);
  assert.equal(new URL(largeCheckout.url).searchParams.get("text"), largeCheckout.message);
  assert.match(largeCheckout.message, /Productos diferentes: 35/);

  const duplicateReconciliation = cart.reconcileCartItems([item, item], [product]);
  assert.equal(duplicateReconciliation.items.length, 1);
  assert.equal(duplicateReconciliation.items[0].quantity, 4);

  console.log("Cart tests passed: storage, variants, reconciliation, totals and WhatsApp checkout.");
} finally {
  await server.close();
}
