-- Common Record Phase 0 seed: the researched Ontario nursing-agency pilot.
-- Institution routes were checked against official sources on 2026-10-05 and
-- are seeded with a 30-day expiry so they must be re-verified before filing.

begin;

insert into staff_user (email, display_name, role)
values ('tim@commonrecord.example', 'Tim Powell', 'operator');

insert into place (code, type, name_en, name_fr, parent_id) values ('ca', 'country', 'Canada', 'Canada', null);
insert into place (code, type, name_en, name_fr, parent_id) values ('on', 'province', 'Ontario', 'Ontario', (select id from place where code = 'ca'));
insert into place (code, type, name_en, name_fr, parent_id) values ('on-toronto', 'municipality', 'Toronto', 'Toronto', (select id from place where code = 'on'));
insert into place (code, type, name_en, name_fr, parent_id) values ('on-hamilton', 'municipality', 'Hamilton', 'Hamilton', (select id from place where code = 'on'));
insert into place (code, type, name_en, name_fr, parent_id) values ('on-london', 'municipality', 'London', 'London', (select id from place where code = 'on'));
insert into place (code, type, name_en, name_fr, parent_id) values ('on-ottawa', 'municipality', 'Ottawa', 'Ottawa', (select id from place where code = 'on'));

insert into institution (slug, legal_name, short_name, institution_type, place_id, foi_office_name, governing_law)
values
  ('uhn', 'University Health Network', 'UHN', 'hospital', (select id from place where code = 'on-toronto'), 'Freedom of Information and Privacy Office', 'FIPPA'),
  ('sunnybrook', 'Sunnybrook Health Sciences Centre', 'Sunnybrook', 'hospital', (select id from place where code = 'on-toronto'), 'Freedom of Information and Privacy Office', 'FIPPA'),
  ('hamilton-health-sciences', 'Hamilton Health Sciences', 'HHS', 'hospital', (select id from place where code = 'on-hamilton'), 'Privacy and Freedom of Information Office', 'FIPPA'),
  ('lhsc', 'London Health Sciences Centre', 'LHSC', 'hospital', (select id from place where code = 'on-london'), 'Privacy Office', 'FIPPA'),
  ('the-ottawa-hospital', 'The Ottawa Hospital', 'TOH', 'hospital', (select id from place where code = 'on-ottawa'), 'Freedom of Information and Privacy Office', 'FIPPA');

insert into institution_filing_route (
  institution_id, submission_kind, destination, instructions,
  application_fee_cents, fee_status, contact_status, source_url,
  verified_by, verified_at, expires_at
)
select
  i.id,
  r.submission_kind,
  r.destination,
  r.instructions,
  500,
  'verified',
  'verified',
  r.source_url,
  (select id from staff_user where email = 'tim@commonrecord.example'),
  '2026-10-05',
  '2026-11-04'
from (values
  ('uhn', 'mail'::submission_kind, 'Freedom of Information Coordinator, University Health Network, 190 Elizabeth Street, R. Fraser Elliott Building 2nd floor, Toronto ON M5G 2C4', 'Post the completed UHN form with a $5 cheque or money order, or use the form''s credit-card fields. Do not mail cash.', 'https://www.uhn.ca/privacy'),
  ('sunnybrook', 'mail'::submission_kind, 'Freedom of Information Office, H Wing Room H3-26, Sunnybrook Health Sciences Centre, 2075 Bayview Avenue, Toronto ON M4N 3M5', 'Post the completed form or request letter with a $5 cheque payable to Sunnybrook. Credit cards are not accepted; do not mail cash.', 'https://sunnybrook.ca/content/freedom-information'),
  ('hamilton-health-sciences', 'mail'::submission_kind, 'Privacy and Freedom of Information Office, Hamilton Health Sciences, P.O. Box 2000, Hamilton ON L8N 3Z5', 'Post the completed form with a $5 cheque or money order payable to Hamilton Health Sciences. Do not mail cash.', 'https://www.hamiltonhealthsciences.ca/privacy'),
  ('lhsc', 'email'::submission_kind, 'privacy@lhsc.on.ca', 'Before emailing the completed form, arrange the $5 fee with LHSC''s Business Office and add its credit-card payment reference, or use the documented mail route.', 'https://www.lhsc.on.ca/privacy'),
  ('the-ottawa-hospital', 'mail'::submission_kind, 'FIPPA Coordinator, The Ottawa Hospital - Civic Campus, Box 656, 1053 Carling Avenue, Ottawa ON K1Y 4E9', 'Post a request letter with a $5 cheque payable to The Ottawa Hospital. The official page says email requests cannot be processed.', 'https://www.ottawahospital.on.ca/privacy')
) as r (slug, submission_kind, destination, instructions, source_url)
join institution i on i.slug = r.slug;

insert into campaign (slug, title, question, status, legislation, records_start, records_end, output_description, data_status)
values (
  'agency-nursing-2022-26-pilot',
  'Ontario hospital private nursing agency spending, 2022-26',
  'How much did five major Ontario hospital systems spend on private agency nurses in each of the last four completed fiscal years?',
  'researched',
  'FIPPA',
  '2022-04-01',
  '2026-03-31',
  'A normalized institution-by-year-by-agency dataset, released source records, methodology, and documented gaps.',
  'demo-only'
);

insert into campaign_institution (campaign_id, institution_id)
select c.id, i.id
from campaign c
join institution i on i.slug in ('uhn', 'sunnybrook', 'hamilton-health-sciences', 'lhsc', 'the-ottawa-hospital')
where c.slug = 'agency-nursing-2022-26-pilot';

insert into request_section (campaign_id, position, heading, request_text)
select c.id, s.position, s.heading, s.request_text
from campaign c,
(values
  (1, 'Agency spending summary', 'Any existing accounts-payable transaction report, expenditure extract, vendor-spend report, or equivalent record showing amounts invoiced or paid for temporary nursing personnel supplied by third-party staffing agencies. Please include fields already held in the source record, such as vendor, date, amount, site or cost centre, staff classification, billed hours, and hourly rate.'),
  (2, 'Existing summaries', 'Any existing monthly, quarterly, or annual summary that reports the cost or hours of agency-supplied Registered Nurses, Registered Practical Nurses, or Nurse Practitioners.')
) as s (position, heading, request_text)
where c.slug = 'agency-nursing-2022-26-pilot';

insert into campaign_exclusion (campaign_id, position, exclusion_text)
select c.id, e.position, e.exclusion_text
from campaign c,
(values
  (1, 'Patient records and patient-identifying information.'),
  (2, 'Individual staff names, personal contact information, and employee identifiers.'),
  (3, 'Individual shift schedules, copies of every invoice, and contracts at this stage.'),
  (4, 'The hospital''s own employees, internal float pools, and contractors engaged directly rather than through a staffing agency.')
) as e (position, exclusion_text)
where c.slug = 'agency-nursing-2022-26-pilot';

insert into record_request (external_id, campaign_id, institution_id, filing_route_id, subject, body, status, estimated_fee_cents)
select
  'agency-nursing-2022-26-pilot:' || i.slug,
  c.id,
  i.id,
  fr.id,
  'Freedom of information request - Ontario hospital private nursing agency spending, 2022-26',
  'Draft body generated by buildRequestBody; regenerate from the current filing plan before use.',
  'draft',
  500
from campaign c
join campaign_institution ci on ci.campaign_id = c.id
join institution i on i.id = ci.institution_id
join institution_filing_route fr on fr.institution_id = i.id and fr.is_current
where c.slug = 'agency-nursing-2022-26-pilot';

insert into record_request_private (record_request_id)
select id from record_request;

insert into request_event (campaign_id, record_request_id, event_type, occurred_on, title, detail, visibility, approved_by, approved_at)
select
  c.id,
  null,
  'research-completed',
  '2026-10-05',
  'Pilot research completed',
  'Filing routes, fees, and request wording researched for five Ontario hospital systems.',
  'public',
  (select id from staff_user where email = 'tim@commonrecord.example'),
  '2026-10-05T16:00:00Z'
from campaign c
where c.slug = 'agency-nursing-2022-26-pilot';

insert into request_event (campaign_id, record_request_id, event_type, occurred_on, title, detail, visibility, approved_by, approved_at)
select
  c.id,
  null,
  'routes-verified',
  '2026-10-05',
  'Filing routes verified against official sources',
  'Every route and fee was checked on 2026-10-05. Routes expire after 30 days and must be re-verified before filing.',
  'public',
  (select id from staff_user where email = 'tim@commonrecord.example'),
  '2026-10-05T16:00:00Z'
from campaign c
where c.slug = 'agency-nursing-2022-26-pilot';

insert into audit_event (actor_id, action, entity_kind, entity_id, detail)
select
  (select id from staff_user where email = 'tim@commonrecord.example'),
  'seed',
  'campaign',
  c.id,
  jsonb_build_object('note', 'Seeded researched pilot from docs/pilot-campaign-agency-nursing.md')
from campaign c
where c.slug = 'agency-nursing-2022-26-pilot';

commit;
