import { useState } from "react";
import {
  buildPrintableLetter,
  emptyRequesterDetails,
  filingPackageReady,
  formatFeeCents,
  preflightChecks,
  type PreflightState,
  type RequesterDetails,
} from "../domain/filing-package";
import type { FilingRequest } from "../domain/filing-plan";
import { PublishEventForm } from "./PublishEventForm";
import type { OperatorRequest } from "./types";

type FilingPackageProps = {
  request: OperatorRequest;
  planRequest: FilingRequest | undefined;
  onPreflightChange: (preflight: PreflightState) => void;
  onPublicUpdate: (title: string) => void;
  allowPrinting?: boolean;
};

function submissionSummary(planRequest: FilingRequest) {
  const submission = planRequest.submission;
  if (submission.kind === "mail") {
    return { route: "Postal mail", destination: submission.address };
  }
  if (submission.kind === "email") {
    return { route: "Email", destination: submission.email };
  }
  return { route: "Online portal", destination: submission.url };
}

function localToday() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function FilingPackage({
  request,
  planRequest,
  onPreflightChange,
  onPublicUpdate,
  allowPrinting = true,
}: FilingPackageProps) {
  const [requester, setRequester] = useState<RequesterDetails>(emptyRequesterDetails);
  const [showLetter, setShowLetter] = useState(false);

  if (!planRequest) {
    return (
      <details className="operator-package">
        <summary>Filing package</summary>
        <p className="operator-package-note">
          No filing plan draft matches this request, so no letter can be
          generated.
        </p>
      </details>
    );
  }

  const submission = allowPrinting
    ? submissionSummary(planRequest)
    : { route: request.filingMethod, destination: request.filingDestination };
  const preflight: PreflightState = request.preflight ?? {};
  const today = localToday();
  const routeResearchCurrent = planRequest.routeStatus === "verified" &&
    planRequest.feeStatus === "verified" &&
    planRequest.verifiedOn <= today && today <= planRequest.expiresOn;
  const ready = filingPackageReady(preflight, requester, planRequest, today);

  const letter = showLetter && ready
    ? buildPrintableLetter(planRequest, requester, today)
    : null;

  return (
    <details className="operator-package">
      <summary>Filing package</summary>
      <div className="operator-package-grid">
        <fieldset className="operator-preflight">
          <legend>Preflight checklist</legend>
          <p className="operator-package-note">
            Every check must be completed before approval. Route and fee
            confirmations are valid for today only.
          </p>
          {!allowPrinting && <p className="operator-package-note">The route below comes from the database. The linked research is a bundled reference draft; check the official source before confirming anything.</p>}
          <p className="operator-package-note">
            Route research checked {planRequest.verifiedOn}; review due {planRequest.expiresOn}.{" "}
            <a href={planRequest.sourceUrl} target="_blank" rel="noreferrer">
              Check the official source
            </a>
            .
          </p>
          {!routeResearchCurrent && (
            <p className="operator-gate-error" role="alert">
              Route research is unverified or past its review date. Check the official source and update the reviewed route data before printing.
            </p>
          )}
          {preflightChecks.map((check) => (
            <label key={check.id}>
              <input
                type="checkbox"
                checked={preflight[check.id] === true &&
                  (check.id === "route" ? preflight.routeConfirmedOn === today :
                    check.id === "fee" ? preflight.feeConfirmedOn === today : true)}
                disabled={!routeResearchCurrent && (check.id === "route" || check.id === "fee")}
                onChange={(event) => {
                  const next = { ...preflight, [check.id]: event.target.checked };
                  if (check.id === "route") next.routeConfirmedOn = event.target.checked ? today : undefined;
                  if (check.id === "fee") next.feeConfirmedOn = event.target.checked ? today : undefined;
                  setShowLetter(false);
                  onPreflightChange(next);
                }}
              />
              <span>{check.label}</span>
            </label>
          ))}
          <p className="operator-package-destination">
            <strong>{submission.route}</strong>
            <span>{submission.destination}</span>
            {planRequest.submission.instructions && (
              <small>{planRequest.submission.instructions}</small>
            )}
            <small>
              Estimated application fee:{" "}
              {formatFeeCents(planRequest.estimatedApplicationFeeCents)}
            </small>
          </p>
        </fieldset>

        {allowPrinting && <fieldset className="operator-requester">
          <legend>Requester details (private)</legend>
          <p className="operator-package-note">
            Used only to build the printed letter. These fields are never saved
            to browser storage and never published.
          </p>
          <label>
            Full name
            <input
              value={requester.name}
              onChange={(event) =>
                setRequester({ ...requester, name: event.target.value })
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={requester.email}
              onChange={(event) =>
                setRequester({ ...requester, email: event.target.value })
              }
            />
          </label>
          <label>
            Phone
            <input
              value={requester.phone}
              onChange={(event) =>
                setRequester({ ...requester, phone: event.target.value })
              }
            />
          </label>
          <label>
            Mailing address
            <textarea
              value={requester.mailingAddress}
              onChange={(event) =>
                setRequester({ ...requester, mailingAddress: event.target.value })
              }
            />
          </label>
        </fieldset>}
      </div>

      {allowPrinting ? <div className="operator-package-actions">
        <button type="button" disabled={!ready} onClick={() => setShowLetter(filingPackageReady(preflight, requester, planRequest, localToday()))}>
          Print request letter
        </button>
        {!ready && (
          <span className="operator-package-note">
            {routeResearchCurrent
              ? "Confirm the route and fee today, then complete the remaining checklist and requester details."
              : "Verify or refresh route research before printing."}
          </span>
        )}
      </div> : <p className="operator-package-note">Printing is disabled on the live staff site until request letters and filing routes come from the current server record. This checklist does not submit anything.</p>}

      <PublishEventForm
        campaignId={request.campaignId}
        requestRef={request.id}
        onPublished={onPublicUpdate}
      />

      {showLetter && letter && (
        <div className="letter-overlay" role="presentation" onMouseDown={() => setShowLetter(false)}>
          <div className="letter-dialog" role="dialog" aria-modal="true" aria-label="Request letter preview" onMouseDown={(event) => event.stopPropagation()}>
            <div className="letter-actions">
              <button type="button" onClick={() => {
                if (filingPackageReady(preflight, requester, planRequest, localToday())) window.print();
                else setShowLetter(false);
              }}>
                Print
              </button>
              <button type="button" onClick={() => setShowLetter(false)}>
                Close
              </button>
            </div>
            <div className="letter-sheet" id="letter-sheet">
              <pre>{letter}</pre>
            </div>
          </div>
        </div>
      )}
    </details>
  );
}
