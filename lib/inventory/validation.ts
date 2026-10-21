import { z } from "zod";

export const inventoryUpdateSchema = z.object({
  productId: z.string().trim().min(1).max(256),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  purchaseEnabled: z.boolean().optional(),
  visible: z.boolean().optional(),
  variantStocks: z.array(z.object({
    id: z.string().trim().min(1).max(256),
    stock: z.number().int().min(0).max(1_000_000),
  })).min(1).max(200).optional(),
}).strict().superRefine((value, context) => {
  if (
    value.stock === undefined &&
    value.purchaseEnabled === undefined &&
    value.visible === undefined &&
    value.variantStocks === undefined
  ) {
    context.addIssue({ code: "custom", message: "No hay cambios para guardar." });
  }
  if (value.variantStocks) {
    const ids = value.variantStocks.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", message: "Hay variantes duplicadas." });
    }
  }
});

export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}
