-- Additive migration for durable operator preflight and optimistic concurrency.
-- Apply once to the existing production schema before enabling request routes.
-- Requester identity remains in record_request_private and is never joined here.

begin;

create table record_request_workflow (
  record_request_id bigint primary key references record_request (id) on delete cascade,
  preflight jsonb not null default '{}'::jsonb,
  quoted_fee_cents integer check (quoted_fee_cents >= 0),
  filed_on date,
  due_on date,
  version integer not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(preflight) = 'object')
);

insert into record_request_workflow (record_request_id)
select id from record_request;

-- Notes are evidence of an operator decision and cannot be silently rewritten.
create trigger operator_note_append_only
  before update or delete on operator_note
  for each row execute function forbid_mutation();

commit;
