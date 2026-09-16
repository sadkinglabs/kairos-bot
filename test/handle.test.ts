/** The Worker end to end: a signed request in, Discord's response body
 * out, with the registry served by the fake fetch. */
import { describe, expect, it } from "vitest";
import { handle, type Env } from "../src/worker";
import { Registry } from "../src/registry";
import { BASE, fakeFetch } from "./fake";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
const env: Env = { DISCORD_PUBLIC_KEY: hex((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer), DISCORD_APPLICATION_ID: "app", REGISTRY_BASE_URL: BASE, SITE_BASE_URL: "https://site.test" };

async function post(body: unknown, sign = true): Promise<Response> {
  const text = JSON.stringify(body);
  const ts = "1700000000";
  const sig = sign ? hex(await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(ts + text))) : "00";
  const req = new Request("https://bot.test/", { method: "POST", body: text, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
  return handle(req, env, { registry: new Registry(BASE, fakeFetch()), random: () => 0.999 });
}

const command = (name: string, options: { name: string; value: string; focused?: boolean }[] = [], type = 2) =>
  ({ type, data: { name, options: options.map((o) => ({ type: 3, ...o })) } });

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
  it("/random picks from the index and /search links the site", async () => {
    const r = (await (await post(command("random"))).json()) as { data: { embeds: { title: string }[] } };
    expect(r.data.embeds[0]!.title).toBe("Avatar of Air");
    const s = (await (await post(command("search", [{ name: "query", value: "e:fire" }]))).json()) as { data: { embeds: { url: string }[] } };
    expect(s.data.embeds[0]!.url).toBe("https://site.test/search?q=e%3Afire");
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
