"use client";

import { useEffect, useState } from "react";
import { apiGet, getToken } from "./api";

/**
 * Load data from the Laravel API with a mock fallback.
 * - Returns the fallback immediately (so the UI renders instantly / works offline).
 * - When a token exists, fetches `path` and swaps in live data.
 * `live` flips true once real API data has loaded.
 */
export function useApiData<T>(path: string, fallback: T): { data: T; live: boolean; loading: boolean } {
  const [data, setData] = useState<T>(fallback);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setLoading(false);
      return;
    }
    apiGet<T>(path)
      .then((res) => {
        if (active && res != null) {
          setData(res);
          setLive(true);
        }
      })
      .catch(() => {
        /* API offline → keep fallback */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return { data, live, loading };
}
