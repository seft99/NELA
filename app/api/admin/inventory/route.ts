import { getChatGPTUser } from "@/app/chatgpt-auth";
import { inventoryAdminConfigured, isInventoryAdmin } from "@/lib/inventory/access";
import {
  listInventoryProducts,
  sanityInventoryConfigured,
  updateInventoryProduct,
} from "@/lib/inventory/sanity-inventory";
import { inventoryUpdateSchema, isSameOriginMutation } from "@/lib/inventory/validation";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 64 * 1024;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function authorize() {
  const user = await getChatGPTUser();
  if (!user) return { error: json({ error: "Debes iniciar sesión para continuar." }, 401) };
  if (!inventoryAdminConfigured() || !isInventoryAdmin(user)) {
    return { error: json({ error: "Tu cuenta no tiene permiso para administrar el inventario." }, 403) };
  }
  return { user };
}

export async function GET() {
  const authorization = await authorize();
  if (authorization.error) return authorization.error;
  if (!sanityInventoryConfigured()) {
    return json({ error: "La conexión de escritura con Sanity aún no está configurada." }, 503);
  }

  try {
    return json({ products: await listInventoryProducts() });
  } catch (error) {
    console.error("No fue posible leer el inventario.", error);
    return json({ error: "No fue posible cargar el inventario. Intenta nuevamente." }, 502);
  }
}

export async function PATCH(request: Request) {
  const authorization = await authorize();
  if (authorization.error) return authorization.error;
  if (!isSameOriginMutation(request)) {
    return json({ error: "La solicitud no proviene de este sitio." }, 403);
  }
  if (!request.headers.get("content-type")?.toLocaleLowerCase("en").startsWith("application/json")) {
    return json({ error: "El contenido debe enviarse como JSON." }, 415);
  }
  if (!sanityInventoryConfigured()) {
    return json({ error: "La conexión de escritura con Sanity aún no está configurada." }, 503);
  }

  let body: unknown;
  try {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json({ error: "La solicitud es demasiado grande." }, 413);
    }
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ error: "La solicitud es demasiado grande." }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "La solicitud no contiene datos válidos." }, 400);
  }
  const parsed = inventoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Los cambios no son válidos." }, 400);
  }

  try {
    return json({ product: await updateInventoryProduct(parsed.data) });
  } catch (error) {
    console.error("No fue posible actualizar el inventario.", error);
    const message = error instanceof Error ? error.message : "No fue posible guardar los cambios.";
    return json({ error: message }, 400);
  }
}
