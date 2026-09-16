import { describe, expect, it } from "vitest";
import { applicationEmojis } from "../src/emoji";

describe("applicationEmojis", () => {
  it("maps the four elements by name and caches per application", async () => {
    let calls = 0;
    const f = async () => { calls++; return new Response(JSON.stringify({ items: [{ id: "11", name: "thr_fire" }, { id: "22", name: "thr_water" }, { id: "33", name: "other" }] })); };
    const a = await applicationEmojis("app-a", "token", f);
    const b = await applicationEmojis("app-a", "token", f);
    expect(a.get("Fire")).toBe("<:thr_fire:11>");
    expect(a.get("Water")).toBe("<:thr_water:22>");
    expect(a.has("Air")).toBe(false);
    expect(b).toBe(a);
    expect(calls).toBe(1);
  });
  it("is empty without a token and after a failed lookup, which is retried next time", async () => {
    expect((await applicationEmojis("app-b", undefined)).size).toBe(0);
    let status = 500;
    const f = async () => new Response(status === 200 ? JSON.stringify({ items: [{ id: "1", name: "thr_air" }] }) : "no", { status });
    expect((await applicationEmojis("app-c", "t", f)).size).toBe(0);
    status = 200;
    expect((await applicationEmojis("app-c", "t", f)).get("Air")).toBe("<:thr_air:1>");
  });
});
