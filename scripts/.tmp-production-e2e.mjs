import assert from "node:assert/strict";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const targetUrl = "http://127.0.0.1:5173/productos/destello-con-piedras-blancas";
const target = await fetch(`http://127.0.0.1:9333/json/new?${encodeURIComponent(targetUrl)}`, {
  method: "PUT",
}).then((response) => response.json());

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message));
  else entry.resolve(message.result);
});

function command(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await sleep(200);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

try {
  await command("Page.enable");
  await command("Runtime.enable");
  await waitFor(`document.readyState === "complete" && document.body.innerText.includes("Destello con Piedras Blancas")`);
  await evaluate(`localStorage.removeItem("nela-cart")`);
  await command("Page.reload", { ignoreCache: true });
  await waitFor(`document.readyState === "complete" && document.body.innerText.includes("Destello con Piedras Blancas")`);
  await evaluate(`(() => {
    document.querySelectorAll(".purchase-panel select").forEach((select) => {
      if (select.options.length > 1) {
        select.value = select.options[1].value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    return true;
  })()`);
  await sleep(250);
  const clickedAdd = await evaluate(`(() => {
    const button = document.querySelector(".purchase-add-button");
    button?.click();
    return Boolean(button);
  })()`);
  assert.equal(clickedAdd, true);
  await waitFor(`document.body.innerText.includes("se agregó al carrito")`);

  const cartState = await evaluate(`(() => {
    const stored = JSON.parse(localStorage.getItem("nela-cart"));
    return { version: stored.version, lines: stored.items.length, quantity: stored.items[0].quantity };
  })()`);
  assert.deepEqual(cartState, { version: 1, lines: 1, quantity: 1 });

  const openedCart = await evaluate(`(() => {
    const button = document.querySelector('button[aria-label^="Abrir carrito"]');
    button?.click();
    return Boolean(button);
  })()`);
  assert.equal(openedCart, true);
  await waitFor(`document.body.innerText.includes("Tu carrito") && document.body.innerText.includes("Enviar pedido por WhatsApp")`);

  const drawerState = await evaluate(`(() => ({
    productVisible: document.body.innerText.includes("Destello con Piedras Blancas"),
    checkoutEnabled: ![...document.querySelectorAll("button")].find((item) => item.textContent.includes("Enviar pedido por WhatsApp"))?.disabled,
    unitNoteVisible: document.body.innerText.includes("1 producto seleccionado")
  }))()`);
  assert.deepEqual(drawerState, { productVisible: true, checkoutEnabled: true, unitNoteVisible: true });

  await evaluate(`window.open = (url) => { window.__nelaCheckoutUrl = url; return null; }`);
  const clickedCheckout = await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.includes("Enviar pedido por WhatsApp"));
    button?.click();
    return Boolean(button);
  })()`);
  assert.equal(clickedCheckout, true);
  await waitFor(`Boolean(window.__nelaCheckoutUrl)`);
  const checkoutUrl = await evaluate(`window.__nelaCheckoutUrl`);
  const decodedCheckout = decodeURIComponent(checkoutUrl);
  assert.match(checkoutUrl, /^https:\/\/wa\.me\/573156951945\?/);
  assert.match(decodedCheckout, /https:\/\/nelajoyeria\.vercel\.app\/productos\/destello-con-piedras-blancas/);
  assert.match(decodedCheckout, /NELA-AN-001/);

  console.log(JSON.stringify({
    productPage: 200,
    cartPersisted: cartState,
    cartDrawer: drawerState,
    whatsappNumber: "573156951945",
    publicProductUrlVerified: true,
  }, null, 2));
} finally {
  const closed = new Promise((resolve) => socket.addEventListener("close", resolve, { once: true }));
  await fetch(`http://127.0.0.1:9333/json/close/${target.id}`).catch(() => undefined);
  await Promise.race([closed, sleep(1000)]);
  await sleep(1000);
}
