import { describe, expect, it } from "vitest";
import { cardEmbed, historyEmbed, pickerRows, printingEmbed, provenanceLines, setEmbed } from "../src/embed";
import type { LinkButton } from "../src/discord";
import { matchSets } from "../src/names";
import type { Card, Printing, SetEntry, SetObject } from "../src/registry";
import { cards, printings, setObjects, sets } from "./fixtures";

/** Schema 12: records kept by hand, notes and the release a promo came out
 * with. Built on the fixtures, which are a v3.3.x release without them. */
const setNames = new Map([...sets.map((s) => [s.set_code, s.set_name] as [string, string]), ["CUR", "Curios"]]);
const bears = cards["C000230"] as Card;
const alpha = printings["P000935"] as Printing;
const none = new Map<string, string>();
const manual = { source: "Store kit card, photographed", recorded: "2026-09-22", confirmed_at: null, withdrawn: null };

describe("a release without schema 12", () => {
  it("adds nothing to a card or printing", () => {
    expect(provenanceLines(bears, "card")).toEqual([]);
    expect(cardEmbed(bears, setNames, none).embeds[0]!.description).not.toMatch(/Recorded by hand|📝/);
    expect(printingEmbed(alpha, bears, none, setNames).embeds[0]!.description).not.toMatch(/Released with/);
  });
});

describe("records kept by hand", () => {
  it("say so under the rules text, with the source", () => {
    const card = { ...bears, origin: "manual" as const, manual };
    expect(cardEmbed(card, setNames, none).embeds[0]!.description)
      .toContain("*Recorded by hand: the official API does not serve this card. Source: Store kit card, photographed.*");
  });
  it("say when upstream confirmed them, and when they were withdrawn", () => {
    expect(provenanceLines({ origin: "api", manual: { ...manual, confirmed_at: "2026-10-01" } }, "card"))
      .toEqual(["*Recorded by hand, then confirmed in the official API on 2026-10-01.*"]);
    expect(provenanceLines({ origin: "manual", manual: { ...manual, withdrawn: { on: "2026-09-30", reason: "A duplicate." } } }, "printing")[0])
      .toBe("*Withdrawn 2026-09-30: A duplicate.*");
  });
  it("show notes with their source", () => {
    const card = { ...bears, notes: [{ text: "Prize support in a store kit.", source: "Community report, Sorcery Discord", recorded: "2026-09-22" }] };
    expect(cardEmbed(card, setNames, none).embeds[0]!.description).toContain("📝 Prize support in a store kit. *(Community report, Sorcery Discord)*");
  });
  it("a curio names the release it came out with, and survives unknown text", () => {
    const curio: Printing = { ...alpha, printing_id: "P003092", set_code: "CUR", set_name: "Curios", product: "Curio",
      artist: null, flavour_text: null, typeline: null, released_with: "001", origin: "manual", manual };
    const description = printingEmbed(curio, bears, none, setNames).embeds[0]!.description!;
    expect(description).toContain("Released with Alpha");
    expect(description).toContain("does not serve this printing");
  });
  it("are marked in the printing picker", () => {
    const card = { ...bears, printings: bears.printings.map((p, i) => (i === 0 ? { ...p, origin: "manual" as const } : p)) };
    const menu = pickerRows(card, null)[0]!.components[0] as { options: { description: string }[] };
    expect(menu.options[0]!.description).toContain("recorded by hand");
  });
  it("/history says a one-face manual card was recorded by hand", () => {
    const card = { ...bears, card_history: bears.card_history.slice(0, 1).map((r) => ({ ...r, source: "manual" as const, valid_to: null })) };
    expect(historyEmbed(card, none, "https://site.test").embeds[0]!.description).toContain("recorded by hand from the card: the official API does not serve it");
  });
  it("/history dates a face recorded by hand like a printed one", () => {
    const first = { ...bears.card_history[0]!, source: "manual" as const, valid_from: "2023-06-22", valid_to: "2024-01-01" };
    const card = { ...bears, card_history: [first, { ...first, source: "api" as const, valid_from: "2024-01-01", valid_to: null, cost: 9 }] };
    const field = historyEmbed(card, none, "https://site.test").embeds[0]!.fields![0]!;
    expect(field.name).toBe("🖐️ Historical values · in force from 2023-06-22");
  });
});

describe("sets", () => {
  it("/set finds a set of the registry's own by its letter code", () => {
    const withCurios = [...sets, { set_code: "CUR", set_name: "Curios" }];
    expect(matchSets(withCurios, "cur")[0]!.set_code).toBe("CUR");
    expect(matchSets(withCurios, "CUR")[0]!.set_code).toBe("CUR");
    expect(matchSets(withCurios, "006")[0]!.set_code).toBe("006");
    // A code is a label, written in full: "6" is not "006".
    expect(matchSets(withCurios, "6").map((s) => s.set_code)).not.toContain("006");
  });
  it("a release set links to the promos released with it, as its recorded kind says", () => {
    const entry = { ...(sets.find((s) => s.set_code === "006") as SetEntry), kind: "release" as const };
    const buttons = (setEmbed(entry, setObjects["006"] as SetObject, null, "https://site.test").components[0]!.components as LinkButton[]);
    expect(buttons.map((b) => b.label)).toContain("Promos released with it");
    expect(buttons.find((b) => b.label === "Promos released with it")!.url).toBe(`https://site.test/search?q=${encodeURIComponent("with:006 -s:006 unique:prints")}`);
    const promo = { ...entry, set_code: "999", set_name: "Promo", kind: "promo" as const };
    expect((setEmbed(promo, setObjects["006"] as SetObject, null, "https://site.test").components[0]!.components as LinkButton[]).map((b) => b.label))
      .not.toContain("Promos released with it");

    // A code shaped like a release's is still not one unless recorded so,
    // and a release made before kind existed says nothing.
    for (const other of [{ ...entry, set_code: "998", kind: "promo" as const }, { ...entry, kind: undefined }]) {
      expect((setEmbed(other, setObjects["006"] as SetObject, null, "https://site.test").components[0]!.components as LinkButton[]).map((b) => b.label))
        .not.toContain("Promos released with it");
    }
  });
});
