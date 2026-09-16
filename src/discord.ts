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
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
} as const;

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
  data?: { name: string; options?: InteractionOption[] };
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
  footer?: { text: string };
}

/** A row of link buttons under a message: style 5 buttons carry a URL
 * and never call back, so they need no handler. */
export interface LinkButton { type: 2; style: 5; label: string; url: string }
export interface ActionRow { type: 1; components: LinkButton[] }

export interface MessageData {
  content?: string;
  embeds?: Embed[];
  components?: ActionRow[];
  flags?: number;
}

export function linkRow(links: { label: string; url: string }[]): ActionRow {
  return { type: 1, components: links.map((l) => ({ type: 2, style: 5, label: l.label, url: l.url })) };
}

export function message(data: MessageData): Response {
  return json({ type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data });
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
