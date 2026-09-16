/** Discord signs every interaction with the application's Ed25519 key:
 * the signature covers the timestamp header followed by the raw body,
 * byte for byte. Workers verify Ed25519 natively through WebCrypto, so
 * there is no library, and the body must be the bytes Discord sent, not
 * a re-serialised object. A request that fails here gets a 401, which
 * is also how Discord checks the endpoint when the URL is saved: it
 * sends a deliberately bad signature and expects the refusal. */

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw new Error("not a hex string");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const keys = new Map<string, Promise<CryptoKey>>();

/** Import once per public key per isolate; the import is the slow part. */
function publicKey(hex: string): Promise<CryptoKey> {
  let key = keys.get(hex);
  if (!key) {
    key = crypto.subtle.importKey("raw", hexToBytes(hex), { name: "Ed25519" }, false, ["verify"]);
    keys.set(hex, key);
  }
  return key;
}

export async function verifySignature(publicKeyHex: string, signatureHex: string | null, timestamp: string | null, body: string): Promise<boolean> {
  if (!signatureHex || !timestamp) return false;
  try {
    const key = await publicKey(publicKeyHex);
    const data = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify("Ed25519", key, hexToBytes(signatureHex), data);
  } catch {
    return false;
  }
}
