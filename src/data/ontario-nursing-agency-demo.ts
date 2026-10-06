import type { Institution, RecordsCampaign } from "../domain/filing-plan";

/**
 * Demonstration data for product development, not a filing directory.
 * Contacts, portal URLs, coverage, and fees require official-source verification.
 */
export const ontarioHospitalInstitutions: readonly Institution[] = [
  {
    id: "uhn",
    name: "University Health Network",
    shortName: "UHN",
    jurisdiction: "Ontario",
    institutionType: "hospital",
    freedomOfInformationOfficeName: "Freedom of Information and Privacy Office",
    submission: {
      kind: "online-portal",
      url: "https://www.uhn.ca/corporate/AboutUHN/Governance/Pages/freedom_information.aspx",
      instructions: "Demo link to the institution's FOI information page; verify the current filing route.",
    },
    applicationFeeCents: 500,
    feeStatus: "needs-verification",
    contactStatus: "needs-verification",
    verificationNote: "Demo entry. Verify UHN's current form, submission channel, and fee before use.",
  },
  {
    id: "sunnybrook",
    name: "Sunnybrook Health Sciences Centre",
    shortName: "Sunnybrook",
    jurisdiction: "Ontario",
    institutionType: "hospital",
    freedomOfInformationOfficeName: "Freedom of Information and Privacy Office",
    submission: {
      kind: "online-portal",
      url: "https://sunnybrook.ca/content/?page=freedom-information",
      instructions: "Demo link to the institution's FOI information page; verify the current filing route.",
    },
    applicationFeeCents: 500,
    feeStatus: "needs-verification",
    contactStatus: "needs-verification",
    verificationNote: "Demo entry. Verify Sunnybrook's current form, submission channel, and fee before use.",
  },
  {
    id: "unity-health-toronto",
    name: "Unity Health Toronto",
    shortName: "Unity Health",
    jurisdiction: "Ontario",
    institutionType: "hospital",
    freedomOfInformationOfficeName: "Freedom of Information and Privacy Office",
    submission: {
      kind: "online-portal",
      url: "https://unityhealth.to/about-unity-health/accountability/freedom-of-information/",
      instructions: "Demo link to the institution's FOI information page; verify the current filing route.",
    },
    applicationFeeCents: 500,
    feeStatus: "needs-verification",
    contactStatus: "needs-verification",
    verificationNote: "Demo entry. Verify Unity Health's current form, submission channel, and fee before use.",
  },
  {
    id: "hamilton-health-sciences",
    name: "Hamilton Health Sciences",
    shortName: "HHS",
    jurisdiction: "Ontario",
    institutionType: "hospital",
    freedomOfInformationOfficeName: "Freedom of Information Office",
    submission: {
      kind: "online-portal",
      url: "https://www.hamiltonhealthsciences.ca/about-us/our-organization/accountability/freedom-of-information/",
      instructions: "Demo link to the institution's FOI information page; verify the current filing route.",
    },
    applicationFeeCents: 500,
    feeStatus: "needs-verification",
    contactStatus: "needs-verification",
    verificationNote: "Demo entry. Verify HHS's current form, submission channel, and fee before use.",
  },
  {
    id: "the-ottawa-hospital",
    name: "The Ottawa Hospital",
    shortName: "TOH",
    jurisdiction: "Ontario",
    institutionType: "hospital",
    freedomOfInformationOfficeName: "Freedom of Information and Privacy Office",
    submission: {
      kind: "online-portal",
      url: "https://www.ottawahospital.on.ca/en/about-us/accountability/freedom-of-information/",
      instructions: "Demo link to the institution's FOI information page; verify the current filing route.",
    },
    applicationFeeCents: 500,
    feeStatus: "needs-verification",
    contactStatus: "needs-verification",
    verificationNote: "Demo entry. Verify TOH's current form, submission channel, and fee before use.",
  },
] as const;

export const nursingAgencySpendingCampaign: RecordsCampaign = {
  id: "agency-nursing-2024-25-demo",
  title: "Ontario hospital private nursing agency spending, 2024–25",
  question: "What did a pilot group of Ontario hospitals spend on private nursing agencies?",
  jurisdiction: "Ontario",
  legislation: "FIPPA",
  recordsPeriod: {
    start: "2024-04-01",
    end: "2025-03-31",
  },
  requestSections: [
    {
      id: "spend-summary",
      heading: "Agency spending summary",
      request: "A report or export showing payments or expenditures for temporary nursing personnel supplied by external staffing agencies, broken down by vendor and month where available.",
    },
    {
      id: "hours-and-rates",
      heading: "Hours and rates",
      request: "Records showing agency nursing hours purchased and the hourly or shift rates charged, broken down by vendor and nursing classification where available.",
    },
    {
      id: "contracts",
      heading: "Vendor agreements",
      request: "Executed contracts, standing offers, purchase orders, or rate sheets governing temporary nursing personnel supplied during the records period.",
    },
  ],
  exclusions: [
    "Patient records and patient-identifying information.",
    "Individual staff names, personal contact information, and employee identifiers.",
    "Duplicate copies of records that are identical in substance.",
  ],
  outputDescription: "A normalized vendor-by-hospital dataset, released source records, methodology, and documented gaps.",
  dataStatus: "demo-only",
};
