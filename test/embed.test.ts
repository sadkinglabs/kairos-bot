import { describe, expect, it } from "vitest";
import { CREDIT, MAX_DESCRIPTION, cardEmbed, colour, printingEmbed, searchEmbed, statsLine, thresholdText, typeLine } from "../src/embed";
import type { Card, Printing } from "../src/registry";
import { cards, printings, sets } from "./fixtures";

const setNames = new Map(sets.map((s) => [s.set_code, s.set_name]));
const troll = cards["C000927"] as Card;
const knight = cards["C000429"] as Card;
const druid = cards["C000459"] as Card;
const emojis = new Map([["Air", "<:thr_air:1>"], ["Earth", "<:thr_earth:2>"], ["Fire", "<:thr_fire:3>"], ["Water", "<:thr_water:4>"]]);
const none = new Map<string, string>();

describe("lines", () => {
  it("reads the type line as the card prints it, without the element", () => {
    expect(typeLine(troll)).toBe("Minion — Ordinary Giant");
    expect(typeLine(knight)).toBe("Minion — Exceptional Mortal");
  });
  it("draws one symbol per threshold point, or words without emojis", () => {
    expect(thresholdText(knight, emojis)).toBe("<:thr_fire:3> <:thr_water:4>");
    expect(thresholdText({ ...knight, thr_water: 2 }, emojis)).toBe("<:thr_fire:3> <:thr_water:4><:thr_water:4>");
    expect(thresholdText(knight, none)).toBe("1 Fire, 1 Water");
    expect(thresholdText(knight, new Map([["Fire", "<:f:1>"]]))).toBe("1 Fire, 1 Water");
  });
  it("names each number and shows attack and defense only when they differ", () => {
    expect(statsLine(troll, none)).toBe("Mana: 3 · Threshold: 1 Water · Power: 3");
    expect(statsLine(knight, none)).toBe("Mana: 5 · Threshold: 1 Fire, 1 Water · Attack: 5 / Defense: 3 · Power: 4");
  });
});

describe("cardEmbed", () => {
  it("carries the facts, the ids, the rules, the art and the credit", () => {
    const { embeds, components } = cardEmbed(troll, setNames, emojis);
    const e = embeds[0]!;
    expect(e.title).toBe("Moss Troll");
    expect(e.url).toBe("https://kairosarchive.net/cards/C000927");
    expect(e.description).toBe("Minion — Ordinary Giant\nMana: 3 · Threshold: <:thr_water:4> · Power: 3\nPresent in Gothic\nC000927 · P002719\n\nStealth\nLoses Stealth if it moves.");
    expect(e.color).toBe(0x2b6cb0);
    expect(e.image?.url).toMatch(/P002719\..*\.normal\.webp$/);
    expect(e.footer?.text).toBe(CREDIT);
    expect(components[0]!.components.map((b) => [b.label, b.url])).toEqual([
      ["Open on Kairos Archive", "https://kairosarchive.net/cards/C000927"],
      ["JSON", "https://api.kairosarchive.net/v3/cards/C000927.json"],
    ]);
  });
  it("adds a second embed for a back face", () => {
    const { embeds } = cardEmbed(druid, setNames, none);
    expect(embeds).toHaveLength(2);
    expect(embeds[1]!.title).toBe("Druid — back face");
    expect(embeds[1]!.description).toContain(druid.back!.rules_text.trim().slice(0, 20));
  });
  it("keeps the description within the cap, cutting on a word", () => {
    const long = { ...troll, rules_text: "word ".repeat(1000) };
    const d = cardEmbed(long, setNames, none).embeds[0]!.description!;
    expect(d.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(d.endsWith("word…")).toBe(true);
  });
});

describe("printingEmbed", () => {
  it("names the print, its art, the artist and the flavour text", () => {
    const p = printings["P002719"] as Printing;
    const { embeds, components } = printingEmbed(p, troll, none);
    const e = embeds[0]!;
    expect(e.title).toBe("Moss Troll — Gothic · Booster · Standard");
    expect(e.description).toContain("Gothic · Booster · Standard · Art by Dan Seagrave\nC000927 · P002719\n\n");
    expect(e.description).toContain("*Moss grows fat on a troll in stone.*");
    expect(e.image?.url).toBe(p.image_urls!.normal);
    expect(components[0]!.components.map((b) => b.label)).toEqual(["Open on Kairos Archive", "Card", "JSON"]);
  });
});

describe("searchEmbed and colour", () => {
  it("links the site's search with the query encoded", () => {
    const { embeds } = searchEmbed("t:minion e:fire cost<=2", "https://kairosarchive.net");
    expect(embeds[0]!.url).toBe("https://kairosarchive.net/search?q=t%3Aminion%20e%3Afire%20cost%3C%3D2");
  });
  it("colours by the first element and grey for none", () => {
    expect(colour(["Fire", "Water"])).toBe(0xc8412b);
    expect(colour(["None"])).toBe(0x7d7871);
  });
});
