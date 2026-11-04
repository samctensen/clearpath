"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "./api";

type Resource<T> = { data: T | null; error: string; loading: boolean };

export function useResource<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<Resource<T>>({ data: null, error: "", loading: true });
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResource({ data, error: "", loading: false });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResource({ data: null, error: errorMessage(error), loading: false });
      });
    return () => controller.abort();
  }, [path, attempt]);

  function reload() {
    setResource((current) => ({ ...current, error: "", loading: true }));
    setAttempt((current) => current + 1);
  }

  function replace(data: T) {
    setResource({ data, error: "", loading: false });
  }

  return { ...resource, reload, replace };
}
