import type { PreflightState } from "../domain/filing-package";

export const requestStatuses = [
  "draft",
  "approved",
  "filed",
  "fee-review",
  "overdue",
  "received",
  "published",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export type RequestActivity = {
  id: string;
  at: string;
  message: string;
};

export type OperatorRequest = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  institution: string;
  filingMethod: string;
  filingDestination: string;
  status: RequestStatus;
  applicationFee: number;
  quotedFee: number | null;
  filedAt: string | null;
  dueAt: string | null;
  operatorNotes: string;
  updatedAt: string;
  version?: number;
  activity: RequestActivity[];
  preflight?: PreflightState;
};

export type OperatorRequestPatch = Partial<
  Pick<
    OperatorRequest,
    | "status"
    | "quotedFee"
    | "filedAt"
    | "dueAt"
    | "operatorNotes"
    | "preflight"
  >
>;
