/** The slice of Discord's interaction protocol the bot speaks. Numbers
 * are Discord's own enum values; the names follow their documentation so
 * a reader can look any of them up. Nothing here touches the network. */

export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
} as const;

export const ResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  /** "Working on it": Discord shows a thinking state until the bot edits
   * the message through the interaction's webhook (worker.ts followUp). */
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  /** The same for a component click: the message stays as it is until edited. */
  DEFERRED_UPDATE_MESSAGE: 6,
  /** Replace the message the component sits on, in place. */
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
} as const;

/** Application command types: a slash command, or an entry in the
 * right-click menu of a message. */
export const CommandType = { CHAT_INPUT: 1, MESSAGE: 3 } as const;

export const OptionType = { STRING: 3, INTEGER: 4, BOOLEAN: 5 } as const;

/** A message only its author sees. */
export const EPHEMERAL = 1 << 6;

export interface InteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  focused?: boolean;
  options?: InteractionOption[];
}

export interface Interaction {
  type: number;
  id?: string;
  /** The token that lets the bot edit its reply after a deferred response. */
  token?: string;
  /** Where it came from: the server, when in one; the install that
   * authorised it ("0" a server install, "1" a user install); Discord's
   * context number (0 server, 1 bot DM, 2 private channel); the caller's locale. */
  guild_id?: string;
  authorizing_integration_owners?: Record<string, string>;
  context?: number;
  locale?: string;
  data?: {
    /** Slash commands and menu entries carry a name; components carry a custom_id. */
    name?: string;
    type?: number;
    options?: InteractionOption[];
    custom_id?: string;
    /** The chosen values of a select menu. */
    values?: string[];
    /** A message-menu command: the message it was opened on, resolved. */
    target_id?: string;
    resolved?: { messages?: Record<string, { content?: string }> };
  };
}

/** Discord's embed object, the fields the bot fills. Limits worth knowing:
 * title 256, description 4,096, footer text 2,048, 6,000 across the embed. */
export interface Embed {
  title: string;
  url?: string;
  description?: string;
  color?: number;
  image?: { url: string };
  thumbnail?: { url: string };
  /** Up to 25; a name up to 256, a value up to 1,024. */
  fields?: EmbedField[];
  footer?: { text: string };
}
export interface EmbedField { name: string; value: string; inline?: boolean }

/** A row of link buttons under a message: style 5 buttons carry a URL
 * and never call back, so they need no handler. */
export interface LinkButton { type: 2; style: 5; label: string; url: string }
/** A grey button that calls back with its custom_id (at most 100 characters). */
export interface ActionButton { type: 2; style: 2; label: string; custom_id: string; disabled?: boolean }
export interface SelectOption { label: string; value: string; description?: string; default?: boolean }
/** A string select menu: one per row, up to 25 options, calls back with the chosen values. */
export interface SelectMenu { type: 3; custom_id: string; placeholder?: string; options: SelectOption[] }
export interface ActionRow { type: 1; components: (LinkButton | ActionButton | SelectMenu)[] }

/** Discord's limit on a component's custom_id. */
export const CUSTOM_ID_MAX = 100;

export interface MessageData {
  content?: string;
  embeds?: Embed[];
  components?: ActionRow[];
  flags?: number;
}

export function linkRow(links: { label: string; url: string }[]): ActionRow {
  return { type: 1, components: links.map((l) => ({ type: 2, style: 5, label: l.label, url: l.url })) };
}

export function buttonRow(buttons: { label: string; custom_id: string; disabled?: boolean }[]): ActionRow {
  return { type: 1, components: buttons.map((b) => ({ type: 2, style: 2, label: b.label, custom_id: b.custom_id, ...(b.disabled ? { disabled: true } : {}) })) };
}

export function selectRow(custom_id: string, placeholder: string, options: SelectOption[]): ActionRow {
  return { type: 1, components: [{ type: 3, custom_id, placeholder, options: options.slice(0, 25) }] };
}

export function message(data: MessageData): Response {
  return json({ type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data });
}

/** Replace the message a component was clicked on. */
export function update(data: MessageData): Response {
  return json({ type: ResponseType.UPDATE_MESSAGE, data });
}

/** The text of the message a message-menu command was opened on. */
export function targetMessage(interaction: Interaction): string {
  const id = interaction.data?.target_id;
  return (id && interaction.data?.resolved?.messages?.[id]?.content) || "";
}

/** A reply only the caller sees: for "no such card" and the like, so a
 * typo never litters the channel. */
export function whisper(content: string): Response {
  return message({ content, flags: EPHEMERAL });
}

export function choices(list: { name: string; value: string }[]): Response {
  return json({ type: ResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices: list.slice(0, 25) } });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** The string value of a named option, or the focused option when
 * `focused` is asked for (autocomplete sends the option being typed). */
export function optionValue(interaction: Interaction, name: string): string | null {
  const option = (interaction.data?.options ?? []).find((o) => o.name === name);
  return option && typeof option.value === "string" ? option.value : null;
}

export function focusedValue(interaction: Interaction): string {
  const option = (interaction.data?.options ?? []).find((o) => o.focused);
  return option && typeof option.value === "string" ? option.value : "";
}
