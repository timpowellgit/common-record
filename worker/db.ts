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

export type WorkflowPreflight = Partial<Record<"route" | "fee" | "wording" | "enclosures", boolean>> & {
  routeConfirmedOn?: string;
  feeConfirmedOn?: string;
};

export type OperatorRequestRow = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  institution: string;
  filingMethod: string;
  filingDestination: string;
  status: string;
  applicationFeeCents: number;
  quotedFeeCents: number | null;
  filedOn: string | null;
  dueOn: string | null;
  operatorNotes: string;
  updatedAt: string;
  version: number;
  preflight: WorkflowPreflight;
  activity: { id: string; at: string; message: string }[];
};

export type OperatorRequestPatch = {
  campaignSlug: string;
  externalId: string;
  expectedVersion: number;
  status?: "draft" | "approved";
  preflight?: WorkflowPreflight;
  note?: string;
  actorId: string;
};

export type OperatorRequestPatchResult =
  | { status: "updated"; request: OperatorRequestRow }
  | { status: "not-found" }
  | { status: "conflict" };

export type Db = {
  health(): Promise<boolean>;
  campaignTimeline(campaignSlug: string): Promise<TimelineRow[]>;
  findStaffByEmail(email: string): Promise<StaffUser | null>;
  createRequestEvent(event: NewRequestEvent): Promise<CreatedEvent | null>;
  /** Optional until the additive operator-workflow migration is applied. */
  listOperatorRequests?(campaignSlug: string): Promise<OperatorRequestRow[]>;
  patchOperatorRequest?(patch: OperatorRequestPatch): Promise<OperatorRequestPatchResult>;
};

type OperatorRequestQueryRow = {
  id: string;
  campaign_id: string;
  campaign_title: string;
  institution: string;
  filing_method: string;
  filing_destination: string;
  status: string;
  application_fee_cents: number;
  quoted_fee_cents: number | null;
  filed_on: string | null;
  due_on: string | null;
  operator_notes: string | null;
  updated_at: Date;
  version: number;
  preflight: WorkflowPreflight;
  activity: { id: string; at: string; message: string }[];
};

const operatorRequestsQuery = `
  select r.external_id as id, c.slug as campaign_id, c.title as campaign_title,
         i.legal_name as institution,
         fr.submission_kind::text as filing_method,
         fr.destination as filing_destination,
         r.status::text as status,
         fr.application_fee_cents as application_fee_cents,
         w.quoted_fee_cents as quoted_fee_cents,
         to_char(w.filed_on, 'YYYY-MM-DD') as filed_on,
         to_char(w.due_on, 'YYYY-MM-DD') as due_on,
         coalesce(n.note, '') as operator_notes,
         coalesce(w.updated_at, r.created_at) as updated_at,
         coalesce(w.version, 0) as version,
         coalesce(w.preflight, '{}'::jsonb) as preflight,
         coalesce(a.activity, '[]'::jsonb) as activity
  from record_request r
  join campaign c on c.id = r.campaign_id
  join institution i on i.id = r.institution_id
  join institution_filing_route fr on fr.id = r.filing_route_id
  left join record_request_workflow w on w.record_request_id = r.id
  left join lateral (
    select note from operator_note
    where record_request_id = r.id order by created_at desc, id desc limit 1
  ) n on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', x.id::text, 'at', x.created_at,
      'message', concat_ws('; ',
        case when x.detail->>'previousStatus' is distinct from x.detail->>'nextStatus'
          then 'Status changed to ' || (x.detail->>'nextStatus') end,
        case when x.detail->>'preflightChanged' = 'true'
          then 'Preflight checklist updated' end,
        case when x.detail->>'noteAdded' = 'true'
          then 'Operator note added' end
      )
    ) order by x.created_at asc, x.id asc) as activity
    from (
      select id, created_at, detail from audit_event
      where entity_kind = 'record_request' and entity_id = r.id
        and action = 'record_request.workflow_update'
      order by created_at desc, id desc limit 50
    ) x
  ) a on true
  where c.slug = $1 and ($2::text is null or r.external_id = $2)
  order by i.legal_name
`;

function mapOperatorRequest(row: OperatorRequestQueryRow): OperatorRequestRow {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignTitle: row.campaign_title,
    institution: row.institution,
    filingMethod: row.filing_method,
    filingDestination: row.filing_destination,
    status: row.status,
    applicationFeeCents: row.application_fee_cents,
    quotedFeeCents: row.quoted_fee_cents,
    filedOn: row.filed_on,
    dueOn: row.due_on,
    operatorNotes: row.operator_notes ?? "",
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    version: row.version,
    preflight: row.preflight ?? {},
    activity: row.activity ?? [],
  };
}

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

    listOperatorRequests(campaignSlug: string) {
      return withClient(connectionString, async (client) => {
        const result = await client.query<OperatorRequestQueryRow>(operatorRequestsQuery, [
          campaignSlug,
          null,
        ]);
        return result.rows.map(mapOperatorRequest);
      });
    },

    patchOperatorRequest(patch: OperatorRequestPatch) {
      return withClient(connectionString, async (client): Promise<OperatorRequestPatchResult> => {
        await client.query("begin");
        try {
          // Backfill a workflow row for requests created after the migration.
          await client.query(`
            insert into record_request_workflow (record_request_id)
            select r.id from record_request r
            join campaign c on c.id = r.campaign_id
            where c.slug = $1 and r.external_id = $2
            on conflict (record_request_id) do nothing
          `, [patch.campaignSlug, patch.externalId]);

          const locked = await client.query<{
            id: string;
            status: string;
            version: number;
            preflight: WorkflowPreflight;
            route_expires_on: string;
            route_is_current: boolean;
            fee_status: string;
            contact_status: string;
          }>(`
            select r.id, r.status::text as status, w.version, w.preflight,
                   to_char(fr.expires_at, 'YYYY-MM-DD') as route_expires_on,
                   fr.is_current as route_is_current,
                   fr.fee_status::text as fee_status,
                   fr.contact_status::text as contact_status
            from record_request r
            join campaign c on c.id = r.campaign_id
            join record_request_workflow w on w.record_request_id = r.id
            join institution_filing_route fr on fr.id = r.filing_route_id
            where c.slug = $1 and r.external_id = $2
            for update of r, w
          `, [patch.campaignSlug, patch.externalId]);
          const current = locked.rows[0];
          if (!current) {
            await client.query("rollback");
            return { status: "not-found" };
          }
          if (current.version !== patch.expectedVersion) {
            await client.query("rollback");
            return { status: "conflict" };
          }
          if (patch.status !== undefined && current.status !== "draft" && current.status !== "approved") {
            await client.query("rollback");
            return { status: "conflict" };
          }

          const nextPreflight = patch.preflight ?? current.preflight;
          if ((patch.status ?? current.status) === "approved" &&
              (patch.status !== undefined || patch.preflight !== undefined)) {
            const today = new Date().toISOString().slice(0, 10);
            const complete = ["route", "fee", "wording", "enclosures"].every(
              (key) => nextPreflight[key as keyof WorkflowPreflight] === true,
            );
            if (!complete || nextPreflight.routeConfirmedOn !== today ||
                nextPreflight.feeConfirmedOn !== today ||
                !current.route_is_current ||
                current.route_expires_on < today ||
                current.fee_status !== "verified" ||
                current.contact_status !== "verified") {
              await client.query("rollback");
              return { status: "conflict" };
            }
          }

          if (patch.status !== undefined) {
            await client.query("update record_request set status = $2::request_status where id = $1::bigint", [
              current.id,
              patch.status,
            ]);
          }
          await client.query(`
            update record_request_workflow
            set preflight = $2::jsonb, version = version + 1, updated_at = now()
            where record_request_id = $1::bigint
          `, [current.id, JSON.stringify(nextPreflight)]);
          if (patch.note !== undefined) {
            await client.query(`
              insert into operator_note (record_request_id, author_id, note)
              values ($1::bigint, $2::bigint, $3)
            `, [current.id, patch.actorId, patch.note]);
          }
          await client.query(`
            insert into audit_event (actor_id, action, entity_kind, entity_id, detail)
            values ($1::bigint, 'record_request.workflow_update', 'record_request', $2::bigint, $3::jsonb)
          `, [patch.actorId, current.id, JSON.stringify({
            previousStatus: current.status,
            nextStatus: patch.status ?? current.status,
            preflightChanged: patch.preflight !== undefined,
            noteAdded: patch.note !== undefined,
            previousVersion: current.version,
            nextVersion: current.version + 1,
          })]);

          const result = await client.query<OperatorRequestQueryRow>(operatorRequestsQuery, [
            patch.campaignSlug,
            patch.externalId,
          ]);
          await client.query("commit");
          return { status: "updated", request: mapOperatorRequest(result.rows[0]) };
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
