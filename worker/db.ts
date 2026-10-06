import { Client } from "pg";

export type TimelineRow = {
  id: string;
  campaignId: string;
  requestRef: string | null;
  type: string;
  occurredOn: string;
  title: string;
  detail: string | null;
  approvedBy: string;
  approvedAt: string;
};

export type Db = {
  health(): Promise<boolean>;
  campaignTimeline(campaignSlug: string): Promise<TimelineRow[]>;
};

const timelineQuery = `
  select e.id as id,
         c.slug as campaign_id,
         i.legal_name as request_ref,
         e.event_type::text as type,
         to_char(e.occurred_on, 'YYYY-MM-DD') as occurred_on,
         e.title as title,
         e.detail as detail,
         coalesce(s.display_name, 'Unknown approver') as approved_by,
         e.approved_at as approved_at
  from request_event e
  join campaign c on c.id = e.campaign_id
  left join record_request r on r.id = e.record_request_id
  left join institution i on i.id = r.institution_id
  left join staff_user s on s.id = e.approved_by
  where c.slug = $1
    and e.visibility = 'public'
    and e.approved_at is not null
    and e.event_type::text <> 'note'
  order by e.occurred_on asc, e.approved_at asc
`;

type TimelineQueryResult = {
  id: string;
  campaign_id: string;
  request_ref: string | null;
  type: string;
  occurred_on: string;
  title: string;
  detail: string | null;
  approved_by: string;
  approved_at: Date;
};

/**
 * One client per request. The Workers runtime reaps long-idle sockets, so a
 * cached pool eventually hangs; in production Hyperdrive owns the real
 * connection pool, making client creation cheap.
 */
async function withClient<T>(
  connectionString: string,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
  });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export function createDbFromConnectionString(connectionString: string): Db {
  return {
    health() {
      return withClient(connectionString, async (client) => {
        await client.query("select 1");
        return true;
      }).catch(() => false);
    },

    campaignTimeline(campaignSlug: string) {
      return withClient(connectionString, async (client) => {
        const result = await client.query<TimelineQueryResult>(timelineQuery, [
          campaignSlug,
        ]);
        return result.rows.map((row) => ({
          id: String(row.id),
          campaignId: row.campaign_id,
          requestRef: row.request_ref,
          type: row.type,
          occurredOn: row.occurred_on,
          title: row.title,
          detail: row.detail,
          approvedBy: row.approved_by,
          approvedAt:
            row.approved_at instanceof Date
              ? row.approved_at.toISOString()
              : String(row.approved_at),
        }));
      });
    },
  };
}

/**
 * HYPERDRIVE is the production binding (connection pooling and caching by
 * Cloudflare). DB_URL is the local-development connection string supplied by
 * `.dev.vars`. When neither is present the API serves 503 and the public site
 * falls back to its local timeline store.
 */
export function createDbFromEnv(env: {
  HYPERDRIVE?: { connectionString: string };
  DB_URL?: string;
}): Db | null {
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DB_URL;
  if (!connectionString) return null;
  return createDbFromConnectionString(connectionString);
}
