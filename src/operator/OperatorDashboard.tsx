import { useMemo, useState } from "react";
import { demoNursingAgencyFilingPlan } from "../data/demo-filing-plan";
import { FilingPackage } from "./FilingPackage";
import { demoOperatorRequests } from "./demoRequests";
import { PublishEventForm } from "./PublishEventForm";
import { useOperatorRequests } from "./useOperatorRequests";
import {
  requestStatuses,
  type OperatorRequest,
  type RequestStatus,
} from "./types";
import "./operator.css";

type OperatorDashboardProps = {
  initialRequests?: OperatorRequest[];
  storageKey?: string;
};

const statusLabels: Record<RequestStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  filed: "Filed",
  "fee-review": "Fee review",
  overdue: "Overdue",
  received: "Received",
  published: "Published",
};

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

export function OperatorDashboard({
  initialRequests = demoOperatorRequests,
  storageKey,
}: OperatorDashboardProps) {
  const { requests, updateRequest, resetRequests, reloadRequests, mode, error, pendingId } = useOperatorRequests(
    initialRequests,
    storageKey,
  );
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const visibleRequests = useMemo(
    () =>
      filter === "all"
        ? requests
        : requests.filter((request) => request.status === filter),
    [filter, requests],
  );
  const planRequestById = useMemo(() => {
    const map = new Map<string, (typeof demoNursingAgencyFilingPlan.requests)[number]>();
    for (const planRequest of demoNursingAgencyFilingPlan.requests) {
      map.set(planRequest.id, planRequest);
      map.set(planRequest.institutionName, planRequest);
    }
    return map;
  }, []);

  return (
    <section className="operator-shell" aria-labelledby="operator-title">
      <header className="operator-header">
        <div>
          <p className="operator-eyebrow">{mode === "demo" ? "Private workflow prototype" : "Staff workflow"}</p>
          <h1 id="operator-title">Request operations</h1>
          <p>{mode === "demo"
            ? "Request edits stay in this browser. Timeline updates try the authenticated API. Nothing here files a request, sends a message, or collects a fee."
            : "Request drafts and preflight checks are saved to the server after confirmation. Nothing here files a request, sends a message, or collects a fee."}</p>
        </div>
        {mode === "demo" && <button className="operator-reset" type="button" onClick={resetRequests}>Reset demo data</button>}
      </header>

      {mode === "loading" && <p role="status">Loading the current request records…</p>}
      {error && <p className="operator-gate-error" role="alert">{error}</p>}
      {mode === "error" && <button type="button" onClick={() => void reloadRequests()}>Retry loading requests</button>}

      {(mode === "demo" || mode === "server") && <>

      <div className="operator-summary" aria-label="Request summary">
        <strong>{requests.length}</strong> requests ·{" "}
        <strong>{requests.filter((request) => request.status === "filed").length}</strong>{" "}
        filed ·{" "}
        <strong>
          {requests.filter((request) => request.status === "fee-review").length}
        </strong>{" "}
        awaiting fee review
      </div>

      <label className="operator-filter">
        Show status
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as RequestStatus | "all")
          }
        >
          <option value="all">All requests</option>
          {requestStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <details className="operator-campaign-updates">
        <summary>Publish a campaign-level public update</summary>
        <PublishEventForm
          campaignId={demoNursingAgencyFilingPlan.campaign.id}
          requestRef={null}
        />
      </details>

      <div className="operator-list">
        {visibleRequests.map((request) => (
          <article className="operator-card" key={request.id}>
            <div className="operator-card-heading">
              <div>
                <span>{request.campaignTitle}</span>
                <h2>{request.institution}</h2>
              </div>
              <span className={`operator-status status-${request.status}`}>
                {statusLabels[request.status]}
              </span>
            </div>

            <dl className="operator-facts">
              <div>
                <dt>Filing route</dt>
                <dd>{request.filingMethod}</dd>
              </div>
              <div>
                <dt>Application fee</dt>
                <dd>{currency(request.applicationFee)}</dd>
              </div>
              <div>
                <dt>Filed</dt>
                <dd>{formatDate(request.filedAt)}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd>{formatDate(request.dueAt)}</dd>
              </div>
            </dl>

            <div className="operator-fields">
              <label>
                Status
                <select
                  value={request.status}
                  disabled={pendingId === request.id || (mode === "server" && request.status !== "draft" && request.status !== "approved")}
                  onChange={(event) => {
                    const status = event.target.value as RequestStatus;
                    void updateRequest(
                      request.id,
                      { status },
                      `Status changed to ${statusLabels[status]}.`,
                    );
                  }}
                >
                  {(mode === "demo" || (request.status !== "draft" && request.status !== "approved")
                    ? requestStatuses
                    : requestStatuses.filter((status) => status === "draft" || status === "approved")).map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quoted fee (CAD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={request.quotedFee ?? ""}
                  placeholder="None"
                  disabled={mode !== "demo"}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    void updateRequest(
                      request.id,
                      { quotedFee: nextValue === "" ? null : Number(nextValue) },
                      nextValue === ""
                        ? "Quoted fee cleared."
                        : `Quoted fee set to ${currency(Number(nextValue))}.`,
                    );
                  }}
                />
              </label>
              <label>
                Filed date
                <input
                  type="date"
                  value={request.filedAt ?? ""}
                  disabled={mode !== "demo"}
                  onChange={(event) =>
                    void updateRequest(
                      request.id,
                      { filedAt: event.target.value || null },
                      "Filed date updated.",
                    )
                  }
                />
              </label>
              <label>
                Due date
                <input
                  type="date"
                  value={request.dueAt ?? ""}
                  disabled={mode !== "demo"}
                  onChange={(event) =>
                    void updateRequest(
                      request.id,
                      { dueAt: event.target.value || null },
                      "Due date updated.",
                    )
                  }
                />
              </label>
            </div>

            {mode === "demo" ? <label className="operator-notes">
              Operator notes
              <textarea value={request.operatorNotes} onChange={(event) =>
                void updateRequest(request.id, { operatorNotes: event.target.value }, "Operator notes updated.")
              } />
            </label> : <OperatorNoteEditor request={request} disabled={pendingId === request.id} onSave={(note) => updateRequest(request.id, { operatorNotes: note }, "Operator note added.")} />}

            <FilingPackage
              request={request}
              planRequest={planRequestById.get(request.id) ?? planRequestById.get(request.institution)}
              allowPrinting={mode === "demo"}
              onPreflightChange={(preflight) =>
                void updateRequest(
                  request.id,
                  { preflight },
                  "Filing package preflight updated.",
                )
              }
              onPublicUpdate={(title) =>
                void updateRequest(
                  request.id,
                  {},
                  `Public timeline update published: ${title}`,
                )
              }
            />

            <details className="operator-history">
              <summary>{mode === "demo" ? "Local activity" : "Recorded activity"} ({request.activity.length})</summary>
              <ol>
                {request.activity.map((event) => (
                  <li key={event.id}>
                    <span>{new Date(event.at).toLocaleString("en-CA")}</span>
                    {event.message}
                  </li>
                ))}
              </ol>
            </details>
          </article>
        ))}
      </div>
      </>}
    </section>
  );
}

function OperatorNoteEditor({
  request,
  disabled,
  onSave,
}: {
  request: OperatorRequest;
  disabled: boolean;
  onSave: (note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  return <div className="operator-notes">
    <p><strong>Operator notes</strong></p>
    <p>{request.operatorNotes || "No notes yet."}</p>
    <label>Add a note
      <textarea value={note} disabled={disabled} onChange={(event) => setNote(event.target.value)} />
    </label>
    <button type="button" disabled={disabled || !note.trim()} onClick={() => {
      void onSave(note.trim()).then((saved) => { if (saved) setNote(""); });
    }}>Save note</button>
  </div>;
}
