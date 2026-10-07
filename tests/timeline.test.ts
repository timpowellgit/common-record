import { describe, expect, it } from "vitest";
import {
  campaignTimeline,
  createPublicTimelineEvent,
  isPublicTimelineEvent,
  selectTimelineSource,
  publicTimelineEventTypes,
  type PublicTimelineEvent,
} from "../src/domain/timeline";

function validEvent(overrides: Partial<PublicTimelineEvent> = {}): PublicTimelineEvent {
  return {
    id: "event-1",
    campaignId: "agency-nursing-2022-26-pilot",
    requestRef: null,
    type: "submitted-and-delivered",
    occurredOn: "2026-10-05",
    title: "Request filed with UHN",
    detail: "The application fee was enclosed.",
    approvedBy: "Tim Powell",
    approvedAt: "2026-10-05T16:00:00.000Z",
    ...overrides,
  };
}

describe("isPublicTimelineEvent", () => {
  it("accepts a complete approved event", () => {
    expect(isPublicTimelineEvent(validEvent())).toBe(true);
  });

  it("rejects an event without an approver", () => {
    expect(isPublicTimelineEvent(validEvent({ approvedBy: "" }))).toBe(false);
  });

  it("rejects an event without an approval time", () => {
    expect(isPublicTimelineEvent(validEvent({ approvedAt: "" }))).toBe(false);
  });

  it("rejects an event with a non-public type", () => {
    expect(
      isPublicTimelineEvent(validEvent({ type: "operator-note" as never })),
    ).toBe(false);
  });

  it("rejects an event with a malformed date", () => {
    expect(isPublicTimelineEvent(validEvent({ occurredOn: "2026/10/05" }))).toBe(false);
  });
});

describe("campaignTimeline", () => {
  it("returns only approved events for the campaign in date order", () => {
    const events = [
      validEvent({ id: "b", occurredOn: "2026-10-07", title: "Second" }),
      validEvent({ id: "a", occurredOn: "2026-10-01", title: "First" }),
      validEvent({ id: "c", campaignId: "other-campaign" }),
      { notAnEvent: true },
    ];

    const timeline = campaignTimeline(events, "agency-nursing-2022-26-pilot");
    expect(timeline.map((event) => event.id)).toEqual(["a", "b"]);
  });

  it("sorts same-day events by approval time", () => {
    const timeline = campaignTimeline(
      [
        validEvent({ id: "late", approvedAt: "2026-10-05T18:00:00.000Z" }),
        validEvent({ id: "early", approvedAt: "2026-10-05T09:00:00.000Z" }),
      ],
      "agency-nursing-2022-26-pilot",
    );
    expect(timeline.map((event) => event.id)).toEqual(["early", "late"]);
  });
});

describe("createPublicTimelineEvent", () => {
  it("creates an event with a generated id and approval time", () => {
    const event = createPublicTimelineEvent({
      campaignId: "agency-nursing-2022-26-pilot",
      requestRef: "University Health Network",
      type: "submitted-and-delivered",
      occurredOn: "2026-10-06",
      title: "  Request filed with UHN  ",
      detail: "  ",
      approvedBy: "Common Record operator",
    });

    expect(event).not.toBeNull();
    expect(event?.title).toBe("Request filed with UHN");
    expect(event?.detail).toBeNull();
    expect(event?.requestRef).toBe("University Health Network");
    expect(event?.id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(event?.approvedAt ?? ""))).toBe(false);
  });

  it("rejects input missing a title, date, or approver", () => {
    const base = {
      campaignId: "agency-nursing-2022-26-pilot",
      requestRef: null as string | null,
      type: "submitted-and-delivered" as const,
      detail: null,
    };
    expect(createPublicTimelineEvent({ ...base, occurredOn: "2026-10-06", title: "", approvedBy: "x" })).toBeNull();
    expect(createPublicTimelineEvent({ ...base, occurredOn: "bad", title: "T", approvedBy: "x" })).toBeNull();
    expect(createPublicTimelineEvent({ ...base, occurredOn: "2026-10-06", title: "T", approvedBy: " " })).toBeNull();
  });

  it("covers the public event vocabulary", () => {
    expect(publicTimelineEventTypes).toContain("records-released");
    expect(publicTimelineEventTypes).toContain("submitted-and-delivered");
    expect(publicTimelineEventTypes).not.toContain("note");
  });
});

describe("selectTimelineSource", () => {
  it("shows only database events when the database is available", () => {
    const local = [
      validEvent({ id: "shared", title: "Local version", occurredOn: "2026-10-04" }),
      validEvent({ id: "local-only", occurredOn: "2026-10-08" }),
    ];
    const database = [
      validEvent({ id: "db-only", occurredOn: "2026-10-02" }),
      validEvent({ id: "shared", title: "Database version", occurredOn: "2026-10-04" }),
    ];

    const selected = selectTimelineSource(database, local);
    expect(selected.map((event) => event.id)).toEqual(["db-only", "shared"]);
    expect(selected[1].title).toBe("Database version");
    expect(selectTimelineSource([], local)).toEqual([]);
  });

  it("returns local events unchanged when the database is unavailable", () => {
    const local = [validEvent()];
    expect(selectTimelineSource(null, local)).toEqual([validEvent()]);
  });
});
