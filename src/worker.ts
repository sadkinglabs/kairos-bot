/** The Worker's logic. Discord POSTs every interaction here, signed; the handler
 * verifies the signature over the raw body, answers the ping Discord
 * sends when the URL is saved, and routes commands and autocomplete to
 * handlers.ts. Every reply goes back in this same response, within
 * Discord's three seconds: a card is one cached fetch, so there is no
 * deferred reply to manage.
 *
 * Secrets (wrangler secret put): DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN.
 * Vars (wrangler.toml): DISCORD_APPLICATION_ID, REGISTRY_BASE_URL,
 * QUERY_BASE_URL, SITE_BASE_URL.
 *
 * index.ts is the entry module and exports only the default handler:
 * the runtime rejects any other export from an entry module, which is
 * why the helpers and constants live here. */
import { InteractionType, ResponseType, json, whisper, type Interaction } from "./discord";
import { applicationEmojis } from "./emoji";
import { autocomplete, byId, card, random, search, type Services } from "./handlers";
import { Registry, type Fetch } from "./registry";
import { verifySignature } from "./verify";

export interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  DISCORD_BOT_TOKEN?: string;
  REGISTRY_BASE_URL?: string;
  /** The query API (the search syntax as JSON), on its own hostname. */
  QUERY_BASE_URL?: string;
  SITE_BASE_URL?: string;
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

export async function handle(request: Request, env: Env, deps: { registry: Registry; random?: () => number; fetchImpl?: Fetch } = { registry: registryFor(env) }): Promise<Response> {
  if (request.method === "GET") {
    return new Response(`Kairos Archive's Discord bot. Cards for Sorcery: Contested Realm, from ${env.SITE_BASE_URL ?? DEFAULT_SITE}.\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

  const body = await request.text();
  const ok = await verifySignature(env.DISCORD_PUBLIC_KEY, request.headers.get("x-signature-ed25519"), request.headers.get("x-signature-timestamp"), body);
  if (!ok) return new Response("invalid request signature", { status: 401 });

  let interaction: Interaction;
  try {
    interaction = JSON.parse(body) as Interaction;
  } catch {
    return new Response("bad json", { status: 400 });
  }
  if (interaction.type === InteractionType.PING) return json({ type: ResponseType.PONG });

  const services: Services = {
    registry: deps.registry,
    emojis: await applicationEmojis(env.DISCORD_APPLICATION_ID, env.DISCORD_BOT_TOKEN),
    siteBase: env.SITE_BASE_URL ?? DEFAULT_SITE,
    apiBase: env.QUERY_BASE_URL ?? DEFAULT_QUERY,
    random: deps.random ?? Math.random,
    fetchImpl: deps.fetchImpl,
  };
  const name = interaction.data?.name ?? "";
  try {
    if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      return name === "card" ? await autocomplete(interaction, services) : json({ type: ResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: [] } });
    }
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      switch (name) {
        case "card": return await card(interaction, services);
        case "id": return await byId(interaction, services);
        case "random": return await random(interaction, services);
        case "search": return await search(interaction, services);
        default: return whisper(`I do not know a /${name} command. Try /card, /id, /random or /search.`);
      }
    }
    return json({ error: "unsupported interaction type" }, 400);
  } catch (err) {
    console.error(err);
    return whisper("The archive did not answer in time. Try again in a moment.");
  }
}

