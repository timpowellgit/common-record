import { useCallback, useEffect, useRef, useState } from "react";
import { allowLocalPrototypeFallback } from "../public/operator-api";
import { listOperatorRequests, patchOperatorRequest } from "./request-api";
import type { OperatorRequest, OperatorRequestPatch } from "./types";

const defaultStorageKey = "common-record.operator-requests.v1";

function cloneRequests(requests: OperatorRequest[]) {
  return requests.map((request) => ({
    ...request,
    activity: request.activity.map((event) => ({ ...event })),
  }));
}

function loadStoredRequests(
  storageKey: string,
  fallback: OperatorRequest[],
): OperatorRequest[] {
  if (typeof window === "undefined") return cloneRequests(fallback);

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (!Array.isArray(value)) return cloneRequests(fallback);
    return value as OperatorRequest[];
  } catch {
    return cloneRequests(fallback);
  }
}

export function useOperatorRequests(
  initialRequests: OperatorRequest[],
  storageKey = defaultStorageKey,
) {
  const isDemo = typeof window !== "undefined" && allowLocalPrototypeFallback(window.location.hostname);
  const campaignId = initialRequests[0]?.campaignId ?? "";
  const [requests, setRequests] = useState<OperatorRequest[]>(() =>
    isDemo ? loadStoredRequests(storageKey, initialRequests) : [],
  );
  const [mode, setMode] = useState<"demo" | "loading" | "server" | "error">(
    isDemo ? "demo" : "loading",
  );
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (isDemo) window.localStorage.setItem(storageKey, JSON.stringify(requests));
  }, [isDemo, requests, storageKey]);

  const reloadRequests = useCallback(async () => {
    if (isDemo) return;
    setMode("loading");
    const result = await listOperatorRequests(campaignId);
    if (result.status === "ok") {
      setRequests(result.value);
      setMode("server");
      setError("");
    } else {
      setRequests([]);
      setMode("error");
      setError(result.message);
    }
  }, [campaignId, isDemo]);

  useEffect(() => {
    if (!isDemo) void reloadRequests();
  }, [isDemo, reloadRequests]);

  const updateRequest = useCallback(
    async (id: string, patch: OperatorRequestPatch, activityMessage: string): Promise<boolean> => {
      if (!isDemo) {
        const current = requests.find((request) => request.id === id);
        if (!current || current.version === undefined || pendingRef.current) {
          setError("Wait for the current edit to finish, then try again.");
          return false;
        }
        if (Object.keys(patch).length === 0) {
          await reloadRequests();
          return true;
        }
        if (patch.quotedFee !== undefined || patch.filedAt !== undefined || patch.dueAt !== undefined) {
          setError("This field is not yet available for production editing.");
          return false;
        }
        pendingRef.current = true;
        setPendingId(id);
        const result = await patchOperatorRequest(current.campaignId, id, {
          version: current.version,
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.preflight !== undefined ? { preflight: patch.preflight } : {}),
          ...(patch.operatorNotes !== undefined ? { note: patch.operatorNotes } : {}),
        });
        pendingRef.current = false;
        setPendingId(null);
        if (result.status === "ok") {
          setRequests((existing) => existing.map((request) => request.id === id ? result.value : request));
          setError("");
          return true;
        }
        setError(result.message);
        if (result.status === "conflict") {
          await reloadRequests();
          setError(result.message);
        }
        return false;
      }
      const now = new Date().toISOString();
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                ...patch,
                updatedAt: now,
                activity: [
                  {
                    id: `${id}-${now}`,
                    at: now,
                    message: activityMessage,
                  },
                  ...request.activity,
                ],
              }
            : request,
        ),
      );
      return true;
    },
    [isDemo, reloadRequests, requests],
  );

  const resetRequests = useCallback(() => {
    if (isDemo) setRequests(cloneRequests(initialRequests));
  }, [initialRequests, isDemo]);

  return { requests, updateRequest, resetRequests, reloadRequests, mode, error, pendingId };
}
