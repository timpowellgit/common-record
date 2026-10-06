export type VerificationStatus = "verified" | "needs-verification" | "demo-only";

export type SubmissionMethod =
  | {
      kind: "online-portal";
      url: string;
      instructions?: string;
    }
  | {
      kind: "email";
      email: string;
      instructions?: string;
    }
  | {
      kind: "mail";
      address: string;
      instructions?: string;
    };

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  jurisdiction: "Ontario";
  institutionType: "hospital" | "municipality" | "school-board" | "provincial-body";
  freedomOfInformationOfficeName: string;
  submission: SubmissionMethod;
  applicationFeeCents: number;
  feeStatus: VerificationStatus;
  contactStatus: VerificationStatus;
  verificationNote: string;
}

export interface RecordsCampaign {
  id: string;
  title: string;
  question: string;
  jurisdiction: "Ontario";
  legislation: "FIPPA" | "MFIPPA";
  recordsPeriod: {
    start: string;
    end: string;
  };
  requestSections: readonly RequestSection[];
  exclusions: readonly string[];
  outputDescription: string;
  dataStatus: VerificationStatus;
}

export interface RequestSection {
  id: string;
  heading: string;
  request: string;
}

export type ApprovalGateKind =
  | "institution-contact"
  | "request-wording"
  | "privacy-and-scope"
  | "fee-budget"
  | "final-submission";

export interface ApprovalGate {
  kind: ApprovalGateKind;
  label: string;
  reason: string;
  status: "required";
}

export interface FilingRequest {
  id: string;
  campaignId: string;
  institutionId: string;
  institutionName: string;
  foiOfficeName: string;
  subject: string;
  body: string;
  letterBody: string;
  submission: SubmissionMethod;
  estimatedApplicationFeeCents: number;
  verificationStatus: VerificationStatus;
  verificationNote: string;
  approvalGates: readonly ApprovalGate[];
  status: "draft";
}

export interface FilingPlan {
  campaign: RecordsCampaign;
  requests: readonly FilingRequest[];
  totals: {
    requestCount: number;
    estimatedApplicationFeesCents: number;
  };
  warnings: readonly string[];
  mode: "supervised-draft";
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function assertValidCampaign(campaign: RecordsCampaign) {
  if (!datePattern.test(campaign.recordsPeriod.start) || !datePattern.test(campaign.recordsPeriod.end)) {
    throw new Error("Campaign record dates must use YYYY-MM-DD format.");
  }
  if (campaign.recordsPeriod.start > campaign.recordsPeriod.end) {
    throw new Error("Campaign record start date must not be after its end date.");
  }
  if (campaign.requestSections.length === 0) {
    throw new Error("Campaign must contain at least one request section.");
  }
}

function assertValidInstitutions(institutions: readonly Institution[]) {
  const ids = new Set<string>();
  for (const institution of institutions) {
    if (ids.has(institution.id)) {
      throw new Error(`Duplicate institution id: ${institution.id}`);
    }
    ids.add(institution.id);
    if (!Number.isInteger(institution.applicationFeeCents) || institution.applicationFeeCents < 0) {
      throw new Error(`Invalid application fee for ${institution.name}.`);
    }
  }
}

function buildApprovalGates(institution: Institution): readonly ApprovalGate[] {
  return [
    {
      kind: "institution-contact",
      label: "Verify the filing route",
      reason: `Confirm the current FOI contact, submission method, and fee for ${institution.name}.`,
      status: "required",
    },
    {
      kind: "request-wording",
      label: "Approve the tailored wording",
      reason: "A person must confirm that the generated wording asks for the intended records.",
      status: "required",
    },
    {
      kind: "privacy-and-scope",
      label: "Check privacy and scope",
      reason: "Confirm that exclusions are sufficient and the request is proportionate before filing.",
      status: "required",
    },
    {
      kind: "fee-budget",
      label: "Approve the fee budget",
      reason: "The application fee is an estimate; search, preparation, or copying fees may follow.",
      status: "required",
    },
    {
      kind: "final-submission",
      label: "Authorize submission",
      reason: "Common Record generates drafts only and must not submit or pay without explicit approval.",
      status: "required",
    },
  ];
}

export function buildLetterBody(campaign: RecordsCampaign, institution: Institution): string {
  const sections = campaign.requestSections
    .map((section, index) => `${index + 1}. ${section.heading}\n${section.request}`)
    .join("\n\n");
  const exclusions = campaign.exclusions.map((exclusion) => `- ${exclusion}`).join("\n");

  return `Under Ontario's ${campaign.legislation}, I request the following records held by ${institution.name} for the period ${campaign.recordsPeriod.start} to ${campaign.recordsPeriod.end}, inclusive.\n\n` +
    `${sections}\n\n` +
    `To reduce privacy impact and processing work, this request excludes:\n${exclusions}\n\n` +
    "Please provide responsive records electronically in their native machine-readable format where available. If clarification could reduce the scope, cost, or processing time, please contact the requester before proceeding. Please provide a fee estimate before incurring fees beyond the application fee.";
}

export function buildRequestBody(campaign: RecordsCampaign, institution: Institution): string {
  return `To: ${institution.freedomOfInformationOfficeName}\n\n` +
    `${buildLetterBody(campaign, institution)}\n\n` +
    "This is a draft generated for human review. It has not been submitted.";
}

function combineVerificationStatus(
  campaign: RecordsCampaign,
  institution: Institution,
): VerificationStatus {
  if (
    campaign.dataStatus === "demo-only" ||
    institution.contactStatus === "demo-only" ||
    institution.feeStatus === "demo-only"
  ) {
    return "demo-only";
  }
  if (institution.contactStatus === "needs-verification" || institution.feeStatus === "needs-verification") {
    return "needs-verification";
  }
  return "verified";
}

export function generateFilingPlan(
  campaign: RecordsCampaign,
  institutions: readonly Institution[],
): FilingPlan {
  assertValidCampaign(campaign);
  assertValidInstitutions(institutions);

  const requests = institutions.map<FilingRequest>((institution) => ({
    id: `${campaign.id}:${institution.id}`,
    campaignId: campaign.id,
    institutionId: institution.id,
    institutionName: institution.name,
    foiOfficeName: institution.freedomOfInformationOfficeName,
    subject: `Freedom of information request — ${campaign.title}`,
    body: buildRequestBody(campaign, institution),
    letterBody: buildLetterBody(campaign, institution),
    submission: institution.submission,
    estimatedApplicationFeeCents: institution.applicationFeeCents,
    verificationStatus: combineVerificationStatus(campaign, institution),
    verificationNote: institution.verificationNote,
    approvalGates: buildApprovalGates(institution),
    status: "draft",
  }));

  const warnings = [
    "Demo data: verify every institution contact and fee against an official source immediately before filing.",
    "Application fees do not include possible search, preparation, copying, or shipping fees.",
    "This plan prepares drafts only; it does not file requests, send messages, or make payments.",
  ];

  return {
    campaign,
    requests,
    totals: {
      requestCount: requests.length,
      estimatedApplicationFeesCents: requests.reduce(
        (total, request) => total + request.estimatedApplicationFeeCents,
        0,
      ),
    },
    warnings,
    mode: "supervised-draft",
  };
}
