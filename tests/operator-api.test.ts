import { describe, expect, it } from "vitest";
import { allowLocalPrototypeFallback } from "../src/public/operator-api";

describe("local timeline publishing boundary", () => {
  it("allows demo fallback only on the prototype hosts", () => {
    expect(allowLocalPrototypeFallback("localhost")).toBe(true);
    expect(allowLocalPrototypeFallback("127.0.0.1")).toBe(true);
    expect(allowLocalPrototypeFallback("timpowellgit.github.io")).toBe(true);
    expect(allowLocalPrototypeFallback("commonrecord.ca")).toBe(false);
    expect(allowLocalPrototypeFallback("www.commonrecord.ca")).toBe(false);
    expect(allowLocalPrototypeFallback("example.org")).toBe(false);
  });
});
