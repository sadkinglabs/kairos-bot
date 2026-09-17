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
  object: "list", release: "v3.9.0", q: "t:minion e:fire", total: 32, page: 1, page_size: 5, has_more: true, rules_text_total: 2,
  data: [
    { codex_id: "C000140", name: "Awakened Mummies", type: "Minion", rarity: "Exceptional", subtypes: ["Undead"], elements: ["Fire"], cost: 1, attack: 3, defense: 3, power: 3, life: null, kairos_url: "https://kairosarchive.net/cards/C000140/awakened-mummies",
      image_urls: { small: "https://api.test/images/P000387.small.webp" }, printing: { printing_id: "P000387", set_name: "Alpha", product: "Booster", finish: "Standard" } },
    { codex_id: "C000429", name: "Black Knight", type: "Minion", rarity: "Exceptional", subtypes: ["Mortal"], elements: ["Fire", "Water"], cost: 5, attack: 5, defense: 3, power: 4, life: null, kairos_url: "https://kairosarchive.net/cards/C000429/black-knight",
      image_urls: null, printing: null },
  ],
};

async function post(query: string, overrides: Record<string, unknown> = {}, raw?: unknown) {
  const body = JSON.stringify(raw ?? { type: 2, data: { name: "search", options: [{ type: 3, name: "query", value: query }] } });
  const ts = "1700000000";
  const sig = hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + body)));
  const req = new Request("https://bot.test/", { method: "POST", body, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
  const f = fakeFetch(overrides);
  const res = await handle(req, env, { registry: new Registry(BASE, f), fetchImpl: f });
  return { body: (await res.json()) as { type: number; data: { content?: string; flags?: number; embeds?: { title: string; description: string; url: string; thumbnail?: { url: string }; footer?: { text: string } }[]; components?: { components: { label: string; url: string }[] }[] } }, calls: f.calls };
}

describe("/search with the query API", () => {
  it("shows the first matches as embeds with art, the count, and the rules-text note", async () => {
    const { body, calls } = await post("t:minion e:fire", { "cards?q=t%3Aminion%20e%3Afire&page_size=5": list });
    expect(calls).toContain(`${BASE}/cards?q=t%3Aminion%20e%3Afire&page_size=5`);
    expect(body.data.content).toBe("**32 cards** for `t:minion e:fire` · showing the first 2 · 2 more mention it in their rules text");
    const [first, second] = body.data.embeds!;
    expect(first!.title).toBe("Awakened Mummies");
    expect(first!.url).toBe("https://kairosarchive.net/cards/C000140/awakened-mummies");
    expect(first!.description).toBe("Minion — Exceptional Undead · 1 · Power: 3 · Alpha · Booster · Standard");
    expect(first!.thumbnail).toEqual({ url: "https://api.test/images/P000387.small.webp" });
    expect(first!.footer).toBeUndefined();
    expect(second!.title).toBe("Black Knight");
    expect(second!.description).toBe("Minion — Exceptional Mortal · 5 · Attack: 5 / Defense: 3 · Power: 4");
    expect(second!.thumbnail).toBeUndefined();
    expect(second!.footer!.text).toContain("release v3.9.0");
    expect(body.data.components![0]!.components.map((b) => b.label)).toEqual(["Next 5"]);
    expect(body.data.components![1]!.components.map((b) => b.label)).toEqual(["All results", "JSON", "Syntax"]);
    expect(body.data.components![1]!.components[0]!.url).toBe("https://site.test/search?q=t%3Aminion%20e%3Afire");
  });
  it("turns the page in place when Next is clicked", async () => {
    const page2 = { ...list, page: 2, has_more: false, data: [list.data[1]] };
    const { body, calls } = await post("t:minion e:fire", { "cards?q=t%3Aminion%20e%3Afire&page_size=5&page=2": page2 }, { type: 3, data: { custom_id: "page:2:t:minion e:fire" } });
    expect(calls).toContain(`${BASE}/cards?q=t%3Aminion%20e%3Afire&page_size=5&page=2`);
    expect(body.type).toBe(7);
    expect(body.data.content).toBe("**32 cards** for `t:minion e:fire` · showing 6–6 · 2 more mention it in their rules text");
    expect(body.data.embeds!.map((e) => e.title)).toEqual(["Black Knight"]);
    expect(body.data.components![0]!.components.map((b) => b.label)).toEqual(["Previous"]);
  });
  it("whispers the parser's messages for a query the API rejects", async () => {
    const err = new Response(JSON.stringify({ object: "error", status: 400, code: "bad_query", details: "The query could not be read.", warnings: ["cost: \">3\" is not a number"] }), { status: 400, headers: { "content-type": "application/json" } });
    const { body } = await post("cost>>3", { "cards?q=cost%3E%3E3&page_size=5": err });
    expect(body.data.flags).toBe(64);
    expect(body.data.content).toContain("cost: \">3\" is not a number");
  });
  it("whispers when nothing matches", async () => {
    const { body } = await post("t:site cost>99", { "cards?q=t%3Asite%20cost%3E99&page_size=5": { ...list, total: 0, data: [], rules_text_total: 0 } });
    expect(body.data.flags).toBe(64);
    expect(body.data.content).toContain("Nothing matches");
  });
  it("falls back to the link when the API is not there", async () => {
    const { body } = await post("t:minion");   // the fake answers 404 for an unknown path
    expect(body.data.embeds![0]!.title).toBe("Search: t:minion");
    expect(body.data.components![0]!.components[0]!.label).toBe("Open results");
  });
});

describe("/random with a query", () => {
  const draw = (q: string, overrides: Record<string, unknown>) => post(q, overrides, { type: 2, data: { name: "random", options: [{ type: 3, name: "query", value: q }] } });
  it("shows the drawn printing when the query bound one, else the card", async () => {
    const foil = await draw("s:gothic f:foil", { "cards/random?q=s%3Agothic%20f%3Afoil": { object: "card", codex_id: "C000927", printing: { printing_id: "P002720" } } });
    expect(foil.calls).toContain(`${BASE}/cards/random?q=s%3Agothic%20f%3Afoil`);
    expect(foil.body.data.embeds![0]!.title).toBe("Moss Troll — Gothic · Booster · Foil");
    const plain = await draw("t:minion", { "cards/random?q=t%3Aminion": { object: "card", codex_id: "C000927", printing: { printing_id: "P002719" } } });
    expect(plain.body.data.embeds![0]!.title).toBe("Moss Troll");
    expect(plain.body.data.embeds![0]!.description).toContain("Shown: Gothic · Booster · Standard");
  });
  it("whispers for an empty pool, a bad query, and a missing API", async () => {
    const nf = new Response(JSON.stringify({ object: "error", status: 404, code: "not_found", details: "No card matches “t:site cost>99”." }), { status: 404, headers: { "content-type": "application/json" } });
    const empty = await draw("t:site cost>99", { "cards/random?q=t%3Asite%20cost%3E99": nf });
    expect(empty.body.data.flags).toBe(64);
    expect(empty.body.data.content).toContain("Nothing matches");
    const bad = new Response(JSON.stringify({ object: "error", status: 400, code: "bad_query", details: "The query could not be read.", warnings: ["cost: \">3\" is not a number"] }), { status: 400, headers: { "content-type": "application/json" } });
    const err = await draw("cost>>3", { "cards/random?q=cost%3E%3E3": bad });
    expect(err.body.data.content).toContain("is not a number");
    const down = await draw("t:minion", {});
    expect(down.body.data.content).toContain("did not answer");
  });
});

describe("queryCards", () => {
  it("reads unavailable for a network error or a non-JSON answer", async () => {
    expect(await queryCards(BASE, "x", 5, async () => { throw new Error("boom"); })).toEqual({ kind: "unavailable" });
    expect(await queryCards(BASE, "x", 5, async () => new Response("<html>", { headers: { "content-type": "text/html" } }))).toEqual({ kind: "unavailable" });
  });
});
