"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State that persists to localStorage so it survives a page refresh.
 * Hydration-safe: the first render always uses `initial` (matching the server),
 * then the stored value is loaded on mount.
 *
 * Persistence happens ONLY on explicit updates (inside the returned setter), never
 * from the load path. This is deliberate: an effect that writes `state` back would
 * fire on every mount — and under React StrictMode's double-invoked effects it can
 * write the empty `initial` seed before the stored value has loaded, clobbering the
 * user's data on remount (e.g. navigating between pages). Writing only on real
 * mutations makes reads/mounts pure and non-destructive.
 *
 * Keys are namespaced with the app's `nexus-` prefix (like `nexus-lang`, `nexus-token`).
 */
export function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `nexus-${key}`;
  const [state, setState] = useState<T>(initial);
  const loaded = useRef(false);

  // Load once on mount (client only). This uses the raw setState so reading never persists.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* corrupt or unavailable storage → keep initial */
    }
    loaded.current = true;
  }, [storageKey]);

  // Persist only on explicit updates, writing the freshly-computed value.
  const setAndStore = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* quota exceeded or unavailable storage → keep in-memory value */
        }
        return next;
      });
    },
    [storageKey],
  );

  return [state, setAndStore];
}
