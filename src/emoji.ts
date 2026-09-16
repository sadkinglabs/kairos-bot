/** Threshold icons in the embed text. Discord lets an application own
 * emojis usable in any server the bot is in, so the register script
 * uploads the four element symbols once and the bot looks them up by
 * name with the bot token. One lookup per isolate; without a token, or
 * if the lookup fails, the thresholds read as words ("1 Fire"). */
import type { Fetch } from "./registry";

export const EMOJI_NAMES: Record<string, string> = { Air: "thr_air", Earth: "thr_earth", Fire: "thr_fire", Water: "thr_water" };

export type EmojiMap = Map<string, string>;

const cache = new Map<string, Promise<EmojiMap>>();

export function applicationEmojis(applicationId: string, botToken: string | undefined, fetchImpl: Fetch = (u, i) => fetch(u, i)): Promise<EmojiMap> {
  if (!botToken) return Promise.resolve(new Map());
  let found = cache.get(applicationId);
  if (!found) {
    found = lookup(applicationId, botToken, fetchImpl).catch(() => {
      cache.delete(applicationId);
      return new Map<string, string>();
    });
    cache.set(applicationId, found);
  }
  return found;
}

async function lookup(applicationId: string, botToken: string, fetchImpl: Fetch): Promise<EmojiMap> {
  const res = await fetchImpl(`https://discord.com/api/v10/applications/${applicationId}/emojis`, { headers: { authorization: `Bot ${botToken}` } });
  if (!res.ok) throw new Error(`emoji lookup: HTTP ${res.status}`);
  const body = (await res.json()) as { items: { id: string; name: string }[] };
  const map: EmojiMap = new Map();
  for (const [element, name] of Object.entries(EMOJI_NAMES)) {
    const item = body.items.find((e) => e.name === name);
    if (item) map.set(element, `<:${name}:${item.id}>`);
  }
  return map;
}
