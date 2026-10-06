import {
  createPublicTimelineEvent,
  isPublicTimelineEvent,
  type PublicTimelineEvent,
  type PublicTimelineEventInput,
} from "../domain/timeline";

const STORAGE_KEY = "common-record.public-timeline.v1";
const TIMELINE_CHANGED_EVENT = "common-record:timeline-changed";

export const operatorDisplayName = "Common Record operator";

export const seededPublicTimelineEvents: readonly PublicTimelineEvent[] = [
  {
    id: "seed:agency-nursing:research-completed",
    campaignId: "agency-nursing-2022-26-pilot",
    requestRef: null,
    type: "research-completed",
    occurredOn: "2026-10-05",
    title: "Pilot research completed",
    detail:
      "Filing routes, fees, and request wording researched for five Ontario hospital systems.",
    approvedBy: "Tim Powell",
    approvedAt: "2026-10-05T16:00:00.000Z",
  },
  {
    id: "seed:agency-nursing:routes-verified",
    campaignId: "agency-nursing-2022-26-pilot",
    requestRef: null,
    type: "routes-verified",
    occurredOn: "2026-10-05",
    title: "Filing routes verified against official sources",
    detail:
      "Every route and fee was checked on 2026-10-05. Routes expire after 30 days and must be re-verified before filing.",
    approvedBy: "Tim Powell",
    approvedAt: "2026-10-05T16:00:00.000Z",
  },
];

export function loadPublicTimeline(): PublicTimelineEvent[] {
  if (typeof window === "undefined") {
    return seededPublicTimelineEvents.map((event) => ({ ...event }));
  }
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (Array.isArray(stored)) {
      const events = stored.filter(isPublicTimelineEvent);
      if (events.length > 0) return events;
    }
  } catch {
    // Corrupt storage falls back to the seeded timeline.
  }
  return seededPublicTimelineEvents.map((event) => ({ ...event }));
}

export function publishPublicTimelineEvent(
  input: PublicTimelineEventInput,
): PublicTimelineEvent | null {
  const event = createPublicTimelineEvent(input);
  if (!event || typeof window === "undefined") return event;
  const events = loadPublicTimeline();
  events.push(event);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent(TIMELINE_CHANGED_EVENT));
  return event;
}

export function subscribeToPublicTimeline(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(TIMELINE_CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(TIMELINE_CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function resetPublicTimeline(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(TIMELINE_CHANGED_EVENT));
}
