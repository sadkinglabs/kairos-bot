/** The entry module. Nothing but the default export may live here: the
 * Workers runtime refuses an entry module with other exports. */
import { handle, type Env } from "./worker";

export default {
  fetch: (request: Request, env: Env): Promise<Response> => handle(request, env),
} satisfies ExportedHandler<Env>;
