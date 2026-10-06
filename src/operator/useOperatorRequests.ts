import { useCallback, useEffect, useState } from "react";
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
  const [requests, setRequests] = useState<OperatorRequest[]>(() =>
    loadStoredRequests(storageKey, initialRequests),
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(requests));
  }, [requests, storageKey]);

  const updateRequest = useCallback(
    (id: string, patch: OperatorRequestPatch, activityMessage: string) => {
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
    },
    [],
  );

  const resetRequests = useCallback(() => {
    setRequests(cloneRequests(initialRequests));
  }, [initialRequests]);

  return { requests, updateRequest, resetRequests };
}
