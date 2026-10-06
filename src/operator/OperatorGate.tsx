import { FormEvent, ReactNode, useState } from "react";

const SESSION_KEY = "common-record.operator-session.v1";

export const OPERATOR_DEMO_PASSCODE = "pilot-2026";

type OperatorGateProps = {
  children: ReactNode;
};

/**
 * Prototype boundary only: this gate separates the operator workflow from the
 * public site. It is not authentication — the demo passcode lives in a public
 * repository. Production operator access requires staff sign-in with
 * two-factor authentication and server-side role checks.
 */
export function OperatorGate({ children }: OperatorGateProps) {
  const [authorized, setAuthorized] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(SESSION_KEY) === "authorized",
  );
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  if (authorized) return <>{children}</>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passcode === OPERATOR_DEMO_PASSCODE) {
      window.sessionStorage.setItem(SESSION_KEY, "authorized");
      setError(false);
      setAuthorized(true);
      return;
    }
    setError(true);
  }

  return (
    <section className="operator-gate" aria-labelledby="operator-gate-title">
      <p className="operator-eyebrow">Staff workflow prototype</p>
      <h1 id="operator-gate-title">Operator access</h1>
      <p>
        This gate separates the operator workflow from the public site. It is a
        prototype boundary, not real authentication — the demo passcode is
        published in the repository documentation. Production access will
        require staff sign-in with two-factor authentication.
      </p>
      <form onSubmit={submit}>
        <label>
          Demo passcode
          <input
            type="password"
            value={passcode}
            autoComplete="off"
            onChange={(event) => setPasscode(event.target.value)}
          />
        </label>
        <button type="submit">Continue</button>
        {error && (
          <p className="operator-gate-error" role="alert">
            That passcode does not match.
          </p>
        )}
      </form>
      <a className="operator-back" href="#">← Return to public site</a>
    </section>
  );
}
