/** Where the cards come from. The registry publishes a discovery document,
 * versions.json, naming the newest verified release of each major; every
 * release lives at its own immutable root, so the bot reads versions.json
 * (cached for a minute at the edge), resolves latest.v3, and fetches
 * objects from that root, where every byte is cacheable for a year.
 *
 * Each isolate keeps one name index in module scope: a cold isolate pays
 * one fetch and one parse of index/cards.json, and every request after
 * that reads memory. The index re-resolves the release every ten minutes,
 * so a new release reaches the bot without a deploy. */

export interface IndexCard {
  codex_id: string;
  name: string;
  type: string | null;
  category: string | null;
  rarity: string | null;
  elements: string[];
  keywords: string[];
  subtypes: string[];
  cost: number | null;
  attack: number | null;
  defense: number | null;
  power: number | null;
  life: number | null;
  errata: boolean;
  set_codes: string[];
  default_printing_id: string | null;
  image_status: string;
}

export interface Face {
  type: string | null;
  subtypes: string[];
  rarity: string | null;
  elements: string[];
  cost: number | null;
  attack: number | null;
  defense: number | null;
  power: number | null;
  life: number | null;
  thr_air: number;
  thr_earth: number;
  thr_fire: number;
  thr_water: number;
  rules_text: string;
}

/** A fact the official API does not say, with where it came from (schema 12). */
export interface Note { text: string; source: string; recorded: string }

/** Where a hand-recorded record came from (schema 12); null for a record the
 * registry only ever observed in the official API. */
export interface Manual {
  source: string;
  recorded: string;
  confirmed_at: string | null;
  withdrawn: { on: string; reason: string } | null;
}

/** The schema 12 fields, optional so the bot reads a v3.3.x release too:
 * who stands behind a record ("api", or "manual" when the registry
 * recorded it by hand because the API does not serve it), and its notes. */
export interface Provenance {
  origin?: "api" | "manual";
  manual?: Manual | null;
  notes?: Note[];
}

export interface Card extends Face, Provenance {
  codex_id: string;
  name: string;
  keywords: string[];
  errata: boolean;
  set_codes: string[];
  printing_ids: string[];
  default_printing_id: string | null;
  api_url: string;
  kairos_url: string;
  image_urls: ImageUrls | null;
  image_status: string;
  back: Face | null;
  /** The card object carries a summary of each printing and its histories. */
  printings: PrintingSummary[];
  name_history: { name: string; valid_from: string; valid_to: string | null }[];
  card_history: HistoryRow[];
}

export interface PrintingSummary {
  printing_id: string;
  slug: string;
  set_code: string;
  set_name: string;
  released_at: string | null;
  product: string;
  finish: string;
  printed_as_current: boolean | null;
  retired_at: string | null;
  released_with?: string | null;
  origin?: "api" | "manual";
}

/** One state of the card's gameplay face: the values it had between
 * two dates. `source` is "api" when the official API served the face,
 * "card" when it was recorded from the printed card, and "manual" for a
 * card the registry recorded by hand because the API does not serve it. */
export interface HistoryRow extends Face {
  valid_from: string;
  valid_to: string | null;
  source: "api" | "card" | "manual";
  keywords: string[];
  back: Face | null;
}

export interface SetEntry {
  set_code: string;
  set_name: string;
  released_at: string | null;
  cards: number;
  printings: number;
  api_url: string;
  kairos_url: string;
}

/** sets/{code}.json: the entry plus every card in the set by name. */
export interface SetObject extends Omit<SetEntry, "cards"> {
  cards: { codex_id: string; name: string; printing_ids: string[] }[];
}

export interface ImageUrls { small: string; normal: string; large: string; original: string }

export interface Printing extends Provenance {
  printing_id: string;
  codex_id: string;
  card_name: string;
  set_name: string;
  set_code: string;
  released_at: string | null;
  product: string;
  finish: string;
  artist: string | null;
  /** Null for a manual printing whose text is not known. */
  flavour_text: string | null;
  typeline: string | null;
  /** The set release this printing belongs to (schema 12): its own set, or
   * for a promo (999) or curio (CUR), the one the registry recorded. */
  released_with?: string | null;
  printed_as_current: boolean | null;
  retired_at: string | null;
  api_url: string;
  kairos_url: string;
  image_urls: ImageUrls | null;
  image_status: string;
}

export interface Versions { latest: Record<string, string>; releases: { tag: string }[] }

export interface Release { tag: string; root: string; cards: IndexCard[]; sets: Map<string, string>; setList: SetEntry[]; fetchedAt: number }

/** How long an isolate trusts its resolved release before asking
 * versions.json again. */
export const RECHECK_MS = 10 * 60 * 1000;

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Fetch options for bytes at an immutable root: let the edge keep them. */
const IMMUTABLE: RequestInit = { cf: { cacheEverything: true, cacheTtl: 86400 } } as RequestInit;

export class Registry {
  private release: Promise<Release> | null = null;

  constructor(readonly baseUrl: string, private readonly fetchImpl: Fetch = (u, i) => fetch(u, i), private readonly now: () => number = Date.now) {}

  /** The current release's index, resolved at most once per RECHECK_MS. */
  async current(): Promise<Release> {
    const previous = this.release ? await this.release.catch(() => null) : null;
    if (previous && this.now() - previous.fetchedAt < RECHECK_MS) return previous;
    // A failed re-check keeps serving the release already in memory;
    // a failed first load throws, and the next call tries again.
    const next = this.resolve(previous).catch((err: unknown) => {
      if (previous) return { ...previous, fetchedAt: this.now() };
      throw err;
    });
    this.release = next;
    return next;
  }

  /** Read versions.json; keep the parsed index when the tag has not moved. */
  private async resolve(previous: Release | null): Promise<Release> {
    const versions = await this.getJson<Versions>(`${this.baseUrl}/versions.json`, {});
    const tag = versions.latest["v3"];
    if (!tag) throw new Error("versions.json names no v3 release");
    const root = `${this.baseUrl}/${tag}`;
    if (previous && previous.tag === tag) return { ...previous, fetchedAt: this.now() };
    const [cards, setList] = await Promise.all([
      this.getJson<IndexCard[]>(`${root}/index/cards.json`, IMMUTABLE),
      this.getJson<SetEntry[]>(`${root}/sets.json`, IMMUTABLE),
    ]);
    return { tag, root, cards, sets: new Map(setList.map((s) => [s.set_code, s.set_name])), setList, fetchedAt: this.now() };
  }

  async card(codexId: string): Promise<Card | null> {
    const { root } = await this.current();
    return this.getJsonOrNull<Card>(`${root}/cards/${codexId}.json`);
  }

  async printing(printingId: string): Promise<Printing | null> {
    const { root } = await this.current();
    return this.getJsonOrNull<Printing>(`${root}/printings/${printingId}.json`);
  }

  async set(setCode: string): Promise<SetObject | null> {
    const { root } = await this.current();
    return this.getJsonOrNull<SetObject>(`${root}/sets/${setCode}.json`);
  }

  private async getJson<T>(url: string, init: RequestInit): Promise<T> {
    const res = await this.fetchImpl(url, { ...init, headers: { "user-agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  private async getJsonOrNull<T>(url: string): Promise<T | null> {
    const res = await this.fetchImpl(url, { ...IMMUTABLE, headers: { "user-agent": USER_AGENT } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }
}

/** The archive asks automated clients to say who they are. */
export const USER_AGENT = "kairos-bot/0.1 (+https://kairosarchive.net)";
