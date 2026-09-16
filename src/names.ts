/** Turning what a person typed into a card. Autocomplete and the /card
 * command share one ranking: an exact name first, then names that start
 * with the text, then names with a word that starts with it, then any
 * name containing it. Case and accents are ignored, so "dryad" finds
 * "Dryad" and "arthur" finds "King Arthur". */
import type { IndexCard } from "./registry";

export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Ranked matches for `text`, best first, at most `limit`. */
export function matchNames<T extends { name: string }>(cards: T[], text: string, limit = 25): T[] {
  const q = fold(text);
  if (!q) return cards.slice(0, limit);
  const ranked: { card: T; rank: number }[] = [];
  for (const card of cards) {
    const name = fold(card.name);
    let rank: number;
    if (name === q) rank = 0;
    else if (name.startsWith(q)) rank = 1;
    else if (name.includes(` ${q}`)) rank = 2;
    else if (name.includes(q)) rank = 3;
    else continue;
    ranked.push({ card, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.card.name.localeCompare(b.card.name));
  return ranked.slice(0, limit).map((r) => r.card);
}

/** The one card `text` means, or null when nothing matches. An exact
 * name wins outright; otherwise the best-ranked match, so a person who
 * types "polar" and presses enter still gets Polar Bears. */
export function resolveName(cards: IndexCard[], text: string): IndexCard | null {
  return matchNames(cards, text, 1)[0] ?? null;
}

const ID = /^\s*([CP])\s*0*(\d{1,6})\s*$/i;

/** "C230", "c000230", "P 937" read as ids; anything else is not one. */
export function parseId(text: string): { kind: "card" | "printing"; id: string } | null {
  const m = ID.exec(text);
  if (!m) return null;
  const kind = m[1]!.toUpperCase() === "C" ? "card" : "printing";
  return { kind, id: `${m[1]!.toUpperCase()}${m[2]!.padStart(6, "0")}` };
}
