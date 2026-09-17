/** The slash commands, as data. This file is the source of truth; Discord
 * keeps its own registered copy, which `npm run register` pushes. Edit
 * here without registering and Discord keeps serving the old shape.
 *
 * It imports nothing so the register script can load it directly under
 * Node's type stripping. Option type 3 is STRING. */

export const commands = [
  {
    name: "card",
    description: "Show a Sorcery card from Kairos Archive",
    options: [{ type: 3, name: "name", description: "Card name (start typing for suggestions)", required: true, autocomplete: true }],
  },
  {
    name: "id",
    description: "Show a card or printing by its Kairos id",
    options: [{ type: 3, name: "id", description: "A codex id like C000230 or a printing id like P000937", required: true }],
  },
  {
    name: "random",
    description: "Show a random Sorcery card",
  },
  {
    name: "search",
    description: "Search cards with the Kairos Archive syntax",
    options: [{ type: 3, name: "query", description: "Search syntax, e.g. t:minion e:fire cost<=2", required: true }],
  },
] as const;
