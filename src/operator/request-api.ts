import type { PreflightState } from "../domain/filing-package";
import type { OperatorRequest, RequestStatus } from "./types";

type ServerRequest = Omit<OperatorRequest, "applicationFee" | "quotedFee" | "filedAt" | "dueAt"> & {
  applicationFeeCents: number;
  quotedFeeCents: number | null;
  filedOn: string | null;
  dueOn: string | null;
  version: number;
};

export type RequestWrite = {
  version: number;
  status?: RequestStatus;
  preflight?: PreflightState;
  note?: string;
};

export type RequestApiResult<T> =
  | { status: "ok"; value: T }
  | { status: "conflict"; message: string }
  | { status: "error"; message: string };

function fromServer(request: ServerRequest): OperatorRequest {
  return {
    ...request,
    applicationFee: request.applicationFeeCents / 100,
    quotedFee: request.quotedFeeCents === null ? null : request.quotedFeeCents / 100,
    filedAt: request.filedOn,
    dueAt: request.dueOn,
  };
}

async function errorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Request failed (${response.status}).`;
}

export async function listOperatorRequests(campaignId: string): Promise<RequestApiResult<OperatorRequest[]>> {
  try {
    const response = await fetch(`/api/operator/campaigns/${encodeURIComponent(campaignId)}/requests`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return { status: "error", message: await errorMessage(response) };
    const body = (await response.json()) as { requests?: ServerRequest[] };
    if (!Array.isArray(body.requests)) return { status: "error", message: "The request list was incomplete." };
    return { status: "ok", value: body.requests.map(fromServer) };
  } catch {
    return { status: "error", message: "The request list is unavailable. Nothing was changed." };
  }
}

export async function patchOperatorRequest(
  campaignId: string,
  requestId: string,
  write: RequestWrite,
): Promise<RequestApiResult<OperatorRequest>> {
  try {
    const response = await fetch(
      `/api/operator/campaigns/${encodeURIComponent(campaignId)}/requests/${encodeURIComponent(requestId)}`,
      {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(write),
      },
    );
    if (response.status === 409) return { status: "conflict", message: "This request changed elsewhere. Reload to see the current version." };
    if (!response.ok) return { status: "error", message: await errorMessage(response) };
    const body = (await response.json()) as { request?: ServerRequest };
    if (!body.request) return { status: "error", message: "The server did not confirm the edit." };
    return { status: "ok", value: fromServer(body.request) };
  } catch {
    return { status: "error", message: "The edit could not reach the server. Nothing was saved." };
  }
}
