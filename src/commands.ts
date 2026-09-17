/** The slash commands, as data. This file is the source of truth; Discord
 * keeps its own registered copy, which `npm run register` pushes. Edit
 * here without registering and Discord keeps serving the old shape.
 *
 * It imports nothing so the register script can load it directly under
 * Node's type stripping. Option type 3 is STRING; a command of type 3 is
 * an entry in the right-click menu of a message and has no description. */

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
    description: "Show a random Sorcery card, from all of them or from a search",
    options: [{ type: 3, name: "query", description: "Optional search syntax to draw from, e.g. t:site or e:fire cost<=2", required: false }],
  },
  {
    name: "syntax",
    description: "How to write a search: keys, operators and examples",
  },
  {
    name: "search",
    description: "Search cards with the Kairos Archive syntax",
    options: [{ type: 3, name: "query", description: "Search syntax, e.g. t:minion e:fire cost<=2", required: true }],
  },
  {
    name: "history",
    description: "What changed on a card since it was printed, and when",
    options: [{ type: 3, name: "name", description: "Card name (start typing for suggestions)", required: true, autocomplete: true }],
  },
  {
    name: "set",
    description: "A set: release date, size and its cards",
    options: [{ type: 3, name: "set", description: "Set name or code, e.g. Gothic or 006", required: true, autocomplete: true }],
  },
  {
    /** Right-click a message → Apps → Find cards: shows every [[card name]] in it. */
    name: "Find cards",
    type: 3,
  },
] as const;
