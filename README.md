# kairos-bot

Kairos Archive's Discord bot for *Sorcery: Contested Realm*. Slash commands that show a card, a printing, a set, a card's history, a random card or a search, and a right-click menu entry that finds the cards a message names, served from [api.kairosarchive.net](https://kairosarchive.net/docs) on a Cloudflare Worker.

| Command | What it does |
|---|---|
| `/card name` | A card with its default printing's art. Start typing for name suggestions; pressing enter on free text takes the best match. |
| `/id C000230` or `/id P000937` | A card by codex id, or one physical printing by printing id, with that printing's own art, set, product, finish, artist and flavour text. |
| `/random` | A random card; with a query, a random card from its matches (`/random t:site`, `/random e:fire cost<=2`, `/random s:gothic is:foil`). A query that names a printing shows that printing. |
| `/search query` | The first five matches for a query in the [search syntax](https://kairosarchive.net/syntax), each with its art, and the way to the rest. Answered by the query API on query.kairosarchive.net. |
| `/syntax` | The search syntax on one screen, shown to you alone. |
| `/history name` | Every face the card has had, oldest first, each change against the one before (mana, stats, thresholds, rules text), and any earlier names. Dates are when the registry recorded a face. |
| `/set name` | A set by name or code: release date, how many cards and printings, some of its cards, and a search for all of them. |
| **Find cards** (right-click a message → Apps) | Every `[[card name]]` in the message, up to five, as small embeds with their art; one card comes in full. A message with no brackets is tried as one name. |

A card message carries a **printing picker** when the card has more than one printing: choose one and the message becomes that printing, with its own art, artist and flavour text. Search results carry **Next 5** and **Previous** buttons that turn the page in place. Both are message components: Discord sends the click to the same URL as a command, and the bot answers with a replacement message.

Every card embed carries the type line, mana, threshold, power (attack and defense when they differ), life, the sets, which printing is shown in words ("Shown: Gothic · Booster · Standard, art by Dan Seagrave"), the card's codex id and printing id, the rules text, and the publisher credit. Thresholds are drawn with the game's element symbols once the register script has uploaded them as application emojis; without them they read as words ("1 Fire").

## How it works

Discord does not need a running process for slash commands. It signs each interaction with the application's Ed25519 key and POSTs it to a URL, and the reply goes back in the same response within three seconds. The Worker verifies the signature with WebCrypto (`src/verify.ts`), answers Discord's ping, and routes the command (`src/worker.ts`, `src/handlers.ts`).

Cards come from the registry's published objects, never from a copy in this repo. Each isolate reads `versions.json` once, resolves the newest verified `v3` release, and keeps that release's `index/cards.json` in memory for name matching (`src/registry.ts`). A command then fetches one object, `cards/C000927.json` or `printings/P002719.json`, from the immutable release root, where every byte is cacheable at the edge for a year. The index is re-resolved every ten minutes, so a new registry release reaches the bot without a deploy.

Files:

```
src/index.ts       the entry module: only the default export, as the runtime requires
src/worker.ts      verify, ping, route; the Env the Worker reads
src/handlers.ts    one function per command and menu entry, the component clicks, and autocomplete
src/embed.ts       the embed wording, colours and links
src/registry.ts    versions.json → release root → index and objects, cached per isolate
src/names.ts       name matching and id parsing
src/emoji.ts       application emoji lookup for the threshold symbols
src/discord.ts     the slice of Discord's protocol the bot speaks
src/commands.ts    the slash commands and the message-menu entry, as data
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

4. **Invite the bot** to a server first. The install link on *Installation* in the Developer Portal is enough (`https://discord.com/oauth2/authorize?client_id=<application id>`; Kairos Archive's is on [kairosarchive.net/discord](https://kairosarchive.net/discord)); it offers a server or an account install according to the contexts set there. Add the `bot` scope only if the bot should ever post unprompted. A guild-scoped registration in the next step needs the application to be in that server already; Discord answers `403 Missing Access` otherwise.

5. **Register the commands and emojis.** From GitHub: run the **register** workflow from the Actions tab, with that server's id in the box for an instant guild-scoped registration, or empty for global (shows everywhere the bot is, up to an hour later). Or from a shell:

   ```sh
   DISCORD_APPLICATION_ID=… DISCORD_BOT_TOKEN=… npm run register
   ```

   Add `DISCORD_GUILD_ID=…` to register to one server first; that shows at once, while global registration can take up to an hour. Run it again after any change to `src/commands.ts`. Needs Node 22.18 or newer.

6. **Point Discord at the Worker.** On *General Information*, set **Interactions Endpoint URL** to `https://bot.kairosarchive.net/` and save. Discord checks the URL by sending a ping and a deliberately bad signature; a Worker that is deployed with the right public key passes.

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

## Usage counts

Every interaction leaves one data point in Workers Analytics Engine (`src/stats.ts`, dataset `kairos_bot`): the kind of interaction and the command or control it named, how it ended (a message, a whisper, an in-place update, autocomplete choices, a rejected or failed request), whether it came from a server or an account install, the server as a keyed hash, the caller's locale, the text that missed when the answer was "no such card", the time taken and the status. No user id, no address, no message text. The hash is an HMAC with the `STATS_SALT` secret; without the secret no server hash is written at all. The archive's stats dashboard (the site repository, `stats/`) reads the dataset; [kairosarchive.net/usage](https://kairosarchive.net/usage) says what is counted.

## Limits worth knowing

On the free Workers plan: 100,000 requests a day and 10 ms of CPU per request. A cold isolate spends a few milliseconds parsing the card index once; each command after that is a cached fetch and a small string build. Discord shows about the first 350 characters of an embed description before folding it, and the bot caps descriptions at 2,000.

## Credit and terms

Identifiers, structure and this code are Kairos Archive's, free for any use. Card names, text and images are © Erik's Curiosa, shown with credit for archive, identification and site function, per the publisher's guidance. See [kairosarchive.net/usage](https://kairosarchive.net/usage).
