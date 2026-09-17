/** Discord wants a first response within three seconds. When the work
 * is still running at the deadline the bot acknowledges and finishes
 * later through the interaction's webhook; autocomplete answers with
 * nothing rather than late; the emoji lookup never holds an answer. */
import { describe, expect, it } from "vitest";
import { DISCORD_API, handle, type Deps, type Env } from "../src/worker";
import { Registry, type Fetch } from "../src/registry";
import { BASE, fakeFetch } from "./fake";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
const env: Env = { DISCORD_PUBLIC_KEY: hex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer), DISCORD_APPLICATION_ID: "app", DISCORD_BOT_TOKEN: "bot-token", REGISTRY_BASE_URL: BASE, QUERY_BASE_URL: BASE, SITE_BASE_URL: "https://site.test" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** A fetch that answers like `inner`, `ms` later. */
const slow = (inner: Fetch, ms: number): Fetch => async (u, i) => { await sleep(ms); return inner(u, i); };

/** Discord's side: the emoji list, and a record of every webhook edit. */
function discord(emojiDelay = 0, patchStatus = 200) {
  const edits: { url: string; method: string; body: unknown }[] = [];
  const f: Fetch = async (url, init) => {
    if (url.includes("/emojis")) { await sleep(emojiDelay); return new Response(JSON.stringify({ items: [{ id: "4", name: "thr_water" }] })); }
    if (url.includes("/webhooks/")) { edits.push({ url, method: init?.method ?? "GET", body: JSON.parse(String(init?.body)) }); return new Response(patchStatus === 200 ? "{}" : "nope", { status: patchStatus }); }
    return new Response("nf", { status: 404 });
  };
  return { f, edits };
}

async function post(body: unknown, deps: Omit<Deps, "registry" | "background"> & { registryFetch?: Fetch; env?: Partial<Env> }) {
  const text = JSON.stringify({ token: "tok", ...(body as object) });
  const ts = "1700000000";
  const sig = hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + text)));
  const req = new Request("https://bot.test/", { method: "POST", body: text, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
  const background: Promise<unknown>[] = [];
  const started = Date.now();
  const { registryFetch, env: envOverride, ...rest } = deps;
  const res = await handle(req, { ...env, ...envOverride }, { registry: new Registry(BASE, registryFetch ?? fakeFetch()), random: () => 0.5, background: (w) => background.push(w), ...rest });
  return { body: (await res.json()) as { type: number; data?: Record<string, unknown> }, took: Date.now() - started, settle: () => Promise.all(background) };
}
const command = (name: string, value: string, type = 2) => ({ type, data: { name, options: [{ type: 3, name: name === "search" ? "query" : "name", value, focused: type === 4 }] } });
const cardTitle = (edits: { body: unknown }[]) => (edits[0]!.body as { embeds: { title: string }[] }).embeds[0]!.title;

describe("the deadline", () => {
  it("answers directly when the work is quick, with no webhook edit", async () => {
    const d = discord();
    const { body, took } = await post(command("card", "C000927"), { discordFetch: d.f, deadlineMs: 500 });
    expect(body.type).toBe(4);
    expect(took).toBeLessThan(500);
    expect(d.edits).toEqual([]);
  });
  it("defers a slow command, then edits the reply with the answer", async () => {
    const d = discord();
    const { body, took, settle } = await post(command("card", "C000927"), { discordFetch: d.f, deadlineMs: 60, registryFetch: slow(fakeFetch(), 150) });
    expect(body.type).toBe(5);
    expect(took).toBeLessThan(150);
    expect(d.edits).toEqual([]);
    await settle();
    expect(d.edits).toHaveLength(1);
    expect(d.edits[0]!.method).toBe("PATCH");
    expect(d.edits[0]!.url).toBe(`${DISCORD_API}/webhooks/app/tok/messages/@original`);
    expect(cardTitle(d.edits)).toBe("Moss Troll");
  });
  it("defers a slow component click as an update, then edits the message", async () => {
    const d = discord();
    const { body, settle } = await post({ type: 3, data: { custom_id: "pick:C000927", values: ["P002720"] } }, { discordFetch: d.f, deadlineMs: 60, registryFetch: slow(fakeFetch(), 150) });
    expect(body.type).toBe(6);
    await settle();
    expect(cardTitle(d.edits)).toBe("Moss Troll — Gothic · Booster · Foil");
  });
  it("edits the reply with the whisper when a deferred lookup misses, and with an apology when the archive is down", async () => {
    const d = discord();
    const miss = await post(command("card", "xyzzy"), { discordFetch: d.f, deadlineMs: 60, registryFetch: slow(fakeFetch(), 150) });
    expect(miss.body.type).toBe(5);
    await miss.settle();
    expect(d.edits[0]!.body).toMatchObject({ content: "No card named “xyzzy” in the archive.", flags: 64 });
    const down = discord();
    const r = await post(command("card", "C000927"), { discordFetch: down.f, deadlineMs: 60, registryFetch: slow(fakeFetch({ "versions.json": new Response("x", { status: 503 }) }), 150) });
    expect(r.body.type).toBe(5);
    await r.settle();
    expect(down.edits[0]!.body).toMatchObject({ content: "The archive did not answer in time. Try again in a moment." });
  });
  it("survives a failed webhook edit", async () => {
    const d = discord(0, 500);
    const { body, settle } = await post(command("card", "C000927"), { discordFetch: d.f, deadlineMs: 60, registryFetch: slow(fakeFetch(), 150) });
    expect(body.type).toBe(5);
    await expect(settle()).resolves.toBeDefined();
    expect(d.edits).toHaveLength(1);
  });
  it("answers autocomplete with no choices rather than late", async () => {
    const d = discord();
    const { body, took } = await post(command("card", "bla", 4), { discordFetch: d.f, deadlineMs: 60, registryFetch: slow(fakeFetch(), 150) });
    expect(body.type).toBe(8);
    expect(body.data).toEqual({ choices: [] });
    expect(took).toBeLessThan(150);
    expect(d.edits).toEqual([]);
    const quick = await post(command("card", "bla", 4), { discordFetch: d.f, deadlineMs: 500 });
    expect(quick.body.data).toEqual({ choices: [{ name: "Black Knight", value: "C000429" }] });
  });
  it("does not wait for a slow emoji lookup: the thresholds read as words", async () => {
    // The emoji lookup is cached per application id; this one is fresh.
    const d = discord(400);
    const { body, took } = await post(command("card", "C000927"), { discordFetch: d.f, deadlineMs: 800, emojiWaitMs: 50, env: { DISCORD_APPLICATION_ID: "app-slow-emoji" } });
    expect(body.type).toBe(4);
    expect(took).toBeLessThan(400);
    expect((body.data as { embeds: { description: string }[] }).embeds[0]!.description).toContain("Threshold: 1 Water");
  });
  it("whispers instead of deferring when the interaction carries no token", async () => {
    const d = discord();
    const text = JSON.stringify(command("card", "C000927"));
    const ts = "1700000000";
    const sig = hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + text)));
    const req = new Request("https://bot.test/", { method: "POST", body: text, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
    const res = await handle(req, env, { registry: new Registry(BASE, slow(fakeFetch(), 150)), discordFetch: d.f, deadlineMs: 60 });
    expect(((await res.json()) as { data: { flags: number } }).data.flags).toBe(64);
  });
});
