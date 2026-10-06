import { demoNursingAgencyFilingPlan } from "../data/demo-filing-plan";
import type { SubmissionMethod } from "../domain/filing-plan";
import type { OperatorRequest } from "./types";

const seededAt = "2026-10-05T16:00:00.000Z";

function filingMethod(submission: SubmissionMethod) {
  if (submission.kind === "email") return "Email after payment setup";
  if (submission.kind === "mail") return "Postal mail";
  return "Online portal";
}

function filingDestination(submission: SubmissionMethod) {
  if (submission.kind === "email") return submission.email;
  if (submission.kind === "mail") return submission.address;
  return submission.url;
}

/**
 * Local-only operator fixtures derived from the supervised filing plan. Every
 * request begins as a draft; no request represented here has been submitted.
 */
export const demoOperatorRequests: OperatorRequest[] =
  demoNursingAgencyFilingPlan.requests.map((request, index) => ({
    id: request.id,
    campaignId: request.campaignId,
    campaignTitle: "Private nursing agency spending, 2022–26",
    institution: request.institutionName,
    filingMethod: filingMethod(request.submission),
    filingDestination: filingDestination(request.submission),
    status: "draft",
    applicationFee: request.estimatedApplicationFeeCents / 100,
    quotedFee: null,
    filedAt: null,
    dueAt: null,
    operatorNotes: request.verificationNote,
    updatedAt: seededAt,
    activity: [
      {
        id: `demo-activity-${index + 1}`,
        at: seededAt,
        message: "Supervised draft created; no request has been sent.",
      },
    ],
  }));
