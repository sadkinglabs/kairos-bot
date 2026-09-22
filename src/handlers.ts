/** One function per slash command, plus the autocomplete. Each takes the
 * parsed interaction and the services it needs and returns Discord's
 * response body, so the router in index.ts stays a switch. */
import { EPHEMERAL, choices, focusedValue, message, optionValue, targetMessage, update, whisper, type Interaction } from "./discord";
import { cardEmbed, foundEmbeds, historyEmbed, printingEmbed, resultsEmbed, searchEmbed, setEmbed, syntaxEmbed } from "./embed";
import { queryCards, queryRandom } from "./query";
import type { EmojiMap } from "./emoji";
import { bracketedNames, matchNames, matchSets, parseId, resolveName } from "./names";
import type { Card, Registry } from "./registry";

import type { Fetch } from "./registry";
/** apiBase is the query API's base (query.kairosarchive.net), not the registry's. */
export interface Services { registry: Registry; emojis: EmojiMap; siteBase: string; apiBase: string; random: () => number; fetchImpl?: Fetch }

export async function autocomplete(interaction: Interaction, s: Services): Promise<Response> {
  const { cards } = await s.registry.current();
  const text = focusedValue(interaction);
  return choices(matchNames(cards, text).map((c) => ({ name: c.name.slice(0, 100), value: c.codex_id })));
}

export async function setAutocomplete(interaction: Interaction, s: Services): Promise<Response> {
  const { setList } = await s.registry.current();
  return choices(matchSets(setList, focusedValue(interaction)).map((e) => ({ name: `${e.set_name} (${e.set_code})`.slice(0, 100), value: e.set_code })));
}

/** The card the `name` option means: a codex id when the person picked
 * a suggestion, free text when they pressed enter on what they typed. */
async function namedCard(text: string, s: Services): Promise<Card | { miss: string }> {
  const { cards } = await s.registry.current();
  const asId = parseId(text);
  const codexId = asId?.kind === "card" ? asId.id : resolveName(cards, text)?.codex_id;
  if (!codexId) return { miss: `No card named “${text.trim()}” in the archive.` };
  const found = await s.registry.card(codexId);
  return found ?? { miss: `No card ${codexId} in the archive.` };
}

export async function card(interaction: Interaction, s: Services): Promise<Response> {
  const found = await namedCard(optionValue(interaction, "name") ?? "", s);
  if ("miss" in found) return whisper(found.miss);
  const { sets } = await s.registry.current();
  return message(cardEmbed(found, sets, s.emojis, await shownPrinting(found, s)));
}

/** /history: the card's faces over time. */
export async function history(interaction: Interaction, s: Services): Promise<Response> {
  const found = await namedCard(optionValue(interaction, "name") ?? "", s);
  if ("miss" in found) return whisper(found.miss);
  return message(historyEmbed(found, s.emojis, s.siteBase));
}

/** /set: by code from a suggestion, or by whatever was typed. */
export async function set(interaction: Interaction, s: Services): Promise<Response> {
  const text = (optionValue(interaction, "set") ?? "").trim();
  const { setList } = await s.registry.current();
  const entry = matchSets(setList, text, 1)[0];
  if (!entry) return whisper(`No set named “${text}” in the archive.`);
  const object = await s.registry.set(entry.set_code);
  if (!object) return whisper(`No set ${entry.set_code} in the archive.`);
  const pick = object.cards[Math.floor(s.random() * object.cards.length)];
  const sample = pick ? await s.registry.card(pick.codex_id) : null;
  return message(setEmbed(entry, object, sample, s.siteBase));
}

/** "Find cards" on a message: every [[name]] in it, or the whole message
 * as one name when nobody wrote brackets. */
export async function findCards(interaction: Interaction, s: Services): Promise<Response> {
  const text = targetMessage(interaction);
  const names = bracketedNames(text);
  if (!names.length && text.trim() && text.trim().length <= 80) names.push(text.trim());
  if (!names.length) return whisper("Write card names in double brackets, like [[Polar Bears]], and try again.");
  const { cards, sets } = await s.registry.current();
  // Every card at once: the fetches are independent, and the deadline is shared.
  const looked = await Promise.all(names.map(async (name) => {
    const hit = resolveName(cards, name);
    return { name, full: hit ? await s.registry.card(hit.codex_id) : null };
  }));
  const found: { card: Card; shown: Awaited<ReturnType<typeof shownPrinting>> }[] = [];
  const misses: string[] = [];
  for (const { name, full } of looked) {
    if (full) found.push({ card: full, shown: found.length || names.length > 1 ? null : await shownPrinting(full, s) });
    else misses.push(name);
  }
  if (!found.length) return whisper(`No card named ${misses.map((m) => `“${m}”`).join(", ")} in the archive.`);
  return message(foundEmbeds(found, misses, sets, s.emojis));
}

/** A click on one of the bot's own components: the printing picker
 * under a card, or the page buttons under search results. The message
 * is replaced in place. */
export async function component(interaction: Interaction, s: Services): Promise<Response> {
  const id = interaction.data?.custom_id ?? "";
  const pick = /^pick:(C\d{6})$/.exec(id);
  if (pick) {
    const printingId = interaction.data?.values?.[0] ?? "";
    const [printing, owner, { sets }] = await Promise.all([s.registry.printing(printingId), s.registry.card(pick[1]!), s.registry.current()]);
    if (!printing || !owner || printing.codex_id !== owner.codex_id) return whisper(`No printing ${printingId} for ${pick[1]}.`);
    return update({ content: "", ...printingEmbed(printing, owner, s.emojis, sets) });
  }
  const page = /^page:(\d{1,4}):([\s\S]+)$/.exec(id);
  if (page) {
    const answer = await queryCards(s.apiBase, page[2]!, RESULTS_SHOWN, s.fetchImpl, Number(page[1]));
    if (answer.kind !== "list") return whisper("The query API did not answer. Use All results.");
    return update(resultsEmbed(answer.list, s.siteBase, s.apiBase));
  }
  return whisper("That control is from an older message; run the command again.");
}

/** The printing a card embed pictures: its default printing, so the
 * embed can say which physical print it is showing. */
async function shownPrinting(found: { default_printing_id: string | null }, s: Services) {
  return found.default_printing_id ? s.registry.printing(found.default_printing_id) : null;
}

export async function byId(interaction: Interaction, s: Services): Promise<Response> {
  const text = optionValue(interaction, "id") ?? "";
  const parsed = parseId(text);
  if (!parsed) return whisper(`“${text.trim()}” is not a Kairos id. Cards are C followed by six digits (C000230); printings are P (P000937).`);
  const { sets } = await s.registry.current();
  if (parsed.kind === "card") {
    const found = await s.registry.card(parsed.id);
    return found ? message(cardEmbed(found, sets, s.emojis, await shownPrinting(found, s))) : whisper(`No card ${parsed.id} in the archive.`);
  }
  const printing = await s.registry.printing(parsed.id);
  if (!printing) return whisper(`No printing ${parsed.id} in the archive.`);
  const owner = await s.registry.card(printing.codex_id);
  if (!owner) return whisper(`Printing ${parsed.id} names a card the archive does not serve.`);
  return message(printingEmbed(printing, owner, s.emojis, sets));
}

/** /random: a draw from the whole index, or, with a query, from its
 * matches via the query API. A query that bound a printing other than
 * the card's default shows that printing, so the filter is visible. */
export async function random(interaction: Interaction, s: Services): Promise<Response> {
  const { cards, sets } = await s.registry.current();
  const query = (optionValue(interaction, "query") ?? "").trim();
  if (query) {
    const answer = await queryRandom(s.apiBase, query, s.fetchImpl);
    if (answer.kind === "empty") return whisper(`Nothing matches “${query}”. Syntax: ${s.siteBase}/syntax`);
    if (answer.kind === "error") {
      const why = answer.error.warnings?.length ? answer.error.warnings.join("\n") : answer.error.details;
      return whisper(`I could not read that query.\n${why}\nSyntax: ${s.siteBase}/syntax`);
    }
    if (answer.kind === "unavailable") return whisper("The query API did not answer; try /random without a query, or again in a moment.");
    const found = await s.registry.card(answer.codex_id);
    if (!found) return whisper(`No card ${answer.codex_id} in the archive.`);
    const drawn = answer.printing_id && answer.printing_id !== found.default_printing_id ? await s.registry.printing(answer.printing_id) : null;
    if (drawn) return message(printingEmbed(drawn, found, s.emojis, sets));
    return message(cardEmbed(found, sets, s.emojis, await shownPrinting(found, s)));
  }
  const pick = cards[Math.floor(s.random() * cards.length)];
  if (!pick) return whisper("The archive is empty, which should not happen.");
  const found = await s.registry.card(pick.codex_id);
  return found ? message(cardEmbed(found, sets, s.emojis, await shownPrinting(found, s))) : whisper(`No card ${pick.codex_id} in the archive.`);
}

/** /syntax: the cheat sheet, to the caller alone. */
export function syntax(_interaction: Interaction, s: Services): Response {
  return message({ ...syntaxEmbed(s.siteBase), flags: EPHEMERAL });
}

/** /search: the query API's first matches, or the link to the site's
 * results when the API cannot be reached; a query the parser rejects
 * comes back as its own messages, to the caller only. */
export async function search(interaction: Interaction, s: Services): Promise<Response> {
  const query = (optionValue(interaction, "query") ?? "").trim();
  if (!query) return whisper("Give me something to search for.");
  const answer = await queryCards(s.apiBase, query, RESULTS_SHOWN, s.fetchImpl);
  if (answer.kind === "list") {
    if (answer.list.total === 0) return whisper(`Nothing matches “${query}”. Syntax: ${s.siteBase}/syntax`);
    return message(resultsEmbed(answer.list, s.siteBase, s.apiBase));
  }
  if (answer.kind === "error") {
    const why = answer.error.warnings?.length ? answer.error.warnings.join("\n") : answer.error.details;
    return whisper(`I could not read that query.\n${why}\nSyntax: ${s.siteBase}/syntax`);
  }
  return message(searchEmbed(query, s.siteBase));
}

/** How many matches a /search shows in the channel, one embed each. */
export const RESULTS_SHOWN = 5;
