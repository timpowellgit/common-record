import { beforeAll, describe, expect, it, vi } from "vitest";
import { createAccessAuth, type AccessConfig } from "../worker/auth";

const config: AccessConfig = {
  teamDomain: "commonrecord.cloudflareaccess.com",
  audience: "aud-tag-123",
};

let privateKey: CryptoKey;

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function makeToken(overrides: Record<string, unknown> = {}): Promise<string> {
  const header = encode({ alg: "RS256", kid: "test-kid", typ: "JWT" });
  const payload = encode({
    email: "tim@commonrecord.example",
    sub: "access-subject",
    aud: config.audience,
    iss: `https://${config.teamDomain}`,
    exp: Math.floor(Date.now() / 1000) + 600,
    ...overrides,
  });
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, data);
  return `${header}.${payload}.${Buffer.from(signature).toString("base64url")}`;
}

function requestWith(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set("Cf-Access-Jwt-Assertion", token);
  return new Request("https://example.com/api/operator/campaigns/x/events", { headers });
}

beforeAll(async () => {
  const keyPair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  privateKey = keyPair.privateKey;

  const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const jwks = {
    keys: [{ kid: "test-kid", kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", use: "sig" }],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(jwks), { status: 200 })),
  );
});

describe("Cloudflare Access verification", () => {
  const auth = createAccessAuth(config);

  it("accepts a correctly signed token", async () => {
    const identity = await auth.authenticate(requestWith(await makeToken()));
    expect(identity).toEqual({ email: "tim@commonrecord.example", subject: "access-subject" });
  });

  it("rejects a request with no assertion header", async () => {
    expect(await auth.authenticate(requestWith())).toBeNull();
  });

  it("rejects a token for a different audience", async () => {
    const token = await makeToken({ aud: "someone-elses-app" });
    expect(await auth.authenticate(requestWith(token))).toBeNull();
  });

  it("rejects a token from a different issuer", async () => {
    const token = await makeToken({ iss: "https://evil.cloudflareaccess.com" });
    expect(await auth.authenticate(requestWith(token))).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await makeToken({ exp: Math.floor(Date.now() / 1000) - 10 });
    expect(await auth.authenticate(requestWith(token))).toBeNull();
  });

  it("rejects a token with an unknown key id", async () => {
    const token = await makeToken();
    const [header, payload, signature] = token.split(".");
    const tamperedHeader = encode({ alg: "RS256", kid: "other-kid", typ: "JWT" });
    expect(header).not.toBe(tamperedHeader);
    expect(await auth.authenticate(requestWith(`${tamperedHeader}.${payload}.${signature}`))).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await makeToken();
    const [header, , signature] = token.split(".");
    const forgedPayload = encode({
      email: "attacker@example.com",
      sub: "attacker",
      aud: config.audience,
      iss: `https://${config.teamDomain}`,
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    expect(await auth.authenticate(requestWith(`${header}.${forgedPayload}.${signature}`))).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await auth.authenticate(requestWith("not-a-jwt"))).toBeNull();
  });
});
