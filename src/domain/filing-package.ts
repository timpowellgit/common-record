import type { FilingRequest, SubmissionMethod } from "./filing-plan";

export const preflightChecks = [
  {
    id: "route",
    label: "Filing route re-verified today against the official source",
  },
  {
    id: "fee",
    label: "Application fee and payment method confirmed",
  },
  {
    id: "wording",
    label: "Final request wording reviewed and approved by an operator",
  },
  {
    id: "enclosures",
    label: "Fee enclosures and institution forms prepared",
  },
] as const;

export type PreflightCheckId = (typeof preflightChecks)[number]["id"];

export type PreflightState = Partial<Record<PreflightCheckId, boolean>>;

export type RequesterDetails = {
  name: string;
  email: string;
  phone: string;
  mailingAddress: string;
};

export const emptyRequesterDetails: RequesterDetails = {
  name: "",
  email: "",
  phone: "",
  mailingAddress: "",
};

export function preflightComplete(preflight: PreflightState): boolean {
  return preflightChecks.every((check) => preflight[check.id] === true);
}

export function requesterDetailsComplete(
  requester: RequesterDetails,
  submissionKind: SubmissionMethod["kind"],
): boolean {
  const hasName = requester.name.trim().length > 0;
  if (submissionKind === "email") {
    return hasName && requester.email.trim().length > 0;
  }
  return hasName && requester.mailingAddress.trim().length > 0;
}

export function filingPackageReady(
  preflight: PreflightState,
  requester: RequesterDetails,
  submissionKind: SubmissionMethod["kind"],
): boolean {
  return (
    preflightComplete(preflight) &&
    requesterDetailsComplete(requester, submissionKind)
  );
}

export function formatFeeCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function submissionDestination(submission: SubmissionMethod): string {
  if (submission.kind === "mail") return submission.address;
  if (submission.kind === "email") return submission.email;
  return submission.url;
}

function blankLine(values: readonly string[]): string {
  return values.filter((value) => value.trim().length > 0).join("\n");
}

/**
 * The printable letter is the operator-reviewed filing document. It contains
 * private requester details by design and must never be exposed on a public
 * page. The draft-only notice belongs to the on-screen plan preview, not to
 * the letter an authorized operator prints and submits.
 */
export function buildPrintableLetter(
  request: FilingRequest,
  requester: RequesterDetails,
  today: string,
): string {
  const signature = blankLine([
    requester.name,
    requester.mailingAddress,
    requester.email,
    requester.phone,
  ]);

  return `${today}\n\n` +
    `${request.foiOfficeName}\n` +
    `${request.institutionName}\n` +
    `${submissionDestination(request.submission)}\n\n` +
    `Re: ${request.subject}\n\n` +
    `${request.letterBody}\n\n` +
    `Sincerely,\n\n${signature}\n\n` +
    `Enclosures:\n` +
    `- Application fee of ${formatFeeCents(request.estimatedApplicationFeeCents)}\n` +
    `- Completed institution request form, if one is required`;
}
