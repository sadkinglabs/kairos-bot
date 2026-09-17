/** Every interaction leaves one data point, and the point says what
 * happened without saying who did it. */
import { describe, expect, it } from "vitest";
import { handle, type Env } from "../src/worker";
import { Registry } from "../src/registry";
import { BLOBS, classify, guildHash, outcomeOf } from "../src/stats";
import { BASE, fakeFetch } from "./fake";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
const publicKey = hex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);

type Point = { indexes?: (string | ArrayBuffer | null)[]; blobs?: (string | ArrayBuffer | null)[]; doubles?: number[] };
function dataset() {
  const points: Point[] = [];
  return { points, writeDataPoint: (p?: Point) => { if (p) points.push(p); } };
}
const named = (p: Point) => Object.fromEntries(BLOBS.map((k, i) => [k, p.blobs![i]]));
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });

async function post(body: unknown, sign = true) {
  const stats = dataset();
  const env: Env = { DISCORD_PUBLIC_KEY: publicKey, DISCORD_APPLICATION_ID: "app", REGISTRY_BASE_URL: BASE, SITE_BASE_URL: "https://site.test", STATS: stats, STATS_SALT: "pepper" };
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const ts = "1700000000";
  const sig = sign ? hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + text))) : "00";
  const req = new Request("https://bot.test/", { method: "POST", body: text, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
  const res = await handle(req, env, { registry: new Registry(BASE, fakeFetch()), random: () => 0.999 });
  return { res, points: stats.points };
}
const guild = { guild_id: "123", authorizing_integration_owners: { "0": "123" }, locale: "en-GB" };

describe("one point per interaction", () => {
  it("records a command that answered in the channel, with the server hashed", async () => {
    const { points } = await post({ type: 2, ...guild, data: { name: "card", options: [{ type: 3, name: "name", value: "C000927" }] } });
    expect(points).toHaveLength(1);
    const p = named(points[0]!);
    expect(p).toMatchObject({ kind: "command", name: "card", outcome: "message", context: "server", locale: "en-GB", miss: "" });
    expect(p.guild).toBe(await guildHash("123", "pepper"));
    expect(p.guild).not.toBe("123");
    expect(points[0]!.indexes).toEqual(["command"]);
    expect(points[0]!.doubles![1]).toBe(200);
    expect(points[0]!.doubles![0]).toBeGreaterThanOrEqual(0);
  });
  it("records a miss with the text that missed, and a user-install context", async () => {
    const { points } = await post({ type: 2, authorizing_integration_owners: { "1": "u" }, context: 2, data: { name: "card", options: [{ type: 3, name: "name", value: "xyzzy" }] } });
    expect(named(points[0]!)).toMatchObject({ kind: "command", name: "card", outcome: "whisper", context: "user", guild: "", miss: "xyzzy" });
  });
  it("tells autocomplete, components, the message menu and a ping apart", async () => {
    const a = await post({ type: 4, ...guild, data: { name: "card", options: [{ type: 3, name: "name", value: "bla", focused: true }] } });
    expect(named(a.points[0]!)).toMatchObject({ kind: "autocomplete", name: "card", outcome: "choices" });
    const c = await post({ type: 3, ...guild, data: { custom_id: "pick:C000927", values: ["P002720"] } });
    expect(named(c.points[0]!)).toMatchObject({ kind: "component", name: "pick", outcome: "update" });
    const m = await post({ type: 2, ...guild, data: { name: "Find cards", type: 3, target_id: "1", resolved: { messages: { "1": { content: "[[polar bears]]" } } } } });
    expect(named(m.points[0]!)).toMatchObject({ kind: "menu", name: "Find cards", outcome: "message" });
    const p = await post({ type: 1 });
    expect(named(p.points[0]!)).toMatchObject({ kind: "ping", outcome: "pong", context: "unknown" });
  });
  it("records a rejected signature and bad JSON without an interaction", async () => {
    const r = await post({ type: 1 }, false);
    expect(r.res.status).toBe(401);
    expect(named(r.points[0]!)).toMatchObject({ kind: "unknown", name: "", outcome: "rejected" });
    expect(r.points[0]!.doubles![1]).toBe(401);
    const b = await post("{not json");
    expect(b.res.status).toBe(400);
    expect(named(b.points[0]!)).toMatchObject({ kind: "unknown", outcome: "bad" });
  });
});

describe("the pieces", () => {
  it("hashes a server the same way every time, differently per salt, and not at all without one", async () => {
    expect(await guildHash("123", "pepper")).toBe(await guildHash("123", "pepper"));
    expect(await guildHash("123", "pepper")).not.toBe(await guildHash("123", "salt"));
    expect(await guildHash("123", "pepper")).toHaveLength(16);
    expect(await guildHash("123", undefined)).toBe("");
    expect(await guildHash("", "pepper")).toBe("");
  });
  it("reads the context from the authorising install first, then Discord's context number", () => {
    expect(classify({ type: 2, authorizing_integration_owners: { "0": "g" }, data: { name: "x" } }).context).toBe("server");
    expect(classify({ type: 2, guild_id: "g", data: { name: "x" } }).context).toBe("server");
    expect(classify({ type: 2, authorizing_integration_owners: { "1": "u" }, data: { name: "x" } }).context).toBe("user");
    expect(classify({ type: 2, context: 1, data: { name: "x" } }).context).toBe("user");
    expect(classify({ type: 2, data: { name: "x" } }).context).toBe("unknown");
    expect(classify(null)).toMatchObject({ kind: "unknown", context: "unknown" });
  });
  it("names the outcome from the response body", async () => {
    expect(await outcomeOf(json({ type: 4, data: { content: "Nothing matches “t:site cost>99”.", flags: 64 } }))).toEqual({ outcome: "whisper", miss: "t:site cost>99" });
    expect(await outcomeOf(json({ type: 4, data: { content: "The archive did not answer in time.", flags: 64 } }))).toEqual({ outcome: "whisper", miss: "" });
    expect(await outcomeOf(json({ type: 4, data: { embeds: [] } }))).toEqual({ outcome: "message", miss: "" });
    expect(await outcomeOf(new Response("x", { status: 500 }))).toEqual({ outcome: "bad", miss: "" });
    expect(await outcomeOf(new Response("not json"))).toEqual({ outcome: "error", miss: "" });
  });
});
