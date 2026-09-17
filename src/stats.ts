/** One data point per interaction into Workers Analytics Engine, so the
 * archive can see what the bot is used for without keeping anything
 * about who used it. Written after the reply is sent (waitUntil), so it
 * never slows an answer.
 *
 * What a point carries, and what it does not: the kind of interaction
 * and the command or control it named; how it ended (a message in the
 * channel, a whisper to the caller, an in-place update, autocomplete
 * choices, a rejected or failed request); whether it came from a server
 * or an account install; the server as a salted hash, so distinct
 * servers can be counted but no server id is stored; the client's
 * locale; the text that missed, only when the answer was "no such
 * card", since that is the one input that teaches anything; the time
 * taken and the HTTP status. No user id, no address, no message text. */
import type { Interaction } from "./discord";

export type Kind = "ping" | "command" | "menu" | "component" | "autocomplete" | "unknown";
export type Outcome = "pong" | "message" | "whisper" | "update" | "choices" | "deferred" | "rejected" | "bad" | "error";
export type Context = "server" | "user" | "unknown";

export interface BotEvent {
  kind: Kind; name: string; outcome: Outcome; context: Context; guild: string; locale: string; miss: string;
  ms: number; status: number;
}

/** The order of the blobs in a data point, for the reader's SQL. */
export const BLOBS = ["kind", "name", "outcome", "context", "guild", "locale", "miss"] as const;
/** The order of the doubles. */
export const DOUBLES = ["ms", "status"] as const;

/** What the interaction was, from its shape. A component's name is the
 * custom_id up to its first colon ("pick", "page"). */
export function classify(interaction: Interaction | null): Pick<BotEvent, "kind" | "name" | "context" | "locale"> & { guildId: string } {
  if (!interaction) return { kind: "unknown", name: "", context: "unknown", locale: "", guildId: "" };
  const data = interaction.data ?? {};
  const kind: Kind = interaction.type === 1 ? "ping"
    : interaction.type === 2 ? (data.type === 3 ? "menu" : "command")
    : interaction.type === 3 ? "component"
    : interaction.type === 4 ? "autocomplete" : "unknown";
  const name = kind === "component" ? (data.custom_id ?? "").split(":")[0]! : (data.name ?? "");
  const owners = interaction.authorizing_integration_owners ?? {};
  const context: Context = "0" in owners || interaction.guild_id ? "server"
    : "1" in owners || interaction.context === 1 || interaction.context === 2 ? "user" : "unknown";
  return { kind, name: name.slice(0, 40), context, locale: (interaction.locale ?? "").slice(0, 16), guildId: interaction.guild_id ?? "" };
}

/** A server's id as a keyed hash: the same server always hashes the same,
 * so distinct servers can be counted, and nothing stored leads back to
 * the id. Without a salt no hash is written at all. */
export async function guildHash(guildId: string, salt: string | undefined): Promise<string> {
  if (!guildId || !salt) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(guildId)));
  return Array.from(mac.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

const MISS = /(?:No card named|No set named|Nothing matches|No printing|No card) “([^”]{1,80})”/;

/** How the reply ended, read from the response the bot is about to send. */
export async function outcomeOf(res: Response): Promise<{ outcome: Outcome; miss: string }> {
  if (res.status === 401) return { outcome: "rejected", miss: "" };
  if (res.status >= 400) return { outcome: "bad", miss: "" };
  try {
    const body = (await res.json()) as { type?: number; data?: { flags?: number; content?: string } };
    if (body.type === 1) return { outcome: "pong", miss: "" };
    if (body.type === 8) return { outcome: "choices", miss: "" };
    if (body.type === 7) return { outcome: "update", miss: "" };
    if (body.type === 5 || body.type === 6) return { outcome: "deferred", miss: "" };
    if (body.type === 4) {
      if ((body.data?.flags ?? 0) & 64) return { outcome: "whisper", miss: MISS.exec(body.data?.content ?? "")?.[1] ?? "" };
      return { outcome: "message", miss: "" };
    }
  } catch { /* not JSON: an error body */ }
  return { outcome: "error", miss: "" };
}

/** Build and write the point. `copy` is a clone of the response, taken
 * before it was returned. Never throws: a failed write is not the
 * caller's problem. */
export async function record(stats: AnalyticsEngineDataset | undefined, interaction: Interaction | null, copy: Response, started: number, salt: string | undefined): Promise<BotEvent | null> {
  try {
    const { kind, name, context, locale, guildId } = classify(interaction);
    const [{ outcome, miss }, guild] = await Promise.all([outcomeOf(copy), guildHash(guildId, salt)]);
    const event: BotEvent = { kind, name, outcome, context, guild, locale, miss, ms: Math.max(0, Date.now() - started), status: copy.status };
    stats?.writeDataPoint({ indexes: [kind], blobs: BLOBS.map((k) => event[k]), doubles: DOUBLES.map((k) => event[k]) });
    return event;
  } catch (err) {
    console.error("stats", err);
    return null;
  }
}
