/**
 * Operator write client. Calls the authenticated Worker endpoint. When the
 * operator API is not reachable or Access is not configured (401/403/503),
 * the caller may use local prototype storage only on explicit demo hosts.
 */

export type CreateOperatorEventInput = {
  campaignId: string;
  requestRef?: string | null;
  type: string;
  occurredOn: string;
  title: string;
  detail?: string;
  visibility?: "public" | "private";
};

export type CreateOperatorEventResult =
  | { status: "created"; id: string }
  | { status: "rejected"; message: string }
  | { status: "unavailable" };

export function allowLocalPrototypeFallback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname === "timpowellgit.github.io";
}

export async function createOperatorEvent(
  input: CreateOperatorEventInput,
): Promise<CreateOperatorEventResult> {
  let response: Response;
  try {
    response = await fetch(
      `/api/operator/campaigns/${encodeURIComponent(input.campaignId)}/events`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: input.type,
          occurredOn: input.occurredOn,
          title: input.title,
          detail: input.detail || undefined,
          requestRef: input.requestRef || undefined,
          visibility: input.visibility ?? "public",
        }),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  if (response.status === 201) {
    const body = (await response.json().catch(() => null)) as { event?: { id?: string } } | null;
    return { status: "created", id: body?.event?.id ?? "" };
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { status: "rejected", message: body?.error ?? "The update was rejected." };
  }

  return { status: "unavailable" };
}
