import { z } from "zod";
import { validateProductSelection, validatePurchaseInventory } from "@/lib/cart/cart-utils";
import { getProductsForInventoryValidation } from "@/lib/products";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 128 * 1024;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const requestSchema = z.object({
  lines: z.array(z.object({
    lineId: z.string().min(1).max(512),
    productId: z.string().min(1).max(256),
    quantity: z.number().int().min(1).max(1_000_000),
    selectedVariants: z.array(z.object({
      variantId: z.string(),
      variantName: z.string(),
      optionId: z.string(),
      optionLabel: z.string(),
    }).strict()).max(20),
  }).strict()).min(1).max(100),
}).strict();

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLocaleLowerCase("en").startsWith("application/json")) {
    return json({ error: "El contenido debe enviarse como JSON." }, 415);
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
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Los productos enviados no son válidos." }, 400);
  }

  try {
    const catalog = await getProductsForInventoryValidation();
    const productsById = new Map(catalog.map((product) => [product.id, product]));
    const issues = parsed.data.lines.flatMap((line) => {
      const product = productsById.get(line.productId);
      if (!product || !product.visible) return [{ lineId: line.lineId, message: "Este producto ya no está disponible en el catálogo." }];
      const message = validateProductSelection(product, line.selectedVariants) ??
        validatePurchaseInventory(product, line.quantity, line.selectedVariants);
      return message ? [{ lineId: line.lineId, message }] : [];
    });
    return json({ valid: issues.length === 0, issues });
  } catch (error) {
    console.error("No fue posible validar el inventario.", error);
    return json({ error: "No fue posible confirmar las existencias. Intenta nuevamente." }, 502);
  }
}
