import type { OperatorRequest } from "./types";

const seededAt = "2026-10-05T16:00:00.000Z";

/**
 * Fictional records for interface development only. Do not use these filing
 * destinations or fees for a real request without verifying them first.
 */
export const demoOperatorRequests: OperatorRequest[] = [
  {
    id: "demo-university-health-network",
    campaignId: "agency-nursing",
    campaignTitle: "Private nursing agency spending",
    institution: "University Health Network",
    filingMethod: "Institution portal",
    filingDestination: "Verify before filing",
    status: "draft",
    applicationFee: 5,
    quotedFee: null,
    filedAt: null,
    dueAt: null,
    operatorNotes: "Confirm the reporting period and records custodian.",
    updatedAt: seededAt,
    activity: [
      {
        id: "demo-activity-1",
        at: seededAt,
        message: "Demo request created.",
      },
    ],
  },
  {
    id: "demo-ottawa-hospital",
    campaignId: "agency-nursing",
    campaignTitle: "Private nursing agency spending",
    institution: "The Ottawa Hospital",
    filingMethod: "Email or mail",
    filingDestination: "Verify before filing",
    status: "approved",
    applicationFee: 5,
    quotedFee: null,
    filedAt: null,
    dueAt: null,
    operatorNotes: "Wording reviewed in demo mode; no request has been sent.",
    updatedAt: seededAt,
    activity: [
      {
        id: "demo-activity-2",
        at: seededAt,
        message: "Marked approved in demo data.",
      },
    ],
  },
  {
    id: "demo-hamilton-health-sciences",
    campaignId: "agency-nursing",
    campaignTitle: "Private nursing agency spending",
    institution: "Hamilton Health Sciences",
    filingMethod: "Institution portal",
    filingDestination: "Verify before filing",
    status: "fee-review",
    applicationFee: 5,
    quotedFee: 180,
    filedAt: "2026-09-20",
    dueAt: "2026-10-20",
    operatorNotes: "Fictional fee estimate included to exercise the review state.",
    updatedAt: seededAt,
    activity: [
      {
        id: "demo-activity-3",
        at: seededAt,
        message: "Demo fee estimate recorded.",
      },
    ],
  },
];
