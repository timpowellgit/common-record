-- Common Record core schema (Phase 0)
-- PostgreSQL 15+. Applied in order: schema.sql, then seed.sql.
-- Design notes:
--   * Money is stored as integer cents.
--   * Private requester data lives in a separate table (record_request_private)
--     so public queries never need to touch it.
--   * request_event and audit_event are append-only, enforced by trigger.
--   * Filing routes are versioned and expire; stale routes cannot be referenced
--     by new filings.

begin;

create extension if not exists citext;

create type staff_role as enum ('researcher', 'operator', 'editor', 'finance', 'administrator');

create type place_type as enum ('country', 'province', 'municipality');

create type institution_type as enum ('hospital', 'municipality', 'school-board', 'provincial-body', 'ministry', 'federal-body');

create type submission_kind as enum ('online-portal', 'email', 'mail');

create type verification_status as enum ('verified', 'needs-verification', 'demo-only');

create type campaign_status as enum ('proposed', 'researched', 'funding', 'funded', 'filed', 'delayed', 'partially-released', 'appealed', 'published', 'closed');

create type request_status as enum ('draft', 'approved', 'filed', 'fee-review', 'overdue', 'received', 'published', 'withdrawn');

create type request_event_type as enum (
  'draft-approved',
  'submitted-and-delivered',
  'acknowledgment-received',
  'deadline-set',
  'clarification-requested',
  'clarification-answered',
  'extension-claimed',
  'fee-estimate-received',
  'fee-approved',
  'fee-disputed',
  'fee-paid',
  'response-overdue',
  'partial-decision-received',
  'final-decision-received',
  'records-released',
  'appeal-filed',
  'appeal-resolved',
  'dataset-published',
  'research-completed',
  'routes-verified',
  'note'
);

create type event_visibility as enum ('public', 'private');

create function forbid_mutation() returns trigger as $$
begin
  raise exception '% on % is not permitted: events are append-only', tg_op, tg_table_name;
end;
$$ language plpgsql;

create table staff_user (
  id bigint generated always as identity primary key,
  email citext not null unique,
  display_name text not null,
  role staff_role not null,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table place (
  id bigint generated always as identity primary key,
  code text not null unique,
  type place_type not null,
  name_en text not null,
  name_fr text not null,
  parent_id bigint references place (id),
  check (
    (type = 'country' and parent_id is null)
    or (type = 'province' and parent_id is not null)
    or (type = 'municipality' and parent_id is not null)
  )
);

create table institution (
  id bigint generated always as identity primary key,
  slug text not null unique,
  legal_name text not null,
  short_name text not null,
  institution_type institution_type not null,
  place_id bigint not null references place (id),
  foi_office_name text not null,
  governing_law text not null default 'FIPPA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table institution_filing_route (
  id bigint generated always as identity primary key,
  institution_id bigint not null references institution (id),
  version integer not null default 1,
  submission_kind submission_kind not null,
  destination text not null,
  instructions text,
  application_fee_cents integer not null check (application_fee_cents >= 0),
  fee_status verification_status not null,
  contact_status verification_status not null,
  source_url text not null,
  verified_by bigint not null references staff_user (id),
  verified_at date not null,
  expires_at date not null,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (institution_id, version),
  check (expires_at > verified_at)
);
create unique index one_current_route_per_institution
  on institution_filing_route (institution_id) where is_current;

create table campaign (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  question text not null,
  status campaign_status not null default 'proposed',
  legislation text not null,
  records_start date not null,
  records_end date not null,
  output_description text not null,
  data_status verification_status not null,
  created_at timestamptz not null default now(),
  check (records_start <= records_end)
);

create table campaign_institution (
  campaign_id bigint not null references campaign (id),
  institution_id bigint not null references institution (id),
  primary key (campaign_id, institution_id)
);

create table request_section (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references campaign (id),
  position integer not null,
  heading text not null,
  request_text text not null,
  unique (campaign_id, position)
);

create table campaign_exclusion (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references campaign (id),
  position integer not null,
  exclusion_text text not null,
  unique (campaign_id, position)
);

create table record_request (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  campaign_id bigint not null references campaign (id),
  institution_id bigint not null references institution (id),
  filing_route_id bigint not null references institution_filing_route (id),
  subject text not null,
  body text not null,
  status request_status not null default 'draft',
  estimated_fee_cents integer not null check (estimated_fee_cents >= 0),
  created_at timestamptz not null default now(),
  unique (campaign_id, institution_id)
);

create table record_request_private (
  record_request_id bigint primary key references record_request (id) on delete cascade,
  requester_name text,
  requester_email citext,
  requester_phone text,
  requester_mailing_address text,
  signature_statement text,
  updated_at timestamptz not null default now()
);

create table request_event (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references campaign (id),
  record_request_id bigint references record_request (id),
  event_type request_event_type not null,
  occurred_on date not null,
  title text not null,
  detail text,
  visibility event_visibility not null default 'private',
  evidence_file_id bigint,
  approved_by bigint references staff_user (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    visibility = 'private'
    or (approved_by is not null and approved_at is not null)
  ),
  check (
    visibility = 'private'
    or event_type not in ('note')
  )
);
create index request_event_public_timeline
  on request_event (campaign_id, occurred_on)
  where visibility = 'public' and approved_at is not null;

create table operator_note (
  id bigint generated always as identity primary key,
  record_request_id bigint not null references record_request (id) on delete cascade,
  author_id bigint not null references staff_user (id),
  note text not null,
  created_at timestamptz not null default now()
);

create table audit_event (
  id bigint generated always as identity primary key,
  actor_id bigint references staff_user (id),
  action text not null,
  entity_kind text not null,
  entity_id bigint not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create trigger request_event_append_only
  before update or delete on request_event
  for each row execute function forbid_mutation();

create trigger audit_event_append_only
  before update or delete on audit_event
  for each row execute function forbid_mutation();

commit;
