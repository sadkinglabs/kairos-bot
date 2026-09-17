/** The Worker's logic. Discord POSTs every interaction here, signed; the handler
 * verifies the signature over the raw body, answers the ping Discord
 * sends when the URL is saved, and routes commands and autocomplete to
 * handlers.ts. Discord wants the first response within three seconds.
 * Most answers are one or two cached fetches and go back in this same
 * response; when the work is still running at DEADLINE_MS (a cold
 * isolate resolving the release and parsing the index, a slow origin),
 * the bot acknowledges with a deferred response and finishes the work
 * after the response has left, editing the reply through the
 * interaction's webhook (followUp). Autocomplete is never deferred: a
 * late autocomplete is answered with no choices. The emoji lookup is
 * cosmetic and is given a short wait of its own.
 *
 * Secrets (wrangler secret put): DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN,
 * STATS_SALT. Vars (wrangler.toml): DISCORD_APPLICATION_ID,
 * REGISTRY_BASE_URL, QUERY_BASE_URL, SITE_BASE_URL. Every interaction
 * leaves one data point in Analytics Engine (stats.ts) after the reply.
 *
 * index.ts is the entry module and exports only the default handler:
 * the runtime rejects any other export from an entry module, which is
 * why the helpers and constants live here. */
import { InteractionType, ResponseType, json, whisper, type Interaction } from "./discord";
import { applicationEmojis } from "./emoji";
import { autocomplete, byId, card, component, findCards, history, random, search, set, setAutocomplete, syntax, type Services } from "./handlers";
import { Registry, type Fetch } from "./registry";
import { record } from "./stats";
import { verifySignature } from "./verify";

/** How long the bot works on an answer before acknowledging instead.
 * Discord allows 3,000 ms end to end; this leaves room for the network. */
export const DEADLINE_MS = 2200;
/** How long an answer waits for the emoji lookup before going without. */
export const EMOJI_WAIT_MS = 300;
export const DISCORD_API = "https://discord.com/api/v10";

export interface Deps {
  registry: Registry;
  random?: () => number;
  /** Reaches the query API (the service binding in production). */
  fetchImpl?: Fetch;
  /** Reaches Discord's own API (emojis, the interaction webhook). */
  discordFetch?: Fetch;
  deadlineMs?: number;
  emojiWaitMs?: number;
  /** Where deferred work goes when there is no ExecutionContext (tests). */
  background?: (work: Promise<unknown>) => void;
}

export interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  DISCORD_BOT_TOKEN?: string;
  REGISTRY_BASE_URL?: string;
  /** The query API (the search syntax as JSON), on its own hostname. */
  QUERY_BASE_URL?: string;
  /** The query API as a service binding, when deployed with one. */
  QUERY?: Fetcher;
  SITE_BASE_URL?: string;
  /** Usage counts (wrangler.toml [[analytics_engine_datasets]]); absent in tests that do not set one. */
  STATS?: AnalyticsEngineDataset;
  /** Keys the server-id hash in the counts; without it no server hash is written. */
  STATS_SALT?: string;
}

export const DEFAULT_REGISTRY = "https://api.kairosarchive.net";
export const DEFAULT_SITE = "https://kairosarchive.net";
export const DEFAULT_QUERY = "https://query.kairosarchive.net";

/** One registry client per isolate, so the name index is parsed once. */
let registry: Registry | null = null;
function registryFor(env: Env): Registry {
  const base = env.REGISTRY_BASE_URL ?? DEFAULT_REGISTRY;
  if (!registry || registry.baseUrl !== base) registry = new Registry(base);
  return registry;
}

export async function handle(request: Request, env: Env, deps: Deps = { registry: registryFor(env) }, ctx?: ExecutionContext): Promise<Response> {
  const started = Date.now();
  if (request.method === "GET") {
    return new Response(`Kairos Archive's Discord bot. Cards for Sorcery: Contested Realm, from ${env.SITE_BASE_URL ?? DEFAULT_SITE}.\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

  const body = await request.text();
  const ok = await verifySignature(env.DISCORD_PUBLIC_KEY, request.headers.get("x-signature-ed25519"), request.headers.get("x-signature-timestamp"), body);
  let interaction: Interaction | null = null;
  let res: Response | null = null;
  if (!ok) res = new Response("invalid request signature", { status: 401 });
  else {
    try {
      interaction = JSON.parse(body) as Interaction;
    } catch {
      res = new Response("bad json", { status: 400 });
    }
  }
  const spawn = (work: Promise<unknown>) => { if (ctx) ctx.waitUntil(work); else if (deps.background) deps.background(work); };
  if (!res) res = await answer(interaction!, env, deps, started, spawn);
  // The count is written after the reply leaves; in tests, before it returns.
  const pending = record(env.STATS, interaction, res.clone(), started, env.STATS_SALT);
  if (ctx) ctx.waitUntil(pending); else await pending;
  return res;
}

const LATE = Symbol("late");

/** `work`, or `LATE` once `ms` have passed. The timer is cleared either way. */
function within<T>(work: Promise<T>, ms: number): Promise<T | typeof LATE> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const late = new Promise<typeof LATE>((resolve) => { timer = setTimeout(() => resolve(LATE), Math.max(0, ms)); });
  return Promise.race([work, late]).finally(() => { if (timer !== null) clearTimeout(timer); });
}

const emptyChoices = () => json({ type: ResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: [] } });

async function answer(interaction: Interaction, env: Env, deps: Deps, started: number, spawn: (work: Promise<unknown>) => void): Promise<Response> {
  if (interaction.type === InteractionType.PING) return json({ type: ResponseType.PONG });
  const discordFetch: Fetch = deps.discordFetch ?? ((u, i) => fetch(u, i));
  const deadline = deps.deadlineMs ?? DEADLINE_MS;
  const remaining = () => deadline - (Date.now() - started);

  // The emoji lookup is decoration: wait a little, then answer in words.
  // The lookup itself carries on and is cached for the next request.
  const emojis = await within(applicationEmojis(env.DISCORD_APPLICATION_ID, env.DISCORD_BOT_TOKEN, discordFetch), Math.min(deps.emojiWaitMs ?? EMOJI_WAIT_MS, remaining()));
  const services: Services = {
    registry: deps.registry,
    emojis: emojis === LATE ? new Map() : emojis,
    siteBase: env.SITE_BASE_URL ?? DEFAULT_SITE,
    apiBase: env.QUERY_BASE_URL ?? DEFAULT_QUERY,
    random: deps.random ?? Math.random,
    fetchImpl: deps.fetchImpl ?? (env.QUERY ? (u: string, i?: RequestInit) => env.QUERY!.fetch(u, i) : undefined),
  };
  const name = interaction.data?.name ?? "";

  if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
    // Discord wants choices now or not at all: a late index means no choices this keystroke.
    const list = name === "card" || name === "history" ? autocomplete(interaction, services)
      : name === "set" ? setAutocomplete(interaction, services) : Promise.resolve(emptyChoices());
    const res = await within(list.catch((err: unknown) => { console.error(err); return emptyChoices(); }), remaining());
    return res === LATE ? emptyChoices() : res;
  }

  const work = route(interaction, name, services);
  const res = await within(work, remaining());
  if (res !== LATE) return res;
  // Still working at the deadline: acknowledge now, edit the reply when done.
  if (!interaction.token) return whisper("The archive did not answer in time. Try again in a moment.");
  spawn(followUp(work, interaction.token, env.DISCORD_APPLICATION_ID, discordFetch));
  const isClick = interaction.type === InteractionType.MESSAGE_COMPONENT;
  return json({ type: isClick ? ResponseType.DEFERRED_UPDATE_MESSAGE : ResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
}

/** The command or click itself. Never rejects: a failure is a whisper. */
async function route(interaction: Interaction, name: string, services: Services): Promise<Response> {
  try {
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      switch (name) {
        case "card": return await card(interaction, services);
        case "id": return await byId(interaction, services);
        case "random": return await random(interaction, services);
        case "search": return await search(interaction, services);
        case "syntax": return syntax(interaction, services);
        case "history": return await history(interaction, services);
        case "set": return await set(interaction, services);
        case "Find cards": return await findCards(interaction, services);
        default: return whisper(`I do not know a /${name} command. Try /card, /id, /random, /search, /syntax, /history or /set.`);
      }
    }
    if (interaction.type === InteractionType.MESSAGE_COMPONENT) return await component(interaction, services);
    return json({ error: "unsupported interaction type" }, 400);
  } catch (err) {
    console.error(err);
    return whisper("The archive did not answer in time. Try again in a moment.");
  }
}

/** After a deferred response: turn the finished answer into an edit of
 * the reply Discord is holding. A whisper becomes the reply's text (the
 * deferred message is visible; that is the cost of answering late). A
 * failure anywhere becomes an apology in the reply, and a failure of
 * the edit itself is logged, never thrown. */
export async function followUp(work: Promise<Response>, token: string, applicationId: string, discordFetch: Fetch): Promise<void> {
  let data: unknown;
  try {
    const body = (await (await work).json()) as { type?: number; data?: Record<string, unknown> };
    data = body.data ?? { content: "The archive did not answer in time. Try again in a moment." };
  } catch (err) {
    console.error("followUp", err);
    data = { content: "The archive did not answer in time. Try again in a moment." };
  }
  try {
    const res = await discordFetch(`${DISCORD_API}/webhooks/${applicationId}/${token}/messages/@original`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) console.error("followUp", `HTTP ${res.status}`, await res.text().catch(() => ""));
  } catch (err) {
    console.error("followUp", err);
  }
}
