import { describe, expect, it } from "vitest";
import {
  buildRequestBody,
  generateFilingPlan,
  type Institution,
  type RecordsCampaign,
} from "../src/domain/filing-plan";
import {
  nursingAgencySpendingCampaign,
  ontarioHospitalInstitutions,
} from "../src/data/ontario-nursing-agency-demo";

describe("generateFilingPlan", () => {
  it("creates one tailored supervised draft per institution", () => {
    const plan = generateFilingPlan(
      nursingAgencySpendingCampaign,
      ontarioHospitalInstitutions,
    );

    expect(plan.mode).toBe("supervised-draft");
    expect(plan.requests).toHaveLength(ontarioHospitalInstitutions.length);
    expect(plan.totals.requestCount).toBe(5);
    expect(plan.requests.every((request) => request.status === "draft")).toBe(true);

    const uhnRequest = plan.requests.find((request) => request.institutionId === "uhn");
    expect(uhnRequest?.body).toContain("held by University Health Network");
    expect(uhnRequest?.body).toContain("2024-04-01 to 2025-03-31");
    expect(uhnRequest?.body).toContain("It has not been submitted");
  });

  it("calculates the known application-fee estimate", () => {
    const plan = generateFilingPlan(
      nursingAgencySpendingCampaign,
      ontarioHospitalInstitutions,
    );

    expect(plan.totals.estimatedApplicationFeesCents).toBe(2_500);
    expect(plan.warnings.join(" ")).toContain("search, preparation, copying, or shipping fees");
  });

  it("requires every human approval gate on every draft", () => {
    const plan = generateFilingPlan(
      nursingAgencySpendingCampaign,
      ontarioHospitalInstitutions,
    );

    for (const request of plan.requests) {
      expect(request.approvalGates.map((gate) => gate.kind)).toEqual([
        "institution-contact",
        "request-wording",
        "privacy-and-scope",
        "fee-budget",
        "final-submission",
      ]);
      expect(request.approvalGates.every((gate) => gate.status === "required")).toBe(true);
      expect(request.verificationStatus).toBe("demo-only");
    }
  });

  it("rejects duplicate institution identifiers", () => {
    const institution = ontarioHospitalInstitutions[0];
    expect(() =>
      generateFilingPlan(nursingAgencySpendingCampaign, [institution, institution]),
    ).toThrow("Duplicate institution id: uhn");
  });

  it("rejects a reversed record period", () => {
    const invalidCampaign: RecordsCampaign = {
      ...nursingAgencySpendingCampaign,
      recordsPeriod: { start: "2025-04-01", end: "2024-03-31" },
    };
    expect(() => generateFilingPlan(invalidCampaign, [])).toThrow(
      "Campaign record start date must not be after its end date.",
    );
  });

  it("rejects an invalid fee instead of silently budgeting it", () => {
    const invalidInstitution: Institution = {
      ...ontarioHospitalInstitutions[0],
      applicationFeeCents: -1,
    };
    expect(() => generateFilingPlan(nursingAgencySpendingCampaign, [invalidInstitution])).toThrow(
      "Invalid application fee for University Health Network.",
    );
  });
});

describe("buildRequestBody", () => {
  it("includes all sections and privacy exclusions", () => {
    const body = buildRequestBody(
      nursingAgencySpendingCampaign,
      ontarioHospitalInstitutions[0],
    );
    expect(body).toContain("1. Agency spending summary");
    expect(body).toContain("2. Hours and rates");
    expect(body).toContain("3. Vendor agreements");
    expect(body).toContain("Patient records and patient-identifying information");
    expect(body).toContain("fee estimate before incurring fees beyond the application fee");
  });
});
