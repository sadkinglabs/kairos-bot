/** What a card looks like in Discord: the same lines the site's link
 * unfurl uses (type line, numbers, where it is printed, the ids, then
 * the rules text), with the thresholds drawn as the element symbols when
 * the bot has them, the art below, and the publisher credited. Pure. */
import type { Card, Face, Printing } from "./registry";
import { linkRow, type ActionRow, type Embed } from "./discord";
import type { EmojiMap } from "./emoji";
import type { QueryList } from "./query";

export const CREDIT = "Kairos Archive · Card text and art © Erik's Curiosa";

/** Longest description the bot sends; Discord allows 4,096. */
export const MAX_DESCRIPTION = 2000;

const ELEMENT_COLOURS: Record<string, number> = { Air: 0xd9d3c2, Earth: 0x8a5a2b, Fire: 0xc8412b, Water: 0x2b6cb0 };
const NEUTRAL_COLOUR = 0x7d7871;

export function colour(elements: string[]): number {
  const first = elements.find((e) => e in ELEMENT_COLOURS);
  return first ? ELEMENT_COLOURS[first]! : NEUTRAL_COLOUR;
}

/** "Minion — Ordinary Giant": type, then rarity and subtypes as printed. */
export function typeLine(face: Pick<Face, "type" | "subtypes" | "rarity">): string {
  const printed = [face.rarity, face.subtypes.join(", ")].filter(Boolean).join(" ");
  return [face.type, printed].filter(Boolean).join(" — ");
}

/** The symbols as the card shows them, one per point, or "1 Fire, 1 Water"
 * without emojis. Empty when the face needs no threshold. */
export function thresholdText(face: Pick<Face, "thr_air" | "thr_earth" | "thr_fire" | "thr_water">, emojis: EmojiMap): string {
  const parts = ([["Air", face.thr_air], ["Earth", face.thr_earth], ["Fire", face.thr_fire], ["Water", face.thr_water]] as const).filter(([, n]) => n > 0);
  if (parts.every(([e]) => emojis.has(e))) return parts.map(([e, n]) => emojis.get(e)!.repeat(n)).join(" ");
  return parts.map(([e, n]) => `${n} ${e}`).join(", ");
}

/** "Mana: 5 · Threshold: … · Attack: 5 / Defense: 3 · Power: 4", each part
 * only when the face has it; power alone when attack equals defense. */
export function statsLine(face: Face, emojis: EmojiMap): string {
  const parts: string[] = [];
  if (face.cost !== null) parts.push(`Mana: ${face.cost}`);
  const thr = thresholdText(face, emojis);
  if (thr) parts.push(`Threshold: ${thr}`);
  if (face.attack !== null && face.defense !== null && face.attack !== face.defense) {
    parts.push(`Attack: ${face.attack} / Defense: ${face.defense}`);
    if (face.power !== null) parts.push(`Power: ${face.power}`);
  } else if (face.power !== null) parts.push(`Power: ${face.power}`);
  if (face.life !== null) parts.push(`Life: ${face.life}`);
  return parts.join(" · ");
}

function describe(lines: string[], rules: string): string {
  const head = lines.filter(Boolean).join("\n");
  const text = rules.trim() ? `${head}\n\n${rules.trim()}` : head;
  if (text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), MAX_DESCRIPTION - 40))}…`;
}

export interface Reply { embeds: Embed[]; components: ActionRow[] }

/** The card as its default printing shows it. `setNames` maps set codes
 * to names for the "where it is printed" line. */
export function cardEmbed(card: Card, setNames: Map<string, string>, emojis: EmojiMap): Reply {
  const sets = card.set_codes.map((c) => setNames.get(c) ?? c).join(" · ");
  const ids = [card.codex_id, card.default_printing_id].filter(Boolean).join(" · ");
  const lines = [typeLine(card), statsLine(card, emojis), sets, ids];
  const embed: Embed = {
    title: card.name,
    url: card.kairos_url,
    description: describe(lines, card.rules_text + (card.errata ? "\n\n*This card has recorded errata.*" : "")),
    color: colour(card.elements),
    footer: { text: CREDIT },
  };
  if (card.image_urls) embed.image = { url: card.image_urls.normal };
  if (card.back) {
    const back: Embed = { title: `${card.name} — back face`, description: describe([typeLine(card.back), statsLine(card.back, emojis)], card.back.rules_text), color: colour(card.back.elements) };
    return { embeds: [embed, back], components: [links(card)] };
  }
  return { embeds: [embed], components: [links(card)] };
}

/** One physical print: its own art, its set, product and finish, the
 * artist and flavour text, and a note when its printed values are out of
 * date. The gameplay lines still come from the card. */
export function printingEmbed(printing: Printing, card: Card, emojis: EmojiMap): Reply {
  const where = [printing.set_name, printing.product, printing.finish].filter(Boolean).join(" · ");
  const lines = [
    typeLine(card),
    statsLine(card, emojis),
    [where, printing.artist ? `Art by ${printing.artist}` : ""].filter(Boolean).join(" · "),
    `${card.codex_id} · ${printing.printing_id}`,
  ];
  const notes: string[] = [];
  if (printing.flavour_text.trim()) notes.push(`*${printing.flavour_text.trim()}*`);
  if (printing.printed_as_current === false) notes.push("*This printing shows earlier values; the card has since changed.*");
  if (printing.retired_at) notes.push(`*Retired ${printing.retired_at}.*`);
  const embed: Embed = {
    title: `${card.name} — ${where}`,
    url: printing.kairos_url,
    description: describe(lines, [card.rules_text, ...notes].filter(Boolean).join("\n\n")),
    color: colour(card.elements),
    footer: { text: CREDIT },
  };
  if (printing.image_urls) embed.image = { url: printing.image_urls.normal };
  return { embeds: [embed], components: [linkRow([{ label: "Open on Kairos Archive", url: printing.kairos_url }, { label: "Card", url: card.kairos_url }, { label: "JSON", url: printing.api_url }])] };
}

function links(card: Card): ActionRow {
  return linkRow([{ label: "Open on Kairos Archive", url: card.kairos_url }, { label: "JSON", url: card.api_url }]);
}

/** A search answered by the query API: the first matches as lines, each
 * a link to its card page, with the count and the way to the rest. */
export function resultsEmbed(list: QueryList, siteBase: string, apiBase: string): Reply {
  const url = `${siteBase}/search?q=${encodeURIComponent(list.q)}`;
  const lines = list.data.map((c) => {
    const stats = statsLine({ ...c, thr_air: 0, thr_earth: 0, thr_fire: 0, thr_water: 0, rules_text: "" } as Face, new Map()).replace(/^Mana: /, "");
    return `[**${c.name}**](${c.kairos_url}) · ${typeLine(c)}${stats ? ` · ${stats}` : ""}`;
  });
  const shown = list.data.length;
  const more = list.total > shown ? `\n\n…and ${list.total - shown} more.` : "";
  const rules = list.rules_text_total > 0 ? `\n${list.rules_text_total} more mention it in their rules text.` : "";
  const embed: Embed = {
    title: `${list.total} ${list.total === 1 ? "card" : "cards"} for “${list.q.slice(0, 200)}”`,
    url,
    description: (lines.join("\n") + more + rules).slice(0, MAX_DESCRIPTION),
    color: NEUTRAL_COLOUR,
    footer: { text: `${CREDIT} · release ${list.release}` },
  };
  return { embeds: [embed], components: [linkRow([{ label: "All results", url }, { label: "JSON", url: `${apiBase}/cards?q=${encodeURIComponent(list.q)}` }, { label: "Syntax", url: `${siteBase}/syntax` }])] };
}

/** A search the bot could not run: the site can, so the reply is the
 * link, with the query readable in the title. */
export function searchEmbed(query: string, siteBase: string): Reply {
  const url = `${siteBase}/search?q=${encodeURIComponent(query)}`;
  const embed: Embed = { title: `Search: ${query.slice(0, 240)}`, url, description: "Results on Kairos Archive, in the site's search syntax.", color: NEUTRAL_COLOUR };
  return { embeds: [embed], components: [linkRow([{ label: "Open results", url }, { label: "Syntax", url: `${siteBase}/syntax` }])] };
}
