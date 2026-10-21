const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
];

function isPublicHostname(hostname: string) {
  const normalized = hostname.toLocaleLowerCase("en").replace(/^\[|\]$/g, "");
  if (
    !normalized ||
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".test") ||
    normalized.endsWith(".invalid") ||
    normalized.endsWith(".example") ||
    (!normalized.includes(".") && !normalized.includes(":"))
  ) return false;
  return !PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getPublicBaseUrl(value: string) {
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !isPublicHostname(url.hostname)) {
      return null;
    }
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export function getAbsoluteProductUrl(siteUrl: string, slug: string) {
  const baseUrl = getPublicBaseUrl(siteUrl);
  const normalizedSlug = slug.trim();
  if (!baseUrl || !normalizedSlug) return null;
  return new URL(`/productos/${encodeURIComponent(normalizedSlug)}`, baseUrl).toString();
}

export function getAbsolutePublicAssetUrl(siteUrl: string, assetUrl: string) {
  try {
    const url = new URL(assetUrl, getPublicBaseUrl(siteUrl) ?? undefined);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !isPublicHostname(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
