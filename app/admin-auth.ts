import { headers } from "next/headers";
import {
  chatGPTAuthAvailable,
  chatGPTSignOutPath,
  getChatGPTUser,
  type ChatGPTUser,
} from "@/app/chatgpt-auth";

export type AdminUser = ChatGPTUser & {
  provider: "cloudflare-access" | "chatgpt-sites";
};

type CloudflareAccessJwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type CloudflareAccessJwtPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  name?: string;
  nbf?: number;
  sub?: string;
};

type CloudflareAccessConfiguration = {
  audiences: string[];
  teamDomain: string;
};

type JwksResponse = {
  keys?: Array<JsonWebKey & { kid?: string }>;
};

const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
const CLOCK_SKEW_SECONDS = 60;
const JWKS_CACHE_MS = 60 * 60 * 1_000;
const MAX_JWT_LENGTH = 16_384;

let cachedJwks: { expiresAt: number; teamDomain: string; keys: JwksResponse["keys"] } | null = null;

export function cloudflareAccessAuthAvailable(): boolean {
  return Boolean(readCloudflareAccessConfiguration());
}

export function adminAuthAvailable(): boolean {
  return cloudflareAccessAuthAvailable() || chatGPTAuthAvailable();
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cloudflareConfiguration = readCloudflareAccessConfiguration();
  if (cloudflareConfiguration) {
    const requestHeaders = await headers();
    const token = requestHeaders.get(ACCESS_JWT_HEADER);
    if (!token) return null;

    const identity = await verifyCloudflareAccessJwt(token, cloudflareConfiguration);
    if (!identity) return null;

    return {
      userId: identity.sub,
      displayName: identity.name ?? identity.email,
      email: identity.email,
      fullName: identity.name ?? null,
      provider: "cloudflare-access",
    };
  }

  const chatGPTUser = await getChatGPTUser();
  return chatGPTUser ? { ...chatGPTUser, provider: "chatgpt-sites" } : null;
}

export function adminSignOutPath(returnTo = "/"): string {
  const configuration = readCloudflareAccessConfiguration();
  if (configuration) {
    const logoutUrl = new URL(`https://${configuration.teamDomain}/cdn-cgi/access/logout`);
    const safeReturnTo = safeRelativeReturnPath(returnTo);
    if (safeReturnTo !== "/") logoutUrl.searchParams.set("returnTo", safeReturnTo);
    return logoutUrl.toString();
  }
  return chatGPTSignOutPath(returnTo);
}

export async function verifyCloudflareAccessJwt(
  token: string,
  configuration: CloudflareAccessConfiguration,
  options: { fetchImpl?: typeof fetch; nowSeconds?: number } = {},
): Promise<{ email: string; name: string | null; sub: string } | null> {
  if (!token || token.length > MAX_JWT_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtPart<CloudflareAccessJwtHeader>(encodedHeader);
  const payload = parseJwtPart<CloudflareAccessJwtPayload>(encodedPayload);
  if (!header || !payload || header.alg !== "RS256" || !header.kid) return null;
  if (!payload.email || !payload.sub || !payload.iss || !payload.exp) return null;

  const expectedIssuer = `https://${configuration.teamDomain}`;
  if (normalizeIssuer(payload.iss) !== normalizeIssuer(expectedIssuer)) return null;

  const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  if (!configuration.audiences.some((audience) => tokenAudiences.includes(audience))) return null;

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1_000);
  if (payload.exp + CLOCK_SKEW_SECONDS < nowSeconds) return null;
  if (payload.nbf !== undefined && payload.nbf - CLOCK_SKEW_SECONDS > nowSeconds) return null;

  const fetchImpl = options.fetchImpl ?? fetch;
  const verified = await verifyJwtSignature(
    `${encodedHeader}.${encodedPayload}`,
    encodedSignature,
    header.kid,
    configuration.teamDomain,
    fetchImpl,
  );
  if (!verified) return null;

  return {
    email: payload.email.trim().toLocaleLowerCase("en"),
    name: payload.name?.trim() || null,
    sub: payload.sub,
  };
}

function readCloudflareAccessConfiguration(): CloudflareAccessConfiguration | null {
  if (process.env.NELA_CLOUDFLARE_ACCESS_ENABLED !== "1") return null;
  const teamDomain = normalizeTeamDomain(process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN);
  const audiences = (process.env.CLOUDFLARE_ACCESS_AUDIENCE ?? "")
    .split(/[\s,;]+/)
    .map((audience) => audience.trim())
    .filter(Boolean);
  return teamDomain && audiences.length ? { teamDomain, audiences } : null;
}

async function verifyJwtSignature(
  signedValue: string,
  encodedSignature: string,
  kid: string,
  teamDomain: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  try {
    let jwk = await getJwk(teamDomain, kid, fetchImpl, false);
    if (!jwk) jwk = await getJwk(teamDomain, kid, fetchImpl, true);
    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      toArrayBuffer(decodeBase64Url(encodedSignature)),
      new TextEncoder().encode(signedValue),
    );
  } catch {
    return false;
  }
}

async function getJwk(
  teamDomain: string,
  kid: string,
  fetchImpl: typeof fetch,
  forceRefresh: boolean,
): Promise<(JsonWebKey & { kid?: string }) | null> {
  const now = Date.now();
  if (
    forceRefresh ||
    !cachedJwks ||
    cachedJwks.teamDomain !== teamDomain ||
    cachedJwks.expiresAt <= now
  ) {
    const response = await fetchImpl(`https://${teamDomain}/cdn-cgi/access/certs`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const payload = await response.json() as JwksResponse;
    cachedJwks = {
      expiresAt: now + JWKS_CACHE_MS,
      teamDomain,
      keys: Array.isArray(payload.keys) ? payload.keys : [],
    };
  }
  return cachedJwks.keys?.find((key) => key.kid === kid) ?? null;
}

function parseJwtPart<T>(value: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

function normalizeTeamDomain(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol !== "https:" || url.pathname !== "/") return null;
    return url.hostname.toLocaleLowerCase("en");
  } catch {
    return null;
  }
}

function normalizeIssuer(value: string): string {
  return value.replace(/\/+$/, "").toLocaleLowerCase("en");
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    return url.origin === "https://app.local" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
