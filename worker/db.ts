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

export type StaffUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

export type NewRequestEvent = {
  campaignSlug: string;
  recordRequestExternalId: string | null;
  eventType: string;
  occurredOn: string;
  title: string;
  detail: string | null;
  visibility: "public" | "private";
  approvedByUserId: string;
  approvedAt: string;
};

export type CreatedEvent = {
  id: string;
  occurredOn: string;
};

export type Db = {
  health(): Promise<boolean>;
  campaignTimeline(campaignSlug: string): Promise<TimelineRow[]>;
  findStaffByEmail(email: string): Promise<StaffUser | null>;
  createRequestEvent(event: NewRequestEvent): Promise<CreatedEvent | null>;
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

const staffByEmailQuery = `
  select id, email::text as email, display_name, role::text as role
  from staff_user
  where email = $1
  limit 1
`;

/**
 * Insert an operator-approved event and its audit row in one transaction.
 * Returns null when the campaign slug is unknown, or when an external request
 * id was given but does not belong to that campaign.
 */
const insertEventQuery = `
  insert into request_event
    (campaign_id, record_request_id, event_type, occurred_on, title, detail,
     visibility, approved_by, approved_at)
  select c.id,
         r.id,
         $3::request_event_type,
         $4::date,
         $5,
         $6,
         $7::event_visibility,
         $8::bigint,
         $9::timestamptz
  from campaign c
  left join record_request r
    on r.external_id = $2 and r.campaign_id = c.id
  where c.slug = $1
    and ($2 is null or r.id is not null)
  returning id, to_char(occurred_on, 'YYYY-MM-DD') as occurred_on
`;

const insertAuditQuery = `
  insert into audit_event (actor_id, action, entity_kind, entity_id, detail)
  values ($1::bigint, 'request_event.create', 'request_event', $2::bigint, $3::jsonb)
`;

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

    findStaffByEmail(email: string) {
      return withClient(connectionString, async (client) => {
        const result = await client.query<{
          id: string;
          email: string;
          display_name: string;
          role: string;
        }>(staffByEmailQuery, [email]);
        const row = result.rows[0];
        if (!row) return null;
        return {
          id: String(row.id),
          email: row.email,
          displayName: row.display_name,
          role: row.role,
        };
      });
    },

    createRequestEvent(event: NewRequestEvent): Promise<CreatedEvent | null> {
      return withClient(connectionString, async (client) => {
        await client.query("begin");
        try {
          const result = await client.query<{ id: string; occurred_on: string }>(
            insertEventQuery,
            [
              event.campaignSlug,
              event.recordRequestExternalId,
              event.eventType,
              event.occurredOn,
              event.title,
              event.detail,
              event.visibility,
              event.approvedByUserId,
              event.approvedAt,
            ],
          );
          const row = result.rows[0];
          if (!row) {
            await client.query("rollback");
            return null;
          }
          await client.query(insertAuditQuery, [
            event.approvedByUserId,
            row.id,
            JSON.stringify({
              campaignSlug: event.campaignSlug,
              eventType: event.eventType,
              visibility: event.visibility,
            }),
          ]);
          await client.query("commit");
          return { id: String(row.id), occurredOn: row.occurred_on };
        } catch (error) {
          await client.query("rollback");
          throw error;
        }
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
