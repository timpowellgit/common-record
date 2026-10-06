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
  const { requests, updateRequest, resetRequests } = useOperatorRequests(
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
    }
    return map;
  }, []);

  return (
    <section className="operator-shell" aria-labelledby="operator-title">
      <header className="operator-header">
        <div>
          <p className="operator-eyebrow">Private workflow prototype</p>
          <h1 id="operator-title">Request operations</h1>
          <p>
            Changes stay in this browser, including published timeline updates
            until the production database exists. Nothing here files a request,
            sends a message, or collects a fee.
          </p>
        </div>
        <button className="operator-reset" type="button" onClick={resetRequests}>
          Reset demo data
        </button>
      </header>

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
                  onChange={(event) => {
                    const status = event.target.value as RequestStatus;
                    updateRequest(
                      request.id,
                      { status },
                      `Status changed to ${statusLabels[status]}.`,
                    );
                  }}
                >
                  {requestStatuses.map((status) => (
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
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    updateRequest(
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
                  onChange={(event) =>
                    updateRequest(
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
                  onChange={(event) =>
                    updateRequest(
                      request.id,
                      { dueAt: event.target.value || null },
                      "Due date updated.",
                    )
                  }
                />
              </label>
            </div>

            <label className="operator-notes">
              Operator notes
              <textarea
                value={request.operatorNotes}
                onChange={(event) =>
                  updateRequest(
                    request.id,
                    { operatorNotes: event.target.value },
                    "Operator notes updated.",
                  )
                }
              />
            </label>

            <FilingPackage
              request={request}
              planRequest={planRequestById.get(request.id)}
              onPreflightChange={(preflight) =>
                updateRequest(
                  request.id,
                  { preflight },
                  "Filing package preflight updated.",
                )
              }
              onPublicUpdate={(title) =>
                updateRequest(
                  request.id,
                  {},
                  `Public timeline update published: ${title}`,
                )
              }
            />

            <details className="operator-history">
              <summary>Local activity ({request.activity.length})</summary>
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
    </section>
  );
}
