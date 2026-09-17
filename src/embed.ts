/** What a card looks like in Discord: the same lines the site's link
 * unfurl uses (type line, numbers, where it is printed, the ids, then
 * the rules text), with the thresholds drawn as the element symbols when
 * the bot has them, the art below, and the publisher credited. Pure. */
import type { Card, Face, HistoryRow, Printing, PrintingSummary, SetEntry, SetObject } from "./registry";
import { CUSTOM_ID_MAX, buttonRow, linkRow, selectRow, type ActionRow, type Embed } from "./discord";
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
  return clip(rules.trim() ? `${head}\n\n${rules.trim()}` : head);
}

/** Keep a description within the cap, cutting on a word. */
function clip(text: string): string {
  if (text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), MAX_DESCRIPTION - 40))}…`;
}

export interface Reply { embeds: Embed[]; components: ActionRow[] }

/** The card as its default printing shows it. `setNames` maps set codes
 * to names for the "where it is printed" line. */
/** "Shown: Gothic · Booster · Standard, art by Dan Seagrave": which
 * physical print the picture and the printed lines come from, in words. */
export function shownLine(printing: Pick<Printing, "set_name" | "product" | "finish" | "artist"> | null | undefined): string {
  if (!printing) return "";
  const what = [printing.set_name, printing.product, printing.finish].filter(Boolean).join(" · ");
  return `Shown: ${what}${printing.artist ? `, art by ${printing.artist}` : ""}`;
}

export function cardEmbed(card: Card, setNames: Map<string, string>, emojis: EmojiMap, shown: Printing | null = null): Reply {
  const sets = card.set_codes.map((c) => setNames.get(c) ?? c).join(" · ");
  const ids = [card.codex_id, card.default_printing_id].filter(Boolean).join(" · ");
  const lines = [typeLine(card), statsLine(card, emojis), sets ? `Present in ${sets}` : "", shownLine(shown), ids];
  const embed: Embed = {
    title: card.name,
    url: card.kairos_url,
    description: describe(lines, card.rules_text + (card.errata ? "\n\n*This card has recorded errata.*" : "")),
    color: colour(card.elements),
    footer: { text: CREDIT },
  };
  if (card.image_urls) embed.image = { url: card.image_urls.normal };
  const components = [...pickerRows(card, card.default_printing_id), links(card)];
  if (card.back) {
    const back: Embed = { title: `${card.name} — back face`, description: describe([typeLine(card.back), statsLine(card.back, emojis)], card.back.rules_text), color: colour(card.back.elements) };
    return { embeds: [embed, back], components };
  }
  return { embeds: [embed], components };
}

/** The select menu that flips a card message to any of its printings.
 * Only for a card with more than one; its custom_id names the card and
 * the chosen value is the printing id. Discord caps a menu at 25. */
export function pickerRows(card: Pick<Card, "codex_id" | "printings">, selected: string | null): ActionRow[] {
  if (!card.printings || card.printings.length < 2) return [];
  const options = card.printings.slice(0, 25).map((p) => ({
    label: printingLabel(p).slice(0, 100),
    value: p.printing_id,
    description: [p.released_at, p.printing_id, p.printed_as_current === false ? "earlier values" : "", p.retired_at ? "retired" : ""].filter(Boolean).join(" · ").slice(0, 100),
    ...(p.printing_id === selected ? { default: true } : {}),
  }));
  return [selectRow(`pick:${card.codex_id}`, "Show another printing", options)];
}

export function printingLabel(p: Pick<PrintingSummary, "set_name" | "product" | "finish">): string {
  return [p.set_name, p.product, p.finish].filter(Boolean).join(" · ");
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
  return { embeds: [embed], components: [...pickerRows(card, printing.printing_id), linkRow([{ label: "Open on Kairos Archive", url: printing.kairos_url }, { label: "Card", url: card.kairos_url }, { label: "JSON", url: printing.api_url }])] };
}

function links(card: Card): ActionRow {
  return linkRow([{ label: "Open on Kairos Archive", url: card.kairos_url }, { label: "JSON", url: card.api_url }]);
}

/** A search answered by the query API: one small embed per match with
 * its art as a thumbnail, the count and the way to the rest as the
 * message text above them. Discord allows ten embeds a message; five
 * keeps a channel readable. */
export function resultsEmbed(list: QueryList, siteBase: string, apiBase: string): Reply & { content: string } {
  const url = `${siteBase}/search?q=${encodeURIComponent(list.q)}`;
  const shown = list.data.length;
  const first = (list.page - 1) * list.page_size + 1;
  const parts = [`**${list.total} ${list.total === 1 ? "card" : "cards"}** for \`${list.q.slice(0, 200)}\``];
  if (list.page > 1) parts.push(`showing ${first}–${first + shown - 1}`);
  else if (list.total > shown) parts.push(`showing the first ${shown}`);
  if (list.rules_text_total > 0) parts.push(`${list.rules_text_total} more mention it in their rules text`);
  const embeds: Embed[] = list.data.map((c, i) => {
    const stats = statsLine({ ...c, thr_air: 0, thr_earth: 0, thr_fire: 0, thr_water: 0, rules_text: "" } as Face, new Map()).replace(/^Mana: /, "");
    const where = c.printing?.set_name ? [c.printing.set_name, c.printing.product, c.printing.finish].filter(Boolean).join(" · ") : "";
    const embed: Embed = {
      title: c.name,
      url: c.kairos_url,
      description: [typeLine(c), stats, where].filter(Boolean).join(" · "),
      color: colour(c.elements),
    };
    if (c.image_urls?.small) embed.thumbnail = { url: c.image_urls.small };
    if (i === list.data.length - 1) embed.footer = { text: `${CREDIT} · release ${list.release}` };
    return embed;
  });
  return {
    content: parts.join(" · "),
    embeds,
    components: [...pageRows(list), linkRow([{ label: "All results", url }, { label: "JSON", url: `${apiBase}/cards?q=${encodeURIComponent(list.q)}` }, { label: "Syntax", url: `${siteBase}/syntax` }])],
  };
}

/** Previous / Next buttons for a results message. The query rides in the
 * custom_id, so a query too long for Discord's limit gets no buttons and
 * the All results link does the job. */
export function pageRows(list: Pick<QueryList, "q" | "page" | "page_size" | "has_more">): ActionRow[] {
  const id = (page: number) => `page:${page}:${list.q}`;
  if (id(list.page + 1).length > CUSTOM_ID_MAX) return [];
  const buttons = [];
  if (list.page > 1) buttons.push({ label: "Previous", custom_id: id(list.page - 1) });
  if (list.has_more) buttons.push({ label: `Next ${list.page_size}`, custom_id: id(list.page + 1) });
  return buttons.length ? [buttonRow(buttons)] : [];
}

/** A card as one small embed with its art as a thumbnail: the shape a
 * list of cards takes. */
export function smallEmbed(card: Card, setNames: Map<string, string>, emojis: EmojiMap): Embed {
  const sets = card.set_codes.map((c) => setNames.get(c) ?? c).join(" · ");
  const embed: Embed = {
    title: card.name,
    url: card.kairos_url,
    description: [typeLine(card), statsLine(card, emojis), sets, card.codex_id].filter(Boolean).join(" · "),
    color: colour(card.elements),
  };
  if (card.image_urls) embed.thumbnail = { url: card.image_urls.small };
  return embed;
}

/** The answer to "Find cards" on a message: the one card in full, or
 * several as small embeds, with the names that matched nothing named
 * above so nobody wonders. */
export function foundEmbeds(found: { card: Card; shown: Printing | null }[], misses: string[], setNames: Map<string, string>, emojis: EmojiMap): Reply & { content?: string } {
  const content = misses.length ? `No card named ${misses.map((m) => `“${m}”`).join(", ")}.` : undefined;
  if (found.length === 1) {
    const only = found[0]!;
    return { ...cardEmbed(only.card, setNames, emojis, only.shown), ...(content ? { content } : {}) };
  }
  const embeds = found.map((f) => smallEmbed(f.card, setNames, emojis));
  if (embeds.length) embeds[embeds.length - 1]!.footer = { text: CREDIT };
  return { ...(content ? { content } : {}), embeds, components: [linkRow(found.map((f) => ({ label: f.card.name.slice(0, 80), url: f.card.kairos_url })).slice(0, 5))] };
}

const HISTORY_FIELDS: [keyof Face, string][] = [
  ["type", "Type"], ["rarity", "Rarity"], ["subtypes", "Subtypes"], ["elements", "Elements"],
  ["cost", "Mana"], ["attack", "Attack"], ["defense", "Defense"], ["power", "Power"], ["life", "Life"],
  ["thr_air", "Air threshold"], ["thr_earth", "Earth threshold"], ["thr_fire", "Fire threshold"], ["thr_water", "Water threshold"],
];

function show(value: unknown): string {
  if (value === null || value === undefined) return "none";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  return String(value);
}

/** What changed between two faces, one line per field, rules text last. */
export function faceDiff(before: HistoryRow, after: HistoryRow): string[] {
  const lines: string[] = [];
  for (const [key, label] of HISTORY_FIELDS) {
    if (show(before[key]) !== show(after[key])) lines.push(`${label}: ${show(before[key])} → ${show(after[key])}`);
  }
  if (show(before.keywords) !== show(after.keywords)) lines.push(`Keywords: ${show(before.keywords)} → ${show(after.keywords)}`);
  if (before.rules_text.trim() !== after.rules_text.trim()) lines.push(`Rules text, before:\n> ${before.rules_text.trim().replace(/\n/g, "\n> ")}\nAfter:\n> ${after.rules_text.trim().replace(/\n/g, "\n> ")}`);
  return lines;
}

const SOURCE = { api: "as the official API served it", card: "as printed on the card" } as const;

/** /history: every face the card has had, oldest first, each change
 * against the one before, and any earlier names. Dates are when a face
 * took effect in the registry; the publisher's own change may be earlier. */
export function historyEmbed(card: Card, siteBase: string): Reply {
  const rows = card.card_history.toSorted((a, b) => a.valid_from.localeCompare(b.valid_from));
  const sections: string[] = [];
  for (const [i, row] of rows.entries()) {
    const until = row.valid_to ? `until ${row.valid_to}` : "current";
    if (i === 0) {
      sections.push(`**${row.valid_from}** · first face on record, ${SOURCE[row.source] ?? row.source} · ${until}`);
      continue;
    }
    const diff = faceDiff(rows[i - 1]!, row);
    sections.push(`**${row.valid_from}** · ${SOURCE[row.source] ?? row.source} · ${until}\n${diff.length ? diff.join("\n") : "No gameplay change."}`);
  }
  const names = card.name_history.filter((n) => n.valid_to).map((n) => `**${n.valid_from}** · named “${n.name}” until ${n.valid_to}`);
  const quiet = rows.length < 2 && !names.length;
  const head = quiet
    ? `No changes recorded. One face on record since ${rows[0]?.valid_from ?? "the first release"}.`
    : `${rows.length} ${rows.length === 1 ? "face" : "faces"} on record${card.errata ? " · this card has errata" : ""}.`;
  const embed: Embed = {
    title: `History of ${card.name}`,
    url: `${card.kairos_url}#history`,
    color: colour(card.elements),
    description: clip(quiet ? head : [head, ...sections, ...names].join("\n\n")),
    footer: { text: `${CREDIT} · dates are when the registry recorded each face` },
  };
  return { embeds: [embed], components: [linkRow([{ label: "Card", url: card.kairos_url }, { label: "All changes", url: `${siteBase}/changes` }, { label: "JSON", url: card.api_url }])] };
}

/** /set: what a set is, in numbers, with a few of its cards and a way
 * to all of them. `sample` is one card of the set, for its art. */
export function setEmbed(entry: SetEntry, set: SetObject, sample: Card | null, siteBase: string): Reply {
  const names = set.cards.slice(0, 12).map((c) => c.name).join(", ");
  const facts = [
    entry.released_at ? `Released ${entry.released_at}` : "",
    `${entry.cards} ${entry.cards === 1 ? "card" : "cards"} · ${entry.printings} ${entry.printings === 1 ? "printing" : "printings"}`,
    `Set code ${entry.set_code}`,
  ].filter(Boolean).join("\n");
  const embed: Embed = {
    title: entry.set_name,
    url: entry.kairos_url,
    color: sample ? colour(sample.elements) : NEUTRAL_COLOUR,
    description: clip(names ? `${facts}\n\n${names}${set.cards.length > 12 ? `, and ${set.cards.length - 12} more` : ""}` : facts),
    footer: { text: CREDIT },
  };
  if (sample?.image_urls) embed.thumbnail = { url: sample.image_urls.small };
  return { embeds: [embed], components: [linkRow([{ label: "Open on Kairos Archive", url: entry.kairos_url }, { label: "Search this set", url: `${siteBase}/search?q=${encodeURIComponent(`s:${entry.set_code}`)}` }, { label: "JSON", url: entry.api_url }])] };
}

/** The search syntax in one screen: the keys people reach for, the
 * operators, the flags, and three examples, with the full page a click
 * away. Sent to the caller alone. */
export function syntaxEmbed(siteBase: string): Reply {
  const embed: Embed = {
    title: "Search syntax, the short version",
    url: `${siteBase}/syntax`,
    color: NEUTRAL_COLOUR,
    description: [
      "Bare words match the **name**. Combine terms with spaces (and), `or`, `-` (not) and parentheses.",
      "",
      "**Card keys**  `t:` type · `cat:` category · `sub:` subtype · `e:` element · `r:` rules text · `k:` keyword · `rarity:` · `cost:` `pow:` `atk:` `def:` `life:` · `air:` `earth:` `fire:` `water:` threshold · `id:` `slug:`",
      "**Printing keys**  `s:` set · `pro:` product · `f:` finish · `a:` artist · `tl:` typeline · `ft:` flavour · `year:` `date:`",
      "**Numbers**  `cost:3` `cost>=3` `cost<=2` `cost!=3` `cost:x` `cost:even`",
      "**Flags**  `is:errata` `is:dfc` `is:reprint` `is:foil` `is:promo` `is:current` `has:image` · `is:multi` for two or more elements",
      "**Results**  `unique:cards` (default) `unique:prints` `unique:art` · `sort:cost` `order:desc`",
      "",
      "**Examples**",
      "`t:minion e:fire cost<=2`",
      "`a:\"Drew Tucker\" unique:prints`",
      "`e:water e:air is:errata sort:cost`",
    ].join("\n"),
  };
  return { embeds: [embed], components: [linkRow([{ label: "Full syntax", url: `${siteBase}/syntax` }, { label: "Advanced search", url: `${siteBase}/advanced` }])] };
}

/** A search the bot could not run: the site can, so the reply is the
 * link, with the query readable in the title. */
export function searchEmbed(query: string, siteBase: string): Reply {
  const url = `${siteBase}/search?q=${encodeURIComponent(query)}`;
  const embed: Embed = { title: `Search: ${query.slice(0, 240)}`, url, description: "Results on Kairos Archive, in the site's search syntax.", color: NEUTRAL_COLOUR };
  return { embeds: [embed], components: [linkRow([{ label: "Open results", url }, { label: "Syntax", url: `${siteBase}/syntax` }])] };
}
