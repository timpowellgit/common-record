import { useEffect, useMemo, useState } from "react";
import { loadPublicTimeline, subscribeToPublicTimeline } from "../data/timeline-store";
import { campaignTimeline, type PublicTimelineEvent } from "../domain/timeline";
import { t, timelineEventTypeLabel, type Locale } from "../i18n";

type PublicTimelineProps = {
  campaignId: string;
  locale?: Locale;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

export function PublicTimeline({ campaignId, locale = "en" }: PublicTimelineProps) {
  const [events, setEvents] = useState<PublicTimelineEvent[]>(() =>
    loadPublicTimeline(),
  );

  useEffect(
    () => subscribeToPublicTimeline(() => setEvents(loadPublicTimeline())),
    [],
  );

  const timeline = useMemo(
    () => campaignTimeline(events, campaignId),
    [events, campaignId],
  );

  if (timeline.length === 0) {
    return (
      <div className="campaign-timeline empty">
        <span className="mini-label">{t("timeline.heading", locale)}</span>
        <p>{t("timeline.empty", locale)}</p>
      </div>
    );
  }

  return (
    <section className="campaign-timeline" aria-label={t("timeline.heading", locale)}>
      <header>
        <span className="mini-label">{t("timeline.heading", locale)}</span>
        <p>{t("timeline.intro", locale)}</p>
      </header>
      <ol className="timeline-list">
        {timeline.map((event) => (
          <li key={event.id}>
            <span className="timeline-date">{formatDate(event.occurredOn)}</span>
            <div className="timeline-entry">
              <strong>{event.title}</strong>
              {event.detail && <p>{event.detail}</p>}
              <span className="timeline-meta">
                {timelineEventTypeLabel(event.type, locale)}
                {event.requestRef
                  ? ` · ${t("timeline.requestLabel", locale)}: ${event.requestRef}`
                  : ""}
                {" · "}
                {t("timeline.verifiedBy", locale, { name: event.approvedBy })}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
