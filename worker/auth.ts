/**
 * Operator authentication via Cloudflare Access.
 *
 * Access sits in front of the Worker on a custom domain and injects a signed
 * `Cf-Access-Jwt-Assertion` header. We verify that JWT against the team's
 * public keys here, in the Worker, so the API never trusts an unauthenticated
 * request. Verification fails closed: any missing header, unknown key, bad
 * signature, wrong issuer/audience or expired token yields null.
 *
 * Note: Cloudflare Access requires a hostname in a zone you control. On a bare
 * workers.dev subdomain Access cannot be applied, so the operator API stays
 * disabled (503) until a custom domain is attached and these env vars are set.
 */

export type OperatorIdentity = {
  email: string;
  subject: string;
};

export type OperatorAuth = {
  authenticate(request: Request): Promise<OperatorIdentity | null>;
};

export type AccessConfig = {
  teamDomain: string;
  audience: string;
};

type Jwk = { kid: string; kty: string; n: string; e: string; alg?: string };

const JWT_HEADER = "Cf-Access-Jwt-Assertion";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToString(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function decodeSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(base64UrlToString(segment)) as T;
  } catch {
    return null;
  }
}

/**
 * A tiny JWKS cache. Cold starts and re-fetches are rare; the TTL keeps a key
 * rotation from locking operators out for long.
 */
const JWKS_TTL_MS = 60 * 60 * 1000;
let cachedKeys: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;

async function fetchKeys(teamDomain: string): Promise<Jwk[]> {
  if (
    cachedKeys &&
    cachedKeys.teamDomain === teamDomain &&
    Date.now() - cachedKeys.fetchedAt < JWKS_TTL_MS
  ) {
    return cachedKeys.keys;
  }
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  cachedKeys = { teamDomain, keys, fetchedAt: Date.now() };
  return keys;
}

async function importKey(jwk: Jwk): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

type AccessClaims = {
  email?: string;
  sub?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  nbf?: number;
};

export function createAccessAuth(config: AccessConfig): OperatorAuth {
  const { teamDomain, audience } = config;
  const issuer = `https://${teamDomain}`;

  return {
    async authenticate(request) {
      const token = request.headers.get(JWT_HEADER);
      if (!token) return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [headerSegment, payloadSegment, signatureSegment] = parts;

      const header = decodeSegment<{ kid?: string; alg?: string }>(headerSegment);
      const claims = decodeSegment<AccessClaims>(payloadSegment);
      if (!header?.kid || !claims) return null;
      if (header.alg && header.alg !== "RS256") return null;

      let keys: Jwk[];
      try {
        keys = await fetchKeys(teamDomain);
      } catch {
        return null;
      }
      const jwk = keys.find((key) => key.kid === header.kid);
      if (!jwk) return null;

      let valid: boolean;
      try {
        const key = await importKey(jwk);
        valid = await crypto.subtle.verify(
          "RSASSA-PKCS1-v1_5",
          key,
          base64UrlToBytes(signatureSegment),
          new TextEncoder().encode(`${headerSegment}.${payloadSegment}`),
        );
      } catch {
        return null;
      }
      if (!valid) return null;

      const now = Math.floor(Date.now() / 1000);
      if (typeof claims.exp === "number" && claims.exp <= now) return null;
      if (typeof claims.nbf === "number" && claims.nbf > now) return null;
      if (claims.iss !== issuer) return null;

      const tokenAudience = claims.aud;
      const audienceMatches = Array.isArray(tokenAudience)
        ? tokenAudience.includes(audience)
        : tokenAudience === audience;
      if (!audienceMatches) return null;

      if (!claims.email || !claims.sub) return null;
      return { email: claims.email, subject: claims.sub };
    },
  };
}

/** Access is not configured, so every operator request is unauthenticated. */
export function createDisabledAuth(): OperatorAuth {
  return {
    async authenticate() {
      return null;
    },
  };
}

export function accessConfigFromEnv(env: {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}): AccessConfig | null {
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim();
  const audience = env.ACCESS_AUD?.trim();
  if (!teamDomain || !audience) return null;
  return { teamDomain, audience };
}
