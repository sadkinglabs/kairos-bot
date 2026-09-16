/** A fetch that serves the fixtures the way api.kairosarchive.net does,
 * and remembers every URL asked for, so a test can say "one fetch of the
 * index, none of versions.json". */
import { cards, index, printings, sets, versions } from "./fixtures";
import type { Fetch } from "../src/registry";

export const BASE = "https://api.test";

export function fakeFetch(overrides: Record<string, unknown> = {}): Fetch & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (url: string) => {
    calls.push(url);
    const path = url.replace(`${BASE}/`, "");
    const body = overrides[path] ?? route(path);
    if (body === undefined) return new Response("not found", { status: 404 });
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as Fetch & { calls: string[] };
  fn.calls = calls;
  return fn;
}

function route(path: string): unknown {
  if (path === "versions.json") return versions;
  const m = /^v3\.9\.0\/(.+)$/.exec(path);
  if (!m) return undefined;
  const rest = m[1]!;
  if (rest === "index/cards.json") return index;
  if (rest === "sets.json") return sets;
  const card = /^cards\/(C\d{6})\.json$/.exec(rest);
  if (card) return cards[card[1]!];
  const printing = /^printings\/(P\d{6})\.json$/.exec(rest);
  if (printing) return printings[printing[1]!];
  return undefined;
}
