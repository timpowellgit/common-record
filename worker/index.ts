import { createApp } from "./app";
import { createDbFromEnv } from "./db";

type Env = {
  HYPERDRIVE?: { connectionString: string };
  DB_URL?: string;
};

let app: ReturnType<typeof createApp> | null = null;

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    app ??= createApp({ db: createDbFromEnv(env) });
    return app.fetch(request);
  },
};
