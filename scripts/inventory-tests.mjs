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
  const adminAuth = await server.ssrLoadModule("/app/admin-auth.ts");

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

  const previousAccessEnabled = process.env.NELA_CLOUDFLARE_ACCESS_ENABLED;
  const previousAccessTeamDomain = process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN;
  const previousAccessAudience = process.env.CLOUDFLARE_ACCESS_AUDIENCE;
  process.env.NELA_CLOUDFLARE_ACCESS_ENABLED = "1";
  process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN = "team.cloudflareaccess.com";
  process.env.CLOUDFLARE_ACCESS_AUDIENCE = "audience-test";
  assert.equal(
    adminAuth.cloudflareAccessAuthAvailable(),
    true,
    "Cloudflare Access must be enabled only with a complete configuration.",
  );

  const jwtKeyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", jwtKeyPair.publicKey);
  publicJwk.kid = "inventory-test-key";
  const nowSeconds = 1_800_000_000;
  const encodeJwtPart = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const signJwt = async (payload) => {
    const header = encodeJwtPart({ alg: "RS256", kid: publicJwk.kid, typ: "JWT" });
    const body = encodeJwtPart(payload);
    const signedValue = `${header}.${body}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      jwtKeyPair.privateKey,
      new TextEncoder().encode(signedValue),
    );
    return `${signedValue}.${Buffer.from(signature).toString("base64url")}`;
  };
  const validPayload = {
    aud: ["audience-test"],
    email: "OWNER@EXAMPLE.COM",
    exp: nowSeconds + 300,
    iss: "https://team.cloudflareaccess.com",
    name: "NELA Admin",
    sub: "access-user-1",
  };
  const fetchJwks = async () => new Response(JSON.stringify({ keys: [publicJwk] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
  assert.deepEqual(
    await adminAuth.verifyCloudflareAccessJwt(
      await signJwt(validPayload),
      { audiences: ["audience-test"], teamDomain: "team.cloudflareaccess.com" },
      { fetchImpl: fetchJwks, nowSeconds },
    ),
    { email: "owner@example.com", name: "NELA Admin", sub: "access-user-1" },
  );
  assert.equal(
    await adminAuth.verifyCloudflareAccessJwt(
      await signJwt({ ...validPayload, aud: ["wrong-audience"] }),
      { audiences: ["audience-test"], teamDomain: "team.cloudflareaccess.com" },
      { fetchImpl: fetchJwks, nowSeconds },
    ),
    null,
    "A token issued for another Access application must be rejected.",
  );
  assert.equal(
    await adminAuth.verifyCloudflareAccessJwt(
      await signJwt({ ...validPayload, exp: nowSeconds - 120 }),
      { audiences: ["audience-test"], teamDomain: "team.cloudflareaccess.com" },
      { fetchImpl: fetchJwks, nowSeconds },
    ),
    null,
    "Expired Access tokens must be rejected.",
  );
  if (previousAccessEnabled === undefined) delete process.env.NELA_CLOUDFLARE_ACCESS_ENABLED;
  else process.env.NELA_CLOUDFLARE_ACCESS_ENABLED = previousAccessEnabled;
  if (previousAccessTeamDomain === undefined) delete process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN;
  else process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN = previousAccessTeamDomain;
  if (previousAccessAudience === undefined) delete process.env.CLOUDFLARE_ACCESS_AUDIENCE;
  else process.env.CLOUDFLARE_ACCESS_AUDIENCE = previousAccessAudience;

  const previousVercel = process.env.VERCEL;
  const previousHeaderTrust = process.env.NELA_TRUST_CHATGPT_AUTH_HEADERS;
  delete process.env.NELA_TRUST_CHATGPT_AUTH_HEADERS;
  assert.equal(
    auth.chatGPTAuthAvailable(),
    false,
    "Identity headers must be denied by default on an untrusted host.",
  );
  process.env.NELA_TRUST_CHATGPT_AUTH_HEADERS = "1";
  delete process.env.VERCEL;
  assert.equal(
    auth.chatGPTAuthAvailable(),
    true,
    "The managed Sites host can explicitly enable protected identity headers.",
  );
  process.env.VERCEL = "1";
  assert.equal(auth.chatGPTAuthAvailable(), false, "Vercel must not trust ChatGPT Sites headers.");
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  if (previousHeaderTrust === undefined) delete process.env.NELA_TRUST_CHATGPT_AUTH_HEADERS;
  else process.env.NELA_TRUST_CHATGPT_AUTH_HEADERS = previousHeaderTrust;
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

  console.log("Inventory tests passed: Cloudflare Access JWT, auth guards, validation, stock rules and variant limits.");
} finally {
  await server.close();
}
