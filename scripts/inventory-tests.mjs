import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  cacheDir: resolve(tmpdir(), `nela-inventory-tests-${process.pid}`),
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
  resolve: { alias: { "@": process.cwd() } },
});

try {
  const inventory = await server.ssrLoadModule("/lib/products/inventory.ts");
  const cart = await server.ssrLoadModule("/lib/cart/cart-utils.ts");
  const access = await server.ssrLoadModule("/lib/inventory/access.ts");
  const validation = await server.ssrLoadModule("/lib/inventory/validation.ts");
  const auth = await server.ssrLoadModule("/app/chatgpt-auth.ts");

  const product = {
    id: "inventory-test",
    name: "Producto inventario",
    slug: "producto-inventario",
    category: "manillas-oro",
    shortDescription: "Prueba",
    description: "Prueba",
    price: 120000,
    images: [{ src: "/test.png", alt: "Prueba" }],
    featured: false,
    stock: 3,
    purchaseEnabled: true,
    available: true,
    visible: true,
    displayOrder: 1,
  };

  assert.equal(inventory.isProductPurchasable(product), true);
  assert.equal(inventory.isProductPurchasable({ ...product, stock: 0 }), false);
  assert.equal(inventory.isProductPurchasable({ ...product, purchaseEnabled: false }), false);
  assert.equal(inventory.isProductPurchasable({ ...product, visible: false }), false);
  assert.match(cart.validatePurchaseInventory(product, 4), /supera las existencias/);
  assert.equal(cart.validatePurchaseInventory(product, 3), null);

  const variantProduct = {
    ...product,
    stock: 5,
    variantInventory: [
      { id: "small", label: "Talla S", optionIds: ["s"], stock: 2 },
      { id: "medium", label: "Talla M", optionIds: ["m"], stock: 3 },
    ],
  };
  const small = [{ variantId: "size", variantName: "Talla", optionId: "s", optionLabel: "S" }];
  assert.equal(inventory.getAvailableStock(variantProduct, small), 2);
  assert.match(cart.validatePurchaseInventory(variantProduct, 3, small), /supera las existencias/);

  assert.equal(access.isInventoryAdmin(
    { userId: "user-1", email: "OWNER@EXAMPLE.COM" },
    { emails: "owner@example.com", userIds: "" },
  ), true);

  const previousVercel = process.env.VERCEL;
  process.env.VERCEL = "1";
  assert.equal(auth.chatGPTAuthAvailable(), false, "Vercel must not trust ChatGPT Sites headers.");
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  assert.equal(access.isInventoryAdmin(
    { userId: "user-2", email: "other@example.com" },
    { emails: "owner@example.com", userIds: "user-1" },
  ), false);
  assert.equal(access.isInventoryAdmin(
    { userId: "user-3", email: "owner@example.com" },
    { emails: " OWNER@EXAMPLE.COM ; second@example.com ", userIds: "" },
  ), true);

  assert.equal(validation.inventoryUpdateSchema.safeParse({ productId: "p1", stock: 0 }).success, true);
  assert.equal(validation.inventoryUpdateSchema.safeParse({ productId: "p1", stock: -1 }).success, false);
  assert.equal(validation.inventoryUpdateSchema.safeParse({ productId: "p1", variantStocks: [] }).success, false);
  assert.equal(validation.inventoryUpdateSchema.safeParse({ productId: "p1", price: 1 }).success, false);
  assert.equal(validation.inventoryUpdateSchema.safeParse({ productId: "p1" }).success, false);
  assert.equal(validation.isSameOriginMutation(new Request("https://nela.example/api", {
    method: "PATCH",
    headers: { origin: "https://nela.example", host: "nela.example" },
  })), true);
  assert.equal(validation.isSameOriginMutation(new Request("https://nela.example/api", {
    method: "PATCH",
    headers: { origin: "https://attacker.example", host: "nela.example" },
  })), false);
  assert.equal(validation.isSameOriginMutation(new Request("https://nela.example/api", {
    method: "PATCH",
    headers: { origin: "http://nela.example", host: "nela.example" },
  })), false);
  assert.equal(validation.isSameOriginMutation(new Request("https://nela.example/api", {
    method: "PATCH",
    headers: { origin: "https://nela.example", "sec-fetch-site": "cross-site" },
  })), false);

  console.log("Inventory tests passed: access, Vercel auth guard, validation, stock rules and variant limits.");
} finally {
  await server.close();
}
