/** The Worker's logic. Discord POSTs every interaction here, signed; the handler
 * verifies the signature over the raw body, answers the ping Discord
 * sends when the URL is saved, and routes commands and autocomplete to
 * handlers.ts. Every reply goes back in this same response, within
 * Discord's three seconds: a card is one cached fetch, so there is no
 * deferred reply to manage.
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

export async function handle(request: Request, env: Env, deps: { registry: Registry; random?: () => number; fetchImpl?: Fetch } = { registry: registryFor(env) }, ctx?: ExecutionContext): Promise<Response> {
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
  if (!res) res = await answer(interaction!, env, deps);
  // The count is written after the reply leaves; in tests, before it returns.
  const pending = record(env.STATS, interaction, res.clone(), started, env.STATS_SALT);
  if (ctx) ctx.waitUntil(pending); else await pending;
  return res;
}

async function answer(interaction: Interaction, env: Env, deps: { registry: Registry; random?: () => number; fetchImpl?: Fetch }): Promise<Response> {
  if (interaction.type === InteractionType.PING) return json({ type: ResponseType.PONG });

  const services: Services = {
    registry: deps.registry,
    emojis: await applicationEmojis(env.DISCORD_APPLICATION_ID, env.DISCORD_BOT_TOKEN),
    siteBase: env.SITE_BASE_URL ?? DEFAULT_SITE,
    apiBase: env.QUERY_BASE_URL ?? DEFAULT_QUERY,
    random: deps.random ?? Math.random,
    fetchImpl: deps.fetchImpl ?? (env.QUERY ? (u: string, i?: RequestInit) => env.QUERY!.fetch(u, i) : undefined),
  };
  const name = interaction.data?.name ?? "";
  try {
    if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      if (name === "card" || name === "history") return await autocomplete(interaction, services);
      if (name === "set") return await setAutocomplete(interaction, services);
      return json({ type: ResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: [] } });
    }
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

