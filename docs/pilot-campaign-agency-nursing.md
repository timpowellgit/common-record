# Pilot campaign: private agency nursing spend at Ontario hospitals

Research verified: 2026-10-05

## The public question

**How much did five major Ontario hospital systems spend on private agency nurses in each of the last four completed fiscal years, by staffing agency and nurse type?**

This is a practical first Common Record campaign because the question is easy to explain, the institutions are covered by Ontario's Freedom of Information and Protection of Privacy Act (FIPPA), and the requested facts should be reflected in ordinary accounts-payable or workforce records. It also tests the product's core value: the same public question requires five separately addressed, paid and tracked requests.

## Why this question matters now

The Office of the Auditor General of Ontario reported that hospitals can pay substantially more for agency nurses than for permanent nurses and that the Ministry of Health and Ontario Health did not specifically track agency-staff costs. Its 2023 work found that 30 of 34 responding Northern Ontario hospitals used agency nurses in 2022/23, at a combined cost of more than $73 million. The Auditor recommended regular collection of agency health-care staffing spend by staff type.

Ontario enacted the *Health Care Staffing Agency Reporting Act, 2025*, but the current official consolidation says the Act is **not yet in force**. The proposed reporting system therefore does not currently replace institution-level access requests.

Primary sources:

- [Auditor General of Ontario, Emergency Departments (2023)](https://www.auditor.on.ca/en/content/annualreports/arreports/en23/AR_emergencydepts_en23.pdf)
- [Auditor General of Ontario, Hospitals in Northern Ontario (2023)](https://www.auditor.on.ca/en/content/annualreports/arreports/en23/AR_hospitalsnorth_en23.pdf)
- [Ontario e-Laws, Health Care Staffing Agency Reporting Act, 2025](https://www.ontario.ca/laws/statute/25h07)

## Pilot scope

File the same request with these five institutions:

1. University Health Network (Toronto)
2. Sunnybrook Health Sciences Centre (Toronto)
3. Hamilton Health Sciences (Hamilton)
4. London Health Sciences Centre (London)
5. The Ottawa Hospital (Ottawa)

This gives the pilot geographic breadth while keeping the minimum application-fee budget to **$25 total**. It is not a representative sample of every Ontario hospital: it deliberately starts with large systems that publish clear FOI instructions. A later phase could add small, rural and Northern hospitals, where the Auditor found distinct staffing pressures.

The requested period is **April 1, 2022 through March 31, 2026**, corresponding to fiscal years 2022/23, 2023/24, 2024/25 and 2025/26. All four years are complete as of the research date.

## Draft request language

Use the following description of records in each institution's form or request letter. Replace `[INSTITUTION]` with the legal institution name.

> Under the Freedom of Information and Protection of Privacy Act, I request access to existing general records in the custody or control of [INSTITUTION] for the period April 1, 2022 through March 31, 2026 that show amounts invoiced or paid for temporary nursing personnel supplied by third-party staffing agencies.
>
> Please provide:
>
> 1. Any existing accounts-payable transaction report, expenditure extract, vendor-spend report, or equivalent record showing payments for these services. Please include fields already held in the source record, such as vendor/payee name, invoice or posting date, amount, hospital site or cost centre, staff classification, billed hours, and hourly rate.
> 2. Any existing monthly, quarterly, or annual summary that reports the cost or hours of agency-supplied Registered Nurses (RNs), Registered Practical Nurses (RPNs), or Nurse Practitioners (NPs).
>
> For clarity, “third-party staffing agency” means an external organization that supplied temporary personnel to perform nursing work at or for [INSTITUTION]. The request does not include the hospital's own employees, internal float pools, or independent contractors engaged directly rather than through a staffing agency. It does include associated agency charges appearing in the responsive transaction or summary, such as travel or accommodation, where those charges cannot be separated without creating a new record.
>
> Please provide responsive tabular records electronically in their existing machine-readable format (for example CSV or XLSX), where available. I do not ask [INSTITUTION] to create a new calculation, classification, or record. If a listed field is not present in an existing responsive record, please provide the record without that field. Personal information about individual workers may be removed; aggregate hours, staff classifications, agency names, and financial amounts are requested.
>
> I am not requesting individual shift schedules, worker names, clinical or patient records, copies of every invoice, or contracts at this stage. If vendor names are contained in responsive financial records, please do not replace them with a single undifferentiated “agency staffing” total without first identifying the applicable basis under FIPPA. If you anticipate a fee above $25, please provide the required detailed estimate before undertaking chargeable work and contact me so that I may narrow the request.

### Optional clarification if an institution asks for a vendor list

Do not guess a closed list of suppliers. Reply:

> The request is defined by the service purchased, not by a predetermined vendor list. Please search the accounts-payable, procurement, nursing workforce, and finance records or account categories ordinarily used to identify temporary nursing services. I am happy to discuss search terms or known vendor categories with a knowledgeable staff member.

This avoids silently excluding an agency while still directing the search to likely record systems.

## Expected public outputs

The campaign should publish both the raw releases and a normalized table. The normalized table should have one row per institution, fiscal year, staffing agency and nurse type, with these fields:

| Field | Required? | Treatment |
|---|---:|---|
| institution | yes | Legal hospital-system name |
| fiscal_year | yes | `2022/23` through `2025/26` |
| agency_name | when disclosed | Preserve released name; record redaction separately |
| nurse_type | when recorded | RN, RPN, NP, mixed/unknown |
| amount | yes | Record whether invoiced or paid and whether tax is included |
| hours | when recorded | Never infer from dollars or an assumed hourly rate |
| hospital_site_or_cost_centre | when recorded | Keep source label and an optional normalized label |
| source_request_id | yes | Link every derived row to its request and released file |
| source_page_or_row | yes | Reproducible location in the release |
| notes | yes | Redactions, scope differences, credits, travel or other caveats |

The public campaign page should also show filing date, acknowledgment date, current statutory due date, extensions, fee estimates, clarification correspondence, decision date, appeal deadline, total paid, and release files for each institution.

## Filing plan

Institution-specific routes are in [`../research/ontario-hospital-foi-targets.csv`](../research/ontario-hospital-foi-targets.csv). Four institutions currently require postal filing; LHSC permits email after its Business Office supplies a credit-card payment reference. The lowest-friction supervised workflow is therefore:

1. Generate five institution-specific forms or letters and an exact payment checklist.
2. Have a human confirm requester identity/contact details and sign each request.
3. Obtain one $5 payment per institution using its accepted method.
4. Mail UHN, Sunnybrook, Hamilton and Ottawa; email or mail LHSC.
5. Record delivery evidence and the institution's acknowledgment before starting the response clock in the tracker.

Current IPC guidance says requests received on or after July 1, 2026 generally have a **45-business-day** response period, subject to permitted extensions. Several hospital pages still say 30 days; the campaign tracker should use current IPC guidance and preserve the institution's own stated date when an acknowledgment arrives.

Primary source: [Information and Privacy Commissioner of Ontario, Access to information](https://www.ipc.on.ca/en/access-organizations).

## Practical risks and unknowns

| Risk or unknown | Likely effect | Pilot response |
|---|---|---|
| A hospital may not classify vendor transactions by nurse type | Nurse-type comparison may be incomplete | Publish “mixed/unknown”; do not infer |
| AP records may show vendor totals covering non-nursing staff | Overstatement risk | Preserve the hospital's category and mark mixed services; seek clarification |
| Hours and rates may live outside AP systems | Dollar totals may be available without hours | Treat hours as optional and do not calculate rates without matching source data |
| Vendor names or rates may trigger third-party notice or exemption claims | Delay, redaction, or appeal | Keep the first request focused on actual paid transactions; log the legal basis for each redaction |
| Four years of transaction data may generate a search/preparation fee | Campaign cost may exceed $25 per institution | Ask for existing exports/summaries and require an estimate before chargeable work |
| Hospital pages may lag the July 2026 statutory amendments | Conflicting deadline expectations | Use current IPC guidance, then track the deadline the institution confirms |
| Mergers, shared procurement, or payments by another legal entity may create custody/control questions | Partial or zero results | Ask the institution to identify the record-holding entity rather than treating “no records” as zero spend |
| “Agency nurse” may be used differently across institutions | Comparability risk | Publish definitions, exclusions and source metadata beside every figure |
| A zero-dollar release may mean no use, no responsive classification, or another payer | False conclusions | Report zero only when the institution confirms zero spend for the defined scope |

## Go/no-go assessment

**Go**, with supervised filing and a hard initial processing-fee cap. The campaign can produce a useful public dataset even if hours or nurse types are inconsistently recorded, because institution/year/agency spending is independently valuable. The key product test is not merely whether records arrive; it is whether Common Record can transparently preserve differences in definitions, fees, delays and redactions without presenting unlike figures as directly comparable.

Do not add crowdfunding payments until the filing plan, correspondence tracker, fee approval gate and release-to-dataset provenance work end to end. The first campaign can display a target budget, but contributions should remain a non-binding expression of interest until payment handling, refunds and campaign failure rules are defined.
