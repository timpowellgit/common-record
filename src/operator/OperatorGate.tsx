import { FormEvent, ReactNode, useEffect, useState } from "react";
import { allowLocalPrototypeFallback } from "../public/operator-api";

const SESSION_KEY = "common-record.operator-session.v1";

// The passcode is for the local and GitHub Pages prototype only. Production
// ignores it and requires a current server-confirmed Access session.
export const OPERATOR_DEMO_PASSCODE = "pilot-2026";

type OperatorGateProps = {
  children: ReactNode;
};

type AccessState = "checking" | "authorized" | "sign-in" | "forbidden" | "unavailable";

function accessLoginUrl(hostname: string): string {
  return hostname === "www.commonrecord.ca"
    ? "https://commonrecord.ca/api/operator/login"
    : "/api/operator/login";
}

function PrototypeGate({ children }: OperatorGateProps) {
  const [authorized, setAuthorized] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_KEY) === "authorized",
  );
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  if (authorized) return <>{children}</>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passcode === OPERATOR_DEMO_PASSCODE) {
      window.sessionStorage.setItem(SESSION_KEY, "authorized");
      setAuthorized(true);
      return;
    }
    setError(true);
  }

  return (
    <section className="operator-gate" aria-labelledby="operator-gate-title">
      <p className="operator-eyebrow">Local workflow prototype</p>
      <h1 id="operator-gate-title">Operator preview</h1>
      <p>This preview uses demonstration data. Its passcode is a convenience, not staff authentication.</p>
      <form onSubmit={submit}>
        <label>
          Demo passcode
          <input type="password" value={passcode} autoComplete="off"
            onChange={(event) => setPasscode(event.target.value)} />
        </label>
        <button type="submit">Continue</button>
        {error && <p className="operator-gate-error" role="alert">That passcode does not match.</p>}
      </form>
      <a className="operator-back" href="#">← Return to public site</a>
    </section>
  );
}

function AccessGate({ children }: OperatorGateProps) {
  const [state, setState] = useState<AccessState>("checking");

  useEffect(() => {
    let active = true;
    let latestCheck = 0;

    async function checkSession() {
      const check = ++latestCheck;
      let next: AccessState = "sign-in";
      try {
        const response = await fetch("/api/operator/session", {
          credentials: "same-origin",
          cache: "no-store",
          redirect: "manual",
          headers: { Accept: "application/json" },
        });
        if (response.status === 200) {
          const body: unknown = await response.json();
          if (typeof body === "object" && body !== null && "staff" in body) {
            next = "authorized";
          }
        } else if (response.status === 403) {
          next = "forbidden";
        } else if (response.status === 503) {
          next = "unavailable";
        }
      } catch {
        // Access login redirects and network failures cannot authorize a page.
      }
      if (active && check === latestCheck) setState(next);
    }

    function onFocus() {
      if (document.visibilityState === "visible") void checkSession();
    }

    void checkSession();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const interval = window.setInterval(() => void checkSession(), 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (state === "authorized") return <>{children}</>;

  return (
    <section className="operator-gate" aria-labelledby="operator-gate-title">
      <p className="operator-eyebrow">Staff access</p>
      <h1 id="operator-gate-title">Request operations</h1>
      {state === "checking" && <p role="status">Checking your staff session…</p>}
      {state === "sign-in" && (
        <>
          <p>Sign in through Common Record staff access to continue.</p>
          <a className="operator-gate-action" href={accessLoginUrl(window.location.hostname)}>Sign in</a>
        </>
      )}
      {state === "forbidden" && (
        <p role="alert">Your account does not have operator access. Ask an administrator to check your staff account.</p>
      )}
      {state === "unavailable" && (
        <p role="alert">Staff access is temporarily unavailable. Please try again shortly.</p>
      )}
      <a className="operator-back" href="#">← Return to public site</a>
    </section>
  );
}

export function OperatorGate({ children }: OperatorGateProps) {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  return allowLocalPrototypeFallback(hostname)
    ? <PrototypeGate>{children}</PrototypeGate>
    : <AccessGate>{children}</AccessGate>;
}
