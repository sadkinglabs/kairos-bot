# kairos-bot

Kairos Archive's Discord bot for *Sorcery: Contested Realm*. Slash commands that show a card, a printing, a random card, or link a search, served from [api.kairosarchive.net](https://kairosarchive.net/docs) on a Cloudflare Worker.

| Command | What it does |
|---|---|
| `/card name` | A card with its default printing's art. Start typing for name suggestions; pressing enter on free text takes the best match. |
| `/id C000230` or `/id P000937` | A card by codex id, or one physical printing by printing id, with that printing's own art, set, product, finish, artist and flavour text. |
| `/random` | A random card. |
| `/search query` | A link to the site's search for a query in its [search syntax](https://kairosarchive.net/syntax). |

Every embed carries the type line, mana, threshold, power (attack and defense when they differ), life, the sets, the card's codex id and printing id, the rules text, and the publisher credit. Thresholds are drawn with the game's element symbols once the register script has uploaded them as application emojis; without them they read as words ("1 Fire").

## How it works

Discord does not need a running process for slash commands. It signs each interaction with the application's Ed25519 key and POSTs it to a URL, and the reply goes back in the same response within three seconds. The Worker verifies the signature with WebCrypto (`src/verify.ts`), answers Discord's ping, and routes the command (`src/worker.ts`, `src/handlers.ts`).

Cards come from the registry's published objects, never from a copy in this repo. Each isolate reads `versions.json` once, resolves the newest verified `v3` release, and keeps that release's `index/cards.json` in memory for name matching (`src/registry.ts`). A command then fetches one object, `cards/C000927.json` or `printings/P002719.json`, from the immutable release root, where every byte is cacheable at the edge for a year. The index is re-resolved every ten minutes, so a new registry release reaches the bot without a deploy.

Files:

```
src/index.ts       the entry module: only the default export, as the runtime requires
src/worker.ts      verify, ping, route; the Env the Worker reads
src/handlers.ts    one function per command, plus autocomplete
src/embed.ts       the embed wording, colours and links
src/registry.ts    versions.json → release root → index and objects, cached per isolate
src/names.ts       name matching and id parsing
src/emoji.ts       application emoji lookup for the threshold symbols
src/discord.ts     the slice of Discord's protocol the bot speaks
src/commands.ts    the slash commands, as data
scripts/register.mjs   pushes commands.ts to Discord and uploads the emojis
assets/emoji/      the four element symbols
```

## Setting it up

You need a Discord application and a Cloudflare account with the `kairosarchive.net` zone. Secrets go into Cloudflare's encrypted store or your shell, never into this repository.

1. **Create the application** at [discord.com/developers/applications](https://discord.com/developers/applications). On *General Information* note the **Application ID** and the **Public Key**. On *Bot*, reset the token and note the **Bot Token** (shown once).

2. **Configure the Worker.** In `wrangler.toml` set `DISCORD_APPLICATION_ID` to the application id. The route is `bot.kairosarchive.net`; deploying creates the DNS record.

3. **Deploy.** From GitHub, with no shell: add four repository secrets under *Settings → Secrets and variables → Actions*: `CLOUDFLARE_API_TOKEN` (a token from the Cloudflare dashboard's "Edit Cloudflare Workers" template), `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_PUBLIC_KEY` and `DISCORD_BOT_TOKEN`. Then run the **deploy** workflow from the Actions tab; it also runs on every push to `main`. The workflow deploys, pushes the two Discord values into the Worker's secret store, and checks the live URL.

   Or from a laptop:

   ```sh
   npm ci
   npx wrangler login
   npx wrangler secret put DISCORD_PUBLIC_KEY
   npx wrangler secret put DISCORD_BOT_TOKEN
   npm run deploy
   ```

   or connect the repo to **Workers Builds** in the Cloudflare dashboard (Workers & Pages → Create → connect a repository), which deploys every push to `main`; then add the two secrets under the Worker's *Settings → Variables and Secrets*.

4. **Register the commands and emojis.** From GitHub: run the **register** workflow from the Actions tab, with your test server's id in the box for an instant guild-scoped registration, or empty for global. Or from a shell:

   ```sh
   DISCORD_APPLICATION_ID=… DISCORD_BOT_TOKEN=… npm run register
   ```

   Add `DISCORD_GUILD_ID=…` to register to one server first; that shows at once, while global registration can take up to an hour. Run it again after any change to `src/commands.ts`. Needs Node 22.18 or newer.

5. **Point Discord at the Worker.** On *General Information*, set **Interactions Endpoint URL** to `https://bot.kairosarchive.net/` and save. Discord checks the URL by sending a ping and a deliberately bad signature; a Worker that is deployed with the right public key passes.

6. **Invite the bot.** On *OAuth2 → URL Generator*, tick the `applications.commands` scope (add `bot` only if the bot should ever post unprompted), open the generated URL, and pick a server.

## Developing

```sh
npm ci
npm test            # unit tests, including the Worker end to end against a fake registry
npm run lint        # oxlint: parses TypeScript itself, so the linter never pins the compiler
npm run typecheck   # tsc from TypeScript 7
npm run bundle      # a dry-run deploy: what would be uploaded, in dist/
npm run dev         # the Worker in the local runtime on http://127.0.0.1:8787
```

For `npm run dev`, put a `DISCORD_PUBLIC_KEY` in `.dev.vars` (ignored by git). Interactions must be signed, so the quickest local check is a GET, which returns a line of text, and an unsigned POST, which returns 401 as Discord expects.

## Limits worth knowing

On the free Workers plan: 100,000 requests a day and 10 ms of CPU per request. A cold isolate spends a few milliseconds parsing the card index once; each command after that is a cached fetch and a small string build. Discord shows about the first 350 characters of an embed description before folding it, and the bot caps descriptions at 2,000.

## Credit and terms

Identifiers, structure and this code are Kairos Archive's, free for any use. Card names, text and images are © Erik's Curiosa, shown with credit for archive, identification and site function, per the publisher's guidance. See [kairosarchive.net/usage](https://kairosarchive.net/usage).
