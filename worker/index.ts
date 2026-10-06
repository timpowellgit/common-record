import { createApp } from "./app";
import { accessConfigFromEnv, createAccessAuth, createDisabledAuth } from "./auth";
import { createDbFromEnv } from "./db";

type Env = {
  HYPERDRIVE?: { connectionString: string };
  DB_URL?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
};

let app: ReturnType<typeof createApp> | null = null;

function createOperatorAuth(env: Env) {
  const config = accessConfigFromEnv(env);
  return config ? createAccessAuth(config) : createDisabledAuth();
}

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    app ??= createApp({ db: createDbFromEnv(env), operatorAuth: createOperatorAuth(env) });
    return app.fetch(request);
  },
};
