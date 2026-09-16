import { describe, expect, it } from "vitest";
import { matchNames, parseId, resolveName } from "../src/names";
import { index } from "./fixtures";

describe("matchNames", () => {
  it("ranks exact, then prefix, then word start, then anywhere", () => {
    const cards = [{ name: "Bear Cub" }, { name: "Polar Bears" }, { name: "Bear" }, { name: "Forbearance" }];
    expect(matchNames(cards, "bear").map((c) => c.name)).toEqual(["Bear", "Bear Cub", "Polar Bears", "Forbearance"]);
  });
  it("ignores case, accents and surrounding space", () => {
    expect(matchNames(index, "  MOSS ").map((c) => c.name)).toEqual(["Moss Troll"]);
    expect(matchNames([{ name: "Élan" }], "elan").map((c) => c.name)).toEqual(["Élan"]);
  });
  it("returns the first cards for an empty query and caps the list", () => {
    expect(matchNames(index, "", 2)).toHaveLength(2);
    expect(matchNames(index, "a", 3)).toHaveLength(3);
  });
});

describe("resolveName", () => {
  it("finds the best match and null for nonsense", () => {
    expect(resolveName(index, "polar")?.codex_id).toBe("C000230");
    expect(resolveName(index, "xyzzy")).toBeNull();
  });
});

describe("parseId", () => {
  it("reads padded and unpadded ids in either case", () => {
    expect(parseId("C000230")).toEqual({ kind: "card", id: "C000230" });
    expect(parseId("c230")).toEqual({ kind: "card", id: "C000230" });
    expect(parseId(" p 937 ")).toEqual({ kind: "printing", id: "P000937" });
  });
  it("is null for names and other text", () => {
    expect(parseId("Polar Bears")).toBeNull();
    expect(parseId("C1234567")).toBeNull();
    expect(parseId("")).toBeNull();
  });
});
