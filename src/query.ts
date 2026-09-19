/** The query API on api.kairosarchive.net: the site's search syntax,
 * answered as JSON. The bot asks it for the first few matches of a
 * /search and shows them; when the API is not there (not deployed yet,
 * or down) the caller falls back to a link, so /search always answers. */
import type { Fetch } from "./registry";
import { USER_AGENT } from "./registry";

export interface QueryCard {
  codex_id: string; name: string; type: string | null; rarity: string | null; subtypes: string[]; elements: string[];
  cost: number | null; attack: number | null; defense: number | null; power: number | null; life: number | null;
  kairos_url: string;
  image_urls: Record<string, string> | null;
  /** The printing the match was judged on (full facts) or the default by id. */
  printing: { printing_id: string; set_name?: string; product?: string | null; finish?: string | null; artist?: string | null } | null;
  /** Why this card is a result, when the query asked about rules text:
   * the sentence that matched and where inside it. The API works the
   * ranges out with the matcher that judged the search, so the bot marks
   * them rather than matching the text again and disagreeing. */
  matched?: { text: string; ranges: [number, number][] } | null;
}
export interface QueryList {
  object: "list"; release: string; q: string; total: number; page: number; page_size: number; has_more: boolean;
  rules_text_total: number; data: QueryCard[];
}
export interface QueryError { object: "error"; status: number; code: string; details: string; warnings?: string[] }

export type QueryAnswer = { kind: "list"; list: QueryList } | { kind: "error"; error: QueryError } | { kind: "unavailable" };

/** Up to `limit` matches for `q`, from page `page` of them. "unavailable" for a network failure, a
 * non-JSON answer or a 404 on the route itself (the API is not there);
 * "error" for a JSON error the API chose to send (a bad query). */
export async function queryCards(apiBase: string, q: string, limit: number, fetchImpl: Fetch = (u, i) => fetch(u, i), page = 1): Promise<QueryAnswer> {
  const url = `${apiBase}/cards?q=${encodeURIComponent(q)}&page_size=${limit}${page > 1 ? `&page=${page}` : ""}`;
  try {
    const res = await fetchImpl(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (!res.headers.get("content-type")?.includes("json")) return { kind: "unavailable" };
    const body = (await res.json()) as QueryList | QueryError;
    if (body.object === "list") return { kind: "list", list: body };
    if (body.object === "error" && body.code !== "not_found") return { kind: "error", error: body };
    return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}

/** A card drawn at random from the matches of `q`: the ids the bot needs
 * to fetch the full records. "empty" when nothing matches. */
export type RandomAnswer = { kind: "card"; codex_id: string; printing_id: string | null } | { kind: "empty" } | { kind: "error"; error: QueryError } | { kind: "unavailable" };

export async function queryRandom(apiBase: string, q: string, fetchImpl: Fetch = (u, i) => fetch(u, i)): Promise<RandomAnswer> {
  const url = `${apiBase}/cards/random?q=${encodeURIComponent(q)}`;
  try {
    const res = await fetchImpl(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (!res.headers.get("content-type")?.includes("json")) return { kind: "unavailable" };
    const body = (await res.json()) as { object: "card"; codex_id: string; printing: { printing_id: string } | null } | QueryError;
    if (body.object === "card") return { kind: "card", codex_id: body.codex_id, printing_id: body.printing?.printing_id ?? null };
    if (body.object === "error" && body.code === "not_found" && res.status === 404 && body.details.startsWith("No card matches")) return { kind: "empty" };
    if (body.object === "error" && body.code !== "not_found") return { kind: "error", error: body };
    return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}
