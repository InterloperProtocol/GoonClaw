import { lookup } from "dns/promises";
import { isIP } from "net";

import { getServerEnv } from "@/lib/env";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var __goonclawRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getRateLimitStore() {
  if (!global.__goonclawRateLimitStore) {
    global.__goonclawRateLimitStore = new Map();
  }

  return global.__goonclawRateLimitStore;
}

function cleanupExpiredRateLimits(now: number) {
  const store = getRateLimitStore();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function getRequestFingerprint(request: Request, discriminator?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown-ua";

  return [forwardedFor || realIp || "unknown-ip", discriminator || "anonymous", userAgent]
    .filter(Boolean)
    .join(":");
}

export function assertSameOriginMutation(request: Request) {
  const requestUrl = new URL(request.url);
  const expectedOrigin = requestUrl.origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (origin && origin !== expectedOrigin) {
    throw new Error("Cross-origin state changes are not allowed");
  }

  if (!origin && fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    throw new Error("Cross-site state changes are not allowed");
  }
}

function isLoopbackIpv4(ip: string) {
  return ip.startsWith("127.");
}

function isPrivateIpv4(ip: string) {
  const octets = ip.split(".").map((value) => Number.parseInt(value, 10));
  if (octets.length !== 4 || octets.some((value) => Number.isNaN(value))) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    isLoopbackIpv4(ip) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function isBlockedIpv6(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

function isMetadataAddress(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === "169.254.169.254" ||
    normalized === "::ffff:169.254.169.254"
  );
}

function isBlockedAddress(ip: string, allowLocalNetwork: boolean) {
  if (isMetadataAddress(ip)) {
    return true;
  }

  if (ip.includes(":")) {
    return !allowLocalNetwork && isBlockedIpv6(ip);
  }

  return !allowLocalNetwork && isPrivateIpv4(ip);
}

function normalizeHttpUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("REST device endpoint must be a valid absolute URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("REST device endpoint must use http or https");
  }

  if (!parsed.hostname) {
    throw new Error("REST device endpoint must include a hostname");
  }

  if (parsed.username || parsed.password) {
    throw new Error("REST device endpoint must not embed credentials in the URL");
  }

  parsed.hash = "";
  return parsed;
}

export async function assertSafeRestEndpointUrl(rawUrl: string) {
  const parsed = normalizeHttpUrl(rawUrl);
  const hostname = parsed.hostname.toLowerCase();
  const allowLocalNetwork = getServerEnv().NODE_ENV !== "production";

  if (hostname === "metadata.google.internal") {
    throw new Error("REST device endpoint must not target cloud metadata hosts");
  }

  if (
    (hostname === "localhost" || hostname.endsWith(".localhost")) &&
    !allowLocalNetwork
  ) {
    throw new Error("REST device endpoint must not target localhost in production");
  }

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname, allowLocalNetwork)) {
      throw new Error("REST device endpoint must not target private or metadata addresses");
    }

    return parsed.toString();
  }

  try {
    const resolved = await lookup(hostname, { all: true, verbatim: true });
    if (!resolved.length) {
      throw new Error("REST device endpoint hostname did not resolve");
    }

    if (resolved.some((entry) => isBlockedAddress(entry.address, allowLocalNetwork))) {
      throw new Error("REST device endpoint must not resolve to private or metadata addresses");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("must not")) {
      throw error;
    }

    throw new Error("REST device endpoint could not be resolved safely");
  }

  return parsed.toString();
}

export function enforceRequestRateLimit(args: {
  request: Request;
  scope: string;
  max: number;
  windowMs: number;
  discriminator?: string;
}) {
  const now = Date.now();
  cleanupExpiredRateLimits(now);

  const key = `${args.scope}:${getRequestFingerprint(args.request, args.discriminator)}`;
  const store = getRateLimitStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + args.windowMs,
    });
    return;
  }

  if (current.count >= args.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    const error = new Error(
      `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
    );
    (error as Error & { retryAfterSeconds?: number }).retryAfterSeconds =
      retryAfterSeconds;
    throw error;
  }

  current.count += 1;
  store.set(key, current);
}

export function getRateLimitRetryAfterSeconds(error: unknown) {
  return typeof (error as { retryAfterSeconds?: unknown })?.retryAfterSeconds === "number"
    ? ((error as { retryAfterSeconds: number }).retryAfterSeconds)
    : null;
}
