#!/usr/bin/env node
/** Push the commands in src/commands.ts (slash commands and the message
 * menu entry) to Discord, and upload the
 * four threshold symbols as application emojis. Run it after every change
 * to commands.ts; Discord serves its registered copy, not the repo.
 *
 *   DISCORD_APPLICATION_ID=… DISCORD_BOT_TOKEN=… npm run register
 *
 * Set DISCORD_GUILD_ID to register to one server only, which takes
 * effect at once; global registration can take up to an hour to show.
 * Needs Node 22.18 or newer, which strips the types in commands.ts. */
import { readFile } from "node:fs/promises";
import { commands } from "../src/commands.ts";

const appId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_BOT_TOKEN;
const guild = process.env.DISCORD_GUILD_ID;
if (!appId || !token) {
  console.error("Set DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN in the environment.");
  process.exit(2);
}

const API = "https://discord.com/api/v10";
const headers = { authorization: `Bot ${token}`, "content-type": "application/json", "user-agent": "kairos-bot register (+https://kairosarchive.net)" };

async function call(method, path, body) {
  const init = body === undefined ? { method, headers } : { method, headers, body: JSON.stringify(body) };
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// Commands: PUT replaces the whole set, so a command removed from the
// file disappears from Discord too.
const target = guild ? `/applications/${appId}/guilds/${guild}/commands` : `/applications/${appId}/commands`;
const registered = await call("PUT", target, commands);
console.log(`${registered.length} command(s) registered ${guild ? `in guild ${guild}` : "globally"}: ${registered.map((c) => (c.type === 3 ? `“${c.name}” (message menu)` : `/${c.name}`)).join(" ")}`);

// Emojis: create the ones missing, leave the rest alone.
const existing = (await call("GET", `/applications/${appId}/emojis`)).items.map((e) => e.name);
for (const element of ["air", "earth", "fire", "water"]) {
  const name = `thr_${element}`;
  if (existing.includes(name)) { console.log(`emoji ${name}: already there`); continue; }
  const png = await readFile(new URL(`../assets/emoji/${element}.png`, import.meta.url));
  const created = await call("POST", `/applications/${appId}/emojis`, { name, image: `data:image/png;base64,${png.toString("base64")}` });
  console.log(`emoji ${name}: created as ${created.id}`);
}
