export const publicTimelineEventTypes = [
  "research-completed",
  "routes-verified",
  "request-filed",
  "acknowledgment-received",
  "fee-estimate-received",
  "fee-paid",
  "response-received",
  "records-published",
] as const;

export type PublicTimelineEventType = (typeof publicTimelineEventTypes)[number];

export type PublicTimelineEvent = {
  id: string;
  campaignId: string;
  requestRef: string | null;
  type: PublicTimelineEventType;
  occurredOn: string;
  title: string;
  detail: string | null;
  approvedBy: string;
  approvedAt: string;
};

export type PublicTimelineEventInput = {
  campaignId: string;
  requestRef: string | null;
  type: PublicTimelineEventType;
  occurredOn: string;
  title: string;
  detail: string | null;
  approvedBy: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isPublicTimelineEventType(value: unknown): value is PublicTimelineEventType {
  return (
    typeof value === "string" &&
    (publicTimelineEventTypes as readonly string[]).includes(value)
  );
}

/**
 * A public event must carry an approver and an approval time, mirroring the
 * database constraint that keeps unapproved events off the public timeline.
 */
export function isPublicTimelineEvent(value: unknown): value is PublicTimelineEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    typeof event.campaignId === "string" &&
    event.campaignId.length > 0 &&
    (event.requestRef === null || typeof event.requestRef === "string") &&
    isPublicTimelineEventType(event.type) &&
    typeof event.occurredOn === "string" &&
    datePattern.test(event.occurredOn) &&
    typeof event.title === "string" &&
    event.title.trim().length > 0 &&
    (event.detail === null || typeof event.detail === "string") &&
    typeof event.approvedBy === "string" &&
    event.approvedBy.trim().length > 0 &&
    typeof event.approvedAt === "string" &&
    !Number.isNaN(Date.parse(event.approvedAt))
  );
}

export function createPublicTimelineEvent(
  input: PublicTimelineEventInput,
): PublicTimelineEvent | null {
  const title = input.title.trim();
  const approvedBy = input.approvedBy.trim();
  if (!datePattern.test(input.occurredOn) || title.length === 0 || approvedBy.length === 0) {
    return null;
  }
  const now = new Date().toISOString();
  return {
    id: `${input.campaignId}:${input.type}:${now}`,
    campaignId: input.campaignId,
    requestRef: input.requestRef,
    type: input.type,
    occurredOn: input.occurredOn,
    title,
    detail: input.detail && input.detail.trim().length > 0 ? input.detail.trim() : null,
    approvedBy,
    approvedAt: now,
  };
}

export function campaignTimeline(
  events: readonly unknown[],
  campaignId: string,
): PublicTimelineEvent[] {
  return events
    .filter(isPublicTimelineEvent)
    .filter((event) => event.campaignId === campaignId)
    .sort(
      (a, b) =>
        a.occurredOn.localeCompare(b.occurredOn) ||
        a.approvedAt.localeCompare(b.approvedAt),
    );
}
