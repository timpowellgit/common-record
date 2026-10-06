import { describe, expect, it } from "vitest";
import {
  isLocale,
  locales,
  messageKeys,
  t,
  timelineEventTypeLabel,
} from "../src/i18n";

describe("i18n dictionaries", () => {
  it("keeps English and French keys identical", () => {
    const english = messageKeys("en").sort();
    const french = messageKeys("fr").sort();
    expect(french).toEqual(english);
    expect(english.length).toBeGreaterThan(0);
  });

  it("translates every public timeline event type in both locales", () => {
    for (const locale of locales) {
      for (const key of messageKeys("en")) {
        if (!key.startsWith("timeline.eventType.")) continue;
        expect(t(key, locale).length).toBeGreaterThan(0);
      }
    }
  });

  it("labels event types in the requested locale", () => {
    expect(timelineEventTypeLabel("request-filed", "en")).toBe("Request filed");
    expect(timelineEventTypeLabel("request-filed", "fr")).toBe("Demande déposée");
  });

  it("interpolates named parameters", () => {
    expect(t("timeline.verifiedBy", "en", { name: "Tim" })).toBe("Published by Tim");
    expect(t("timeline.verifiedBy", "fr", { name: "Tim" })).toBe("Publié par Tim");
  });
});

describe("isLocale", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
