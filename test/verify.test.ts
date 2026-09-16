import { describe, expect, it } from "vitest";
import { verifySignature } from "../src/verify";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

async function keypair() {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const raw = (await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer;
  return { publicKey: hex(raw), sign: async (msg: string) => hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(msg))) };
}

describe("verifySignature", () => {
  it("accepts a signature over timestamp + raw body", async () => {
    const k = await keypair();
    const body = '{"type":1}';
    const sig = await k.sign(`1700000000${body}`);
    expect(await verifySignature(k.publicKey, sig, "1700000000", body)).toBe(true);
  });
  it("rejects a changed body, a changed timestamp, a wrong key and missing headers", async () => {
    const k = await keypair();
    const other = await keypair();
    const body = '{"type":1}';
    const sig = await k.sign(`1700000000${body}`);
    expect(await verifySignature(k.publicKey, sig, "1700000000", '{"type":1} ')).toBe(false);
    expect(await verifySignature(k.publicKey, sig, "1700000001", body)).toBe(false);
    expect(await verifySignature(other.publicKey, sig, "1700000000", body)).toBe(false);
    expect(await verifySignature(k.publicKey, null, "1700000000", body)).toBe(false);
    expect(await verifySignature(k.publicKey, sig, null, body)).toBe(false);
  });
  it("treats garbage hex as a bad signature rather than throwing", async () => {
    const k = await keypair();
    expect(await verifySignature(k.publicKey, "zz", "1", "{}")).toBe(false);
    expect(await verifySignature("nothex", "00", "1", "{}")).toBe(false);
  });
});
