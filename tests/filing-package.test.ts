import { describe, expect, it } from "vitest";
import {
  buildPrintableLetter,
  emptyRequesterDetails,
  filingPackageReady,
  formatFeeCents,
  preflightComplete,
  requesterDetailsComplete,
  type PreflightState,
  type RequesterDetails,
} from "../src/domain/filing-package";
import { generateFilingPlan } from "../src/domain/filing-plan";
import {
  nursingAgencySpendingCampaign,
  ontarioHospitalInstitutions,
} from "../src/data/ontario-nursing-agency-demo";

const plan = generateFilingPlan(
  nursingAgencySpendingCampaign,
  ontarioHospitalInstitutions,
);
const uhnRequest = plan.requests.find(
  (request) => request.institutionId === "uhn",
)!;

const fullPreflight: PreflightState = {
  route: true,
  fee: true,
  wording: true,
  enclosures: true,
};

const completeRequester: RequesterDetails = {
  name: "Example Requester",
  email: "requester@example.ca",
  phone: "416-555-0100",
  mailingAddress: "1 Front Street West, Toronto ON M5J 2N5",
};

describe("preflight", () => {
  it("is complete only when every check is true", () => {
    expect(preflightComplete(fullPreflight)).toBe(true);
    expect(preflightComplete({ ...fullPreflight, route: false })).toBe(false);
    expect(preflightComplete({})).toBe(false);
  });

  it("requires requester name and route-appropriate contact details", () => {
    expect(
      requesterDetailsComplete(completeRequester, "mail"),
    ).toBe(true);
    expect(
      requesterDetailsComplete({ ...completeRequester, mailingAddress: " " }, "mail"),
    ).toBe(false);
    expect(
      requesterDetailsComplete({ ...completeRequester, mailingAddress: "" }, "email"),
    ).toBe(true);
    expect(
      requesterDetailsComplete({ ...completeRequester, email: "" }, "email"),
    ).toBe(false);
    expect(requesterDetailsComplete(emptyRequesterDetails, "mail")).toBe(false);
  });

  it("gates the filing package on both preflight and requester details", () => {
    expect(filingPackageReady(fullPreflight, completeRequester, "mail")).toBe(true);
    expect(filingPackageReady({}, completeRequester, "mail")).toBe(false);
    expect(filingPackageReady(fullPreflight, emptyRequesterDetails, "mail")).toBe(
      false,
    );
  });
});

describe("buildPrintableLetter", () => {
  const letter = buildPrintableLetter(uhnRequest, completeRequester, "2026-10-06");

  it("formats the letter with recipient, requester, and fee", () => {
    expect(letter).toContain("2026-10-06");
    expect(letter).toContain("Freedom of Information and Privacy Office");
    expect(letter).toContain("University Health Network");
    expect(letter).toContain("190 Elizabeth Street");
    expect(letter).toContain("Re: Freedom of information request");
    expect(letter).toContain("Sincerely,");
    expect(letter).toContain("Example Requester");
    expect(letter).toContain("requester@example.ca");
    expect(letter).toContain("Application fee of $5.00");
  });

  it("contains the request body without the draft-only notice", () => {
    expect(letter).toContain("Under Ontario's FIPPA");
    expect(letter).toContain("To reduce privacy impact and processing work");
    expect(letter).not.toContain("This is a draft generated for human review");
  });
});

describe("formatFeeCents", () => {
  it("formats integer cents as CAD currency", () => {
    expect(formatFeeCents(500)).toBe("$5.00");
    expect(formatFeeCents(0)).toBe("$0.00");
  });
});
