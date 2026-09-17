/** /search against the query API: results, a bad query, and the link
 * fallback when the API is not there. */
import { describe, expect, it } from "vitest";
import { handle, type Env } from "../src/worker";
import { Registry } from "../src/registry";
import { BASE, fakeFetch } from "./fake";
import { queryCards } from "../src/query";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
const env: Env = { DISCORD_PUBLIC_KEY: hex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer), DISCORD_APPLICATION_ID: "app", REGISTRY_BASE_URL: BASE, QUERY_BASE_URL: BASE, SITE_BASE_URL: "https://site.test" };

const list = {
  object: "list", release: "v3.9.0", q: "t:minion e:fire", total: 32, page: 1, page_size: 8, has_more: true, rules_text_total: 2,
  data: [
    { codex_id: "C000140", name: "Awakened Mummies", type: "Minion", rarity: "Exceptional", subtypes: ["Undead"], elements: ["Fire"], cost: 1, attack: 3, defense: 3, power: 3, life: null, kairos_url: "https://kairosarchive.net/cards/C000140/awakened-mummies" },
    { codex_id: "C000429", name: "Black Knight", type: "Minion", rarity: "Exceptional", subtypes: ["Mortal"], elements: ["Fire", "Water"], cost: 5, attack: 5, defense: 3, power: 4, life: null, kairos_url: "https://kairosarchive.net/cards/C000429/black-knight" },
  ],
};

async function post(query: string, overrides: Record<string, unknown> = {}) {
  const body = JSON.stringify({ type: 2, data: { name: "search", options: [{ type: 3, name: "query", value: query }] } });
  const ts = "1700000000";
  const sig = hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + body)));
  const req = new Request("https://bot.test/", { method: "POST", body, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
  const f = fakeFetch(overrides);
  const res = await handle(req, env, { registry: new Registry(BASE, f), fetchImpl: f });
  return { body: (await res.json()) as { data: { content?: string; flags?: number; embeds?: { title: string; description: string; url: string; footer: { text: string } }[]; components?: { components: { label: string; url: string }[] }[] } }, calls: f.calls };
}

describe("/search with the query API", () => {
  it("shows the first matches as links, the count, and the rules-text note", async () => {
    const { body, calls } = await post("t:minion e:fire", { "cards?q=t%3Aminion%20e%3Afire&page_size=8": list });
    expect(calls).toContain(`${BASE}/cards?q=t%3Aminion%20e%3Afire&page_size=8`);
    const e = body.data.embeds![0]!;
    expect(e.title).toBe("32 cards for “t:minion e:fire”");
    expect(e.url).toBe("https://site.test/search?q=t%3Aminion%20e%3Afire");
    expect(e.description).toContain("[**Awakened Mummies**](https://kairosarchive.net/cards/C000140/awakened-mummies) · Minion — Exceptional Undead · 1 · Power: 3");
    expect(e.description).toContain("[**Black Knight**]");
    expect(e.description).toContain("Attack: 5 / Defense: 3 · Power: 4");
    expect(e.description).toContain("…and 30 more.");
    expect(e.description).toContain("2 more mention it in their rules text.");
    expect(e.footer.text).toContain("release v3.9.0");
    expect(body.data.components![0]!.components.map((b) => b.label)).toEqual(["All results", "JSON", "Syntax"]);
  });
  it("whispers the parser's messages for a query the API rejects", async () => {
    const err = new Response(JSON.stringify({ object: "error", status: 400, code: "bad_query", details: "The query could not be read.", warnings: ["cost: \">3\" is not a number"] }), { status: 400, headers: { "content-type": "application/json" } });
    const { body } = await post("cost>>3", { "cards?q=cost%3E%3E3&page_size=8": err });
    expect(body.data.flags).toBe(64);
    expect(body.data.content).toContain("cost: \">3\" is not a number");
  });
  it("whispers when nothing matches", async () => {
    const { body } = await post("t:site cost>99", { "cards?q=t%3Asite%20cost%3E99&page_size=8": { ...list, total: 0, data: [], rules_text_total: 0 } });
    expect(body.data.flags).toBe(64);
    expect(body.data.content).toContain("Nothing matches");
  });
  it("falls back to the link when the API is not there", async () => {
    const { body } = await post("t:minion");   // the fake answers 404 for an unknown path
    expect(body.data.embeds![0]!.title).toBe("Search: t:minion");
    expect(body.data.components![0]!.components[0]!.label).toBe("Open results");
  });
});

describe("queryCards", () => {
  it("reads unavailable for a network error or a non-JSON answer", async () => {
    expect(await queryCards(BASE, "x", 8, async () => { throw new Error("boom"); })).toEqual({ kind: "unavailable" });
    expect(await queryCards(BASE, "x", 8, async () => new Response("<html>", { headers: { "content-type": "text/html" } }))).toEqual({ kind: "unavailable" });
  });
});
