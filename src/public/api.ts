import { isPublicTimelineEvent, type PublicTimelineEvent } from "../domain/timeline";

/**
 * Fetch the operator-approved public timeline for a campaign from the
 * production API. Returns null when the API is unreachable or serves
 * something other than JSON (for example the static GitHub Pages build),
 * so the caller can fall back to the local prototype store.
 */
export async function fetchCampaignTimeline(
  campaignSlug: string,
): Promise<PublicTimelineEvent[] | null> {
  try {
    const response = await fetch(
      `/api/campaigns/${encodeURIComponent(campaignSlug)}/timeline`,
      { headers: { accept: "application/json" } },
    );
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null) return null;
    const events = (payload as { events?: unknown }).events;
    if (!Array.isArray(events)) return null;
    return events.filter(isPublicTimelineEvent);
  } catch {
    return null;
  }
}
