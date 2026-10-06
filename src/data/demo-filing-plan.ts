import { generateFilingPlan } from "../domain/filing-plan";
import {
  nursingAgencySpendingCampaign,
  ontarioHospitalInstitutions,
} from "./ontario-nursing-agency-demo";

export const demoNursingAgencyFilingPlan = generateFilingPlan(
  nursingAgencySpendingCampaign,
  ontarioHospitalInstitutions,
);
