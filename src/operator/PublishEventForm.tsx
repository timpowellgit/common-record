import { FormEvent, useState } from "react";
import { operatorDisplayName, publishPublicTimelineEvent } from "../data/timeline-store";
import {
  publicTimelineEventTypes,
  type PublicTimelineEventType,
} from "../domain/timeline";
import { timelineEventTypeLabel } from "../i18n";

type PublishEventFormProps = {
  campaignId: string;
  requestRef?: string | null;
  onPublished?: (title: string) => void;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PublishEventForm({
  campaignId,
  requestRef = null,
  onPublished,
}: PublishEventFormProps) {
  const [type, setType] = useState<PublicTimelineEventType>("submitted-and-delivered");
  const [occurredOn, setOccurredOn] = useState(today());
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState(false);
  const [publishedMessage, setPublishedMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const published = publishPublicTimelineEvent({
      campaignId,
      requestRef,
      type,
      occurredOn,
      title,
      detail,
      approvedBy: operatorDisplayName,
    });
    if (!published) {
      setError(true);
      setPublishedMessage("");
      return;
    }
    setError(false);
    setPublishedMessage(`Published: ${published.title}`);
    onPublished?.(published.title);
    setTitle("");
    setDetail("");
  }

  return (
    <form className="operator-publish" onSubmit={submit}>
      <span className="operator-eyebrow">Publish a public timeline update</span>
      <p className="operator-publish-warning">
        Only write information that is already public. Requester identity,
        contact details, and internal notes must never appear here.
      </p>
      <label>
        Event type
        <select
          value={type}
          onChange={(event) => setType(event.target.value as PublicTimelineEventType)}
        >
          {publicTimelineEventTypes.map((eventType) => (
            <option key={eventType} value={eventType}>
              {timelineEventTypeLabel(eventType)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Date
        <input
          type="date"
          value={occurredOn}
          onChange={(event) => setOccurredOn(event.target.value)}
        />
      </label>
      <label>
        Public title
        <input
          required
          value={title}
          placeholder="One clear sentence"
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Public detail (optional)
        <textarea
          value={detail}
          placeholder="Context a member of the public would need"
          onChange={(event) => setDetail(event.target.value)}
        />
      </label>
      <button type="submit">Publish update</button>
      {error && (
        <p className="operator-gate-error" role="alert">
          A title and a valid date are required.
        </p>
      )}
      {publishedMessage && (
        <p className="operator-publish-success" role="status">
          {publishedMessage}
        </p>
      )}
    </form>
  );
}
