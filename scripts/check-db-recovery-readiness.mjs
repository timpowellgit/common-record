#!/usr/bin/env node
// Read-only smoke check for a restored, isolated Common Record database.
// Never prints connection strings or private row contents.
import pg from 'pg';

const connectionString = process.env.RECOVERY_DATABASE_URL;
if (!connectionString) {
  console.error('Set RECOVERY_DATABASE_URL to the isolated restore target; no database was contacted.');
  process.exit(2);
}

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });

try {
  await client.connect();
  await client.query('BEGIN TRANSACTION READ ONLY');
  await client.query("SET LOCAL statement_timeout = '5s'");

  const { rows: [identity] } = await client.query(
    'SELECT current_database() AS database, current_user AS role, current_setting(\'transaction_read_only\') AS transaction_mode',
  );
  const { rows: [tables] } = await client.query(`
    SELECT
      to_regclass('public.campaign') IS NOT NULL AS campaign,
      to_regclass('public.record_request') IS NOT NULL AS record_request,
      to_regclass('public.record_request_private') IS NOT NULL AS record_request_private,
      to_regclass('public.request_event') IS NOT NULL AS request_event,
      to_regclass('public.audit_event') IS NOT NULL AS audit_event
  `);
  const missing = Object.entries(tables).filter(([, exists]) => !exists).map(([name]) => name);
  if (missing.length > 0) throw new Error(`Required tables missing: ${missing.join(', ')}`);

  const { rows: [triggers] } = await client.query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.request_event'::regclass
        AND tgname = 'request_event_append_only' AND tgenabled IN ('O', 'A')) AS request_event_append_only,
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.audit_event'::regclass
        AND tgname = 'audit_event_append_only' AND tgenabled IN ('O', 'A')) AS audit_event_append_only
  `);
  if (Object.values(triggers).some((enabled) => !enabled)) {
    throw new Error('Append-only event triggers are missing or disabled');
  }

  const { rows: [counts] } = await client.query(`
    SELECT
      (SELECT count(*) FROM public.campaign) AS campaigns,
      (SELECT count(*) FROM public.record_request) AS requests,
      (SELECT count(*) FROM public.record_request_private) AS private_request_rows,
      (SELECT count(*) FROM public.request_event) AS events,
      (SELECT count(*) FROM public.request_event WHERE visibility = 'public') AS public_events,
      (SELECT count(*) FROM public.audit_event) AS audit_events,
      (SELECT count(*) FROM public.request_event
       WHERE visibility = 'public'
         AND (approved_by IS NULL OR approved_at IS NULL OR event_type = 'note')) AS invalid_public_events
  `);
  if (Number(counts.invalid_public_events) !== 0) {
    throw new Error('Public event approval invariant failed');
  }
  await client.query('COMMIT');
  console.log(JSON.stringify({ ...identity, tables, triggers, counts }, null, 2));
} catch (error) {
  try { await client.query('ROLLBACK'); } catch { /* connection may already be closed */ }
  const message = String(error.message ?? error).replaceAll(connectionString, '[redacted connection]');
  console.error(`Recovery smoke check failed: ${message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
