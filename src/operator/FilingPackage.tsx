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

export function FilingPackage({
  request,
  planRequest,
  onPreflightChange,
  onPublicUpdate,
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

  const submission = submissionSummary(planRequest);
  const preflight: PreflightState = request.preflight ?? {};
  const ready = filingPackageReady(preflight, requester, planRequest.submission.kind);

  const letter = showLetter
    ? buildPrintableLetter(planRequest, requester, new Date().toISOString().slice(0, 10))
    : null;

  return (
    <details className="operator-package">
      <summary>Filing package</summary>
      <div className="operator-package-grid">
        <fieldset className="operator-preflight">
          <legend>Preflight checklist</legend>
          <p className="operator-package-note">
            Every check must be completed before the request letter can be
            printed.
          </p>
          {preflightChecks.map((check) => (
            <label key={check.id}>
              <input
                type="checkbox"
                checked={preflight[check.id] === true}
                onChange={(event) =>
                  onPreflightChange({ ...preflight, [check.id]: event.target.checked })
                }
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

        <fieldset className="operator-requester">
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
        </fieldset>
      </div>

      <div className="operator-package-actions">
        <button type="button" disabled={!ready} onClick={() => setShowLetter(true)}>
          Print request letter
        </button>
        {!ready && (
          <span className="operator-package-note">
            Complete the preflight checklist and requester details to enable
            printing.
          </span>
        )}
      </div>

      <PublishEventForm
        campaignId={request.campaignId}
        requestRef={request.institution}
        onPublished={onPublicUpdate}
      />

      {showLetter && letter && (
        <div className="letter-overlay" role="presentation" onMouseDown={() => setShowLetter(false)}>
          <div className="letter-dialog" role="dialog" aria-modal="true" aria-label="Request letter preview" onMouseDown={(event) => event.stopPropagation()}>
            <div className="letter-actions">
              <button type="button" onClick={() => window.print()}>
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
