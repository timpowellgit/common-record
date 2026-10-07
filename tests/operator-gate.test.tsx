import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OperatorGate } from "../src/operator/OperatorGate";

afterEach(() => vi.unstubAllGlobals());

function renderFor(hostname: string, storedSession: string | null = null) {
  vi.stubGlobal("window", {
    location: { hostname },
    sessionStorage: { getItem: () => storedSession },
  });
  return renderToStaticMarkup(<OperatorGate><p>Operator dashboard</p></OperatorGate>);
}

describe("operator route gate", () => {
  it("never accepts the prototype session on the production domain", () => {
    const html = renderFor("commonrecord.ca", "authorized");
    expect(html).toContain("Checking your staff session");
    expect(html).not.toContain("Demo passcode");
    expect(html).not.toContain("Operator dashboard");
  });

  it("keeps the local and static preview gate available", () => {
    expect(renderFor("localhost")).toContain("Demo passcode");
    expect(renderFor("timpowellgit.github.io", "authorized")).toContain("Operator dashboard");
  });
});
