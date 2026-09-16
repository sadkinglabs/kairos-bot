/** One function per slash command, plus the autocomplete. Each takes the
 * parsed interaction and the services it needs and returns Discord's
 * response body, so the router in index.ts stays a switch. */
import { choices, focusedValue, message, optionValue, whisper, type Interaction } from "./discord";
import { cardEmbed, printingEmbed, searchEmbed } from "./embed";
import type { EmojiMap } from "./emoji";
import { matchNames, parseId, resolveName } from "./names";
import type { Registry } from "./registry";

export interface Services { registry: Registry; emojis: EmojiMap; siteBase: string; random: () => number }

export async function autocomplete(interaction: Interaction, s: Services): Promise<Response> {
  const { cards } = await s.registry.current();
  const text = focusedValue(interaction);
  return choices(matchNames(cards, text).map((c) => ({ name: c.name.slice(0, 100), value: c.codex_id })));
}

/** /card: the option is a codex id when the person picked a suggestion,
 * and free text when they pressed enter on what they typed. */
export async function card(interaction: Interaction, s: Services): Promise<Response> {
  const text = optionValue(interaction, "name") ?? "";
  const { cards, sets } = await s.registry.current();
  const asId = parseId(text);
  const codexId = asId?.kind === "card" ? asId.id : resolveName(cards, text)?.codex_id;
  if (!codexId) return whisper(`No card named “${text.trim()}” in the archive.`);
  const found = await s.registry.card(codexId);
  if (!found) return whisper(`No card ${codexId} in the archive.`);
  return message(cardEmbed(found, sets, s.emojis));
}

export async function byId(interaction: Interaction, s: Services): Promise<Response> {
  const text = optionValue(interaction, "id") ?? "";
  const parsed = parseId(text);
  if (!parsed) return whisper(`“${text.trim()}” is not a Kairos id. Cards are C followed by six digits (C000230); printings are P (P000937).`);
  const { sets } = await s.registry.current();
  if (parsed.kind === "card") {
    const found = await s.registry.card(parsed.id);
    return found ? message(cardEmbed(found, sets, s.emojis)) : whisper(`No card ${parsed.id} in the archive.`);
  }
  const printing = await s.registry.printing(parsed.id);
  if (!printing) return whisper(`No printing ${parsed.id} in the archive.`);
  const owner = await s.registry.card(printing.codex_id);
  if (!owner) return whisper(`Printing ${parsed.id} names a card the archive does not serve.`);
  return message(printingEmbed(printing, owner, s.emojis));
}

export async function random(_interaction: Interaction, s: Services): Promise<Response> {
  const { cards, sets } = await s.registry.current();
  const pick = cards[Math.floor(s.random() * cards.length)];
  if (!pick) return whisper("The archive is empty, which should not happen.");
  const found = await s.registry.card(pick.codex_id);
  return found ? message(cardEmbed(found, sets, s.emojis)) : whisper(`No card ${pick.codex_id} in the archive.`);
}

export function search(interaction: Interaction, s: Services): Response {
  const query = (optionValue(interaction, "query") ?? "").trim();
  if (!query) return whisper("Give me something to search for.");
  return message(searchEmbed(query, s.siteBase));
}
