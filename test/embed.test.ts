import { describe, expect, it } from "vitest";
import { CREDIT, MAX_DESCRIPTION, cardEmbed, colour, faceDiff, foundEmbeds, historyEmbed, pageRows, printingEmbed, searchEmbed, setEmbed, smallEmbed, statsLine, thresholdText, typeLine, wordDiff } from "../src/embed";
import type { ActionButton, LinkButton, SelectMenu } from "../src/discord";
import type { Card, Printing, SetObject } from "../src/registry";
import { cards, printings, setObjects, sets } from "./fixtures";

const setNames = new Map(sets.map((s) => [s.set_code, s.set_name]));
const troll = cards["C000927"] as Card;
const knight = cards["C000429"] as Card;
const druid = cards["C000459"] as Card;
const bears = cards["C000230"] as Card;
const labels = (row: { components: unknown[] }) => (row.components as (LinkButton | ActionButton)[]).map((b) => b.label);
const links = (row: { components: unknown[] }) => (row.components as LinkButton[]).map((b) => [b.label, b.url]);
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
    expect(e.description).toBe("Minion — Ordinary Giant\nMana: 3 · Threshold: <:thr_water:4> · Power: 3\nPresent in Gothic\nC000927 · P002719\n\nStealth\nLoses Stealth if it moves.\n\n*This card has recorded errata.*");
    expect(e.color).toBe(0x2b6cb0);
    expect(e.image?.url).toMatch(/P002719\..*\.normal\.webp$/);
    expect(e.footer?.text).toBe(CREDIT);
    // Two printings: the picker row comes first, the links after it.
    const picker = components[0]!.components[0] as SelectMenu;
    expect(picker.custom_id).toBe("pick:C000927");
    expect(picker.options.map((o) => [o.label, o.value, o.default ?? false])).toEqual([["Gothic · Booster · Standard", "P002719", true], ["Gothic · Booster · Foil", "P002720", false]]);
    expect(links(components[1]!)).toEqual([
      ["Open on Kairos Archive", "https://kairosarchive.net/cards/C000927"],
      ["JSON", "https://api.kairosarchive.net/v3/cards/C000927.json"],
    ]);
  });
  it("offers no picker for a card with one printing", () => {
    const one = { ...troll, printings: troll.printings.slice(0, 1) };
    expect(cardEmbed(one, setNames, none).components).toHaveLength(1);
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
    expect((components[0]!.components[0] as SelectMenu).options.find((o) => o.default)?.value).toBe("P002719");
    expect(labels(components[1]!)).toEqual(["Open on Kairos Archive", "Card", "JSON"]);
  });
});

describe("pageRows", () => {
  it("offers Next on the first page, both in the middle, and nothing for a query too long to carry", () => {
    expect(labels(pageRows({ q: "e:fire", page: 1, page_size: 5, has_more: true })[0]!)).toEqual(["Next 5"]);
    const middle = pageRows({ q: "e:fire", page: 3, page_size: 5, has_more: true })[0]!;
    expect((middle.components as ActionButton[]).map((b) => b.custom_id)).toEqual(["page:2:e:fire", "page:4:e:fire"]);
    expect(pageRows({ q: "e:fire", page: 1, page_size: 5, has_more: false })).toEqual([]);
    expect(pageRows({ q: "x".repeat(95), page: 1, page_size: 5, has_more: true })).toEqual([]);
  });
});

describe("foundEmbeds", () => {
  it("shows one card in full and several as small embeds, naming the misses", () => {
    const one = foundEmbeds([{ card: troll, shown: null }], ["Foo"], setNames, none);
    expect(one.embeds[0]!.image).toBeDefined();
    expect(one.content).toBe("No card named “Foo”.");
    const two = foundEmbeds([{ card: troll, shown: null }, { card: bears, shown: null }], [], setNames, none);
    expect(two.content).toBeUndefined();
    expect(two.embeds.map((e) => e.title)).toEqual(["Moss Troll", "Polar Bears"]);
    expect(two.embeds[1]!.thumbnail?.url).toMatch(/small\.webp$/);
    expect(two.embeds[1]!.footer?.text).toBe(CREDIT);
    expect(labels(two.components[0]!)).toEqual(["Moss Troll", "Polar Bears"]);
    expect(smallEmbed(bears, setNames, none).description).toBe("Minion — Ordinary Beast · Mana: 2 · Threshold: 1 Water · Power: 2 · Alpha · Beta · C000230");
  });
});

describe("historyEmbed", () => {
  it("gives each face a field, diffed against the one before, plus earlier names and the art", () => {
    const { embeds, components } = historyEmbed(troll, emojis, "https://site.test");
    const e = embeds[0]!;
    expect(e.title).toBe("History of Moss Troll");
    expect(e.description).toBe("Minion — Ordinary Giant · C000927\n⚠️ 2 faces on record · this card has errata.");
    expect(e.thumbnail?.url).toBe(troll.image_urls!.small);
    expect(e.fields!.map((f) => f.name)).toEqual(["2025-12-05 → 2026-09-15", "2026-09-15 → now", "🏷️ 2025-12-05 → 2026-01-10"]);
    expect(e.fields![0]!.value).toBe("✍️ First face on record, as printed on the card.");
    expect(e.fields![1]!.value).toBe("🌐 As the official API served it.\nMana 4 → 3\n📝 Stealth\nLoses Stealth if it ~~moves or attacks.~~ **moves.**");
    expect(e.fields![2]!.value).toBe("Named “Moss Troll of the Fen”.");
    expect(labels(components[0]!)).toEqual(["Card", "All changes", "JSON"]);
  });
  it("says so when nothing changed, with no fields", () => {
    const e = historyEmbed(bears, none, "https://site.test").embeds[0]!;
    expect(e.description).toBe("Minion — Ordinary Beast · C000230\nNo changes recorded. One face on record since 2026-08-19.");
    expect(e.fields).toEqual([]);
  });
  it("diffs only what differs, thresholds with the symbols", () => {
    const [a, b] = troll.card_history;
    expect(faceDiff(a!, a!)).toEqual([]);
    expect(faceDiff(a!, { ...b!, subtypes: ["Giant", "Troll"], thr_water: 2, rules_text: a!.rules_text }, emojis)).toEqual(["Subtypes Giant → Giant, Troll", "Mana 4 → 3", "Threshold <:thr_water:4> → <:thr_water:4><:thr_water:4>"]);
  });
  it("marks removed words struck and added words bold, old before new, per line", () => {
    expect(wordDiff("Deals 2 damage.", "Deals 3 damage to each unit.")).toBe("Deals ~~2 damage.~~ **3 damage to each unit.**");
    expect(wordDiff("Airborne\nDamage dealt by Blood Ravens' strikes heals you.", "Airborne\nBlood Ravens' strike damage against units heals you."))
      .toBe("Airborne\n~~Damage dealt by~~ Blood Ravens' ~~strikes~~ **strike damage against units** heals you.");
    expect(wordDiff("same text", "same text")).toBe("same text");
    expect(wordDiff("", "Genesis → Draw a card.")).toBe("**Genesis → Draw a card.**");
  });
});

describe("setEmbed", () => {
  it("gives the numbers, some names and a sample's art", () => {
    const entry = sets.find((s) => s.set_code === "006")!;
    const { embeds, components } = setEmbed(entry, setObjects["006"] as SetObject, troll, "https://site.test");
    expect(embeds[0]!.title).toBe("Gothic");
    expect(embeds[0]!.description).toBe("Released 2025-12-05\n107 cards · 214 printings\nSet code 006\n\nMoss Troll");
    expect(embeds[0]!.thumbnail?.url).toBe(troll.image_urls!.small);
    expect(links(components[0]!)[1]).toEqual(["Search this set", "https://site.test/search?q=s%3A006"]);
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
