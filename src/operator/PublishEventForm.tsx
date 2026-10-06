import { FormEvent, useState } from "react";
import { operatorDisplayName, publishPublicTimelineEvent } from "../data/timeline-store";
import {
  publicTimelineEventTypes,
  type PublicTimelineEventType,
} from "../domain/timeline";
import { timelineEventTypeLabel } from "../i18n";
import { createOperatorEvent } from "../public/operator-api";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [publishedMessage, setPublishedMessage] = useState("");

  function publishLocally(): boolean {
    const published = publishPublicTimelineEvent({
      campaignId,
      requestRef,
      type,
      occurredOn,
      title,
      detail,
      approvedBy: operatorDisplayName,
    });
    if (!published) return false;
    setPublishedMessage(`Published: ${published.title}`);
    onPublished?.(published.title);
    setTitle("");
    setDetail("");
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    // Prefer the authenticated API. If it is unreachable or Access is not
    // configured, fall back to the local prototype store.
    const result = await createOperatorEvent({
      campaignId,
      requestRef,
      type,
      occurredOn,
      title,
      detail,
    });

    if (result.status === "created") {
      setPublishedMessage(`Published: ${title}`);
      onPublished?.(title);
      setTitle("");
      setDetail("");
      return;
    }
    if (result.status === "rejected") {
      setErrorMessage(result.message);
      setPublishedMessage("");
      return;
    }
    if (!publishLocally()) {
      setErrorMessage("A title and a valid date are required.");
      setPublishedMessage("");
    }
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
      {errorMessage && (
        <p className="operator-gate-error" role="alert">
          {errorMessage}
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
