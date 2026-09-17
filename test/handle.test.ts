/** The Worker end to end: a signed request in, Discord's response body
 * out, with the registry and the query API both served by the fake
 * fetch, so nothing here ever reaches production. */
import { describe, expect, it } from "vitest";
import { handle, type Env } from "../src/worker";
import { Registry } from "../src/registry";
import { BASE, fakeFetch } from "./fake";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
const env: Env = { DISCORD_PUBLIC_KEY: hex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer), DISCORD_APPLICATION_ID: "app", REGISTRY_BASE_URL: BASE, QUERY_BASE_URL: BASE, SITE_BASE_URL: "https://site.test" };

async function post(body: unknown, sign = true, overrides: Record<string, unknown> = {}): Promise<Response> {
  const text = JSON.stringify(body);
  const ts = "1700000000";
  const sig = sign ? hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + text))) : "00";
  const req = new Request("https://bot.test/", { method: "POST", body: text, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
  // One fake serves the registry and the query API alike (QUERY_BASE_URL is
  // BASE too); a path it does not know is a 404, which the query client
  // reads as "the API is not there".
  const f = fakeFetch(overrides);
  return handle(req, env, { registry: new Registry(BASE, f), random: () => 0.999, fetchImpl: f, discordFetch: f });
}

const command = (name: string, options: { name: string; value: string; focused?: boolean }[] = [], type = 2) =>
  ({ type, data: { name, options: options.map((o) => ({ type: 3, ...o })) } });
const onMessage = (content: string) => ({ type: 2, data: { name: "Find cards", type: 3, target_id: "m1", resolved: { messages: { m1: { content } } } } });
const click = (custom_id: string, values?: string[]) => ({ type: 3, data: { custom_id, ...(values ? { values } : {}) } });
type Body = { type: number; data: { content?: string; flags?: number; embeds?: { title: string; description?: string; thumbnail?: { url: string }; fields?: { name: string; value: string }[] }[]; components?: { components: { label?: string; custom_id?: string; options?: { value: string; default?: boolean }[] }[] }[] } };
const read = async (body: unknown) => (await (await post(body)).json()) as Body;

describe("handle", () => {
  it("answers GET with a line of text and refuses other methods", async () => {
    const get = await handle(new Request("https://bot.test/"), env);
    expect(get.status).toBe(200);
    expect(await get.text()).toContain("site.test");
    expect((await handle(new Request("https://bot.test/", { method: "PUT" }), env)).status).toBe(405);
  });
  it("rejects a bad signature with 401 and pongs a ping", async () => {
    expect((await post({ type: 1 }, false)).status).toBe(401);
    const pong = await post({ type: 1 });
    expect(await pong.json()).toEqual({ type: 1 });
  });
  it("autocompletes names as codex ids", async () => {
    const res = await post(command("card", [{ name: "name", value: "bla", focused: true }], 4));
    const body = (await res.json()) as { type: number; data: { choices: { name: string; value: string }[] } };
    expect(body.type).toBe(8);
    expect(body.data.choices).toEqual([{ name: "Black Knight", value: "C000429" }]);
  });
  it("/card takes a chosen id or typed text and whispers when nothing matches", async () => {
    const chosen = (await (await post(command("card", [{ name: "name", value: "C000927" }]))).json()) as { data: { embeds: { title: string }[] } };
    expect(chosen.data.embeds[0]!.title).toBe("Moss Troll");
    const typed = (await (await post(command("card", [{ name: "name", value: "polar" }]))).json()) as { data: { embeds: { title: string }[] } };
    expect(typed.data.embeds[0]!.title).toBe("Polar Bears");
    const miss = (await (await post(command("card", [{ name: "name", value: "xyzzy" }]))).json()) as { data: { content: string; flags: number } };
    expect(miss.data.content).toContain("No card named “xyzzy”");
    expect(miss.data.flags).toBe(64);
  });
  it("/id shows a card, a printing, and explains a bad id", async () => {
    const card = (await (await post(command("id", [{ name: "id", value: "c230" }]))).json()) as { data: { embeds: { title: string }[] } };
    expect(card.data.embeds[0]!.title).toBe("Polar Bears");
    const printing = (await (await post(command("id", [{ name: "id", value: "P002719" }]))).json()) as { data: { embeds: { title: string }[] } };
    expect(printing.data.embeds[0]!.title).toBe("Moss Troll — Gothic · Booster · Standard");
    const bad = (await (await post(command("id", [{ name: "id", value: "bears" }]))).json()) as { data: { content: string } };
    expect(bad.data.content).toContain("is not a Kairos id");
    const gone = (await (await post(command("id", [{ name: "id", value: "P999999" }]))).json()) as { data: { content: string } };
    expect(gone.data.content).toBe("No printing P999999 in the archive.");
  });
  it("/random picks from the index", async () => {
    const r = (await (await post(command("random"))).json()) as { data: { embeds: { title: string }[] } };
    expect(r.data.embeds[0]!.title).toBe("Avatar of Air");
  });
  it("/search shows the query API's matches when it answers", async () => {
    const list = { object: "list", release: "v3.9.0", q: "e:fire", total: 1, page: 1, page_size: 5, has_more: false, rules_text_total: 0,
      data: [{ codex_id: "C000429", name: "Black Knight", type: "Minion", rarity: "Exceptional", subtypes: ["Mortal"], elements: ["Fire", "Water"], cost: 5, attack: 5, defense: 3, power: 4, life: null, kairos_url: "https://site.test/cards/C000429", image_urls: null, printing: null }] };
    const s = (await (await post(command("search", [{ name: "query", value: "e:fire" }]), true, { "cards?q=e%3Afire&page_size=5": list })).json()) as { data: { content: string; embeds: { title: string }[] } };
    expect(s.data.content).toBe("**1 card** for `e:fire`");
    expect(s.data.embeds[0]!.title).toBe("Black Knight");
  });
  it("/search falls back to a link to the site when the query API is not there", async () => {
    const s = (await (await post(command("search", [{ name: "query", value: "e:fire" }]))).json()) as { data: { embeds: { title: string; url: string }[] } };
    expect(s.data.embeds[0]!.title).toBe("Search: e:fire");
    expect(s.data.embeds[0]!.url).toBe("https://site.test/search?q=e%3Afire");
  });
  it("/history and /set answer by name or code, with set suggestions", async () => {
    const h = await read(command("history", [{ name: "name", value: "moss troll" }]));
    expect(h.data.embeds![0]!.title).toBe("History of Moss Troll");
    expect(h.data.embeds![0]!.fields![1]!.value).toContain("Mana 4 → 3");
    const miss = await read(command("history", [{ name: "name", value: "xyzzy" }]));
    expect(miss.data.flags).toBe(64);
    const byName = await read(command("set", [{ name: "set", value: "goth" }]));
    expect(byName.data.embeds![0]!.title).toBe("Gothic");
    expect(byName.data.embeds![0]!.thumbnail?.url).toMatch(/small\.webp$/);
    const byCode = await read(command("set", [{ name: "set", value: "4" }]));
    expect(byCode.data.embeds![0]!.title).toBe("Arthurian Legends");
    expect(byCode.data.embeds![0]!.description).toContain("Black Knight, Dame Britomart, Druid");
    const none = await read(command("set", [{ name: "set", value: "omega" }]));
    expect(none.data.content).toBe("No set named “omega” in the archive.");
    const suggest = await read(command("set", [{ name: "set", value: "a", focused: true }], 4));
    expect(suggest.type).toBe(8);
    expect((suggest.data as unknown as { choices: { name: string; value: string }[] }).choices.map((c) => c.value)).toEqual(["001", "004", "002", "005"]);
  });
  it("Find cards reads [[names]] from the message, or the whole message", async () => {
    const two = await read(onMessage("is [[polar bears]] better than [[Moss Troll]]? [[Nope]] [[polar bears]]"));
    expect(two.data.embeds!.map((e) => e.title)).toEqual(["Polar Bears", "Moss Troll"]);
    expect(two.data.content).toBe("No card named “Nope”.");
    expect(two.data.flags).toBeUndefined();
    const whole = await read(onMessage("polar bears"));
    expect(whole.data.embeds![0]!.title).toBe("Polar Bears");
    expect(whole.data.embeds![0]!.description).toContain("Shown: Beta · Booster · Standard");
    const nothing = await read(onMessage("[[xyzzy]]"));
    expect(nothing.data.content).toBe("No card named “xyzzy” in the archive.");
    expect(nothing.data.flags).toBe(64);
    const hint = await read(onMessage("a".repeat(200)));
    expect(hint.data.content).toContain("double brackets");
  });
  it("the printing picker replaces the message with that printing", async () => {
    const picked = await read(click("pick:C000927", ["P002720"]));
    expect(picked.type).toBe(7);
    expect(picked.data.embeds![0]!.title).toBe("Moss Troll — Gothic · Booster · Foil");
    expect(picked.data.components![0]!.components[0]!.options!.find((o) => o.default)?.value).toBe("P002720");
    const wrong = await read(click("pick:C000927", ["P000937"]));
    expect(wrong.data.content).toBe("No printing P000937 for C000927.");
    const stale = await read(click("what:ever"));
    expect(stale.data.content).toContain("older message");
  });
  it("whispers on an unknown command and when the registry is down", async () => {
    const unknown = (await (await post(command("nope"))).json()) as { data: { content: string } };
    expect(unknown.data.content).toContain("/nope");
    const text = JSON.stringify(command("random"));
    const ts = "1700000000";
    const sig = hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + text)));
    const req = new Request("https://bot.test/", { method: "POST", body: text, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
    const down = await handle(req, env, { registry: new Registry(BASE, fakeFetch({ "versions.json": new Response("x", { status: 503 }) })) });
    expect(down.status).toBe(200);
    expect(((await down.json()) as { data: { content: string } }).data.content).toContain("did not answer");
  });
});
