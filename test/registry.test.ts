import { describe, expect, it } from "vitest";
import { RECHECK_MS, Registry } from "../src/registry";
import { BASE, fakeFetch } from "./fake";

describe("Registry", () => {
  it("resolves the release once and serves the index from memory", async () => {
    const f = fakeFetch();
    const r = new Registry(BASE, f, () => 1000);
    const a = await r.current();
    const b = await r.current();
    expect(a.tag).toBe("v3.9.0");
    expect(a.cards.length).toBe(6);
    expect(a.sets.get("006")).toBe("Gothic");
    expect(b).toBe(a);
    expect(f.calls).toEqual([`${BASE}/versions.json`, `${BASE}/v3.9.0/index/cards.json`, `${BASE}/v3.9.0/sets.json`]);
  });
  it("re-reads versions.json after the recheck window and keeps the index when the tag is unchanged", async () => {
    let now = 1000;
    const f = fakeFetch();
    const r = new Registry(BASE, f, () => now);
    await r.current();
    now += RECHECK_MS + 1;
    await r.current();
    expect(f.calls.filter((u) => u.endsWith("versions.json"))).toHaveLength(2);
    expect(f.calls.filter((u) => u.endsWith("index/cards.json"))).toHaveLength(1);
  });
  it("fetches cards and printings from the release root and returns null for a missing id", async () => {
    const f = fakeFetch();
    const r = new Registry(BASE, f);
    expect((await r.card("C000927"))?.name).toBe("Moss Troll");
    expect((await r.printing("P002719"))?.artist).toBe("Dan Seagrave");
    expect(await r.card("C999999")).toBeNull();
    expect(f.calls).toContain(`${BASE}/v3.9.0/cards/C000927.json`);
  });
  it("keeps serving the release in memory when a re-check fails", async () => {
    let now = 1000;
    let down = false;
    const good = fakeFetch();
    const f = ((url: string) => (down && url.endsWith("versions.json") ? Promise.resolve(new Response("x", { status: 503 })) : good(url))) as typeof good;
    const r = new Registry(BASE, f, () => now);
    const first = await r.current();
    now += RECHECK_MS + 1;
    down = true;
    const second = await r.current();
    expect(second.tag).toBe(first.tag);
    expect(second.cards).toBe(first.cards);
  });
  it("retries a failed resolution on the next call", async () => {
    const f = fakeFetch({ "versions.json": new Response("down", { status: 503 }) });
    const r = new Registry(BASE, f);
    await expect(r.current()).rejects.toThrow("HTTP 503");
    const g = fakeFetch();
    const r2 = new Registry(BASE, g);
    expect((await r2.current()).tag).toBe("v3.9.0");
  });
});
