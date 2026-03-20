import { useEffect, useRef, useState } from "react";

export const useEditorPersistence = (storageKey: string, initialValue: string) => {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ?? initialValue;
    } catch {
      return initialValue;
    }
  });
  const lastPersistedValueRef = useRef<string>(value);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(storageKey);
      const nextValue = saved ?? initialValue;
      lastPersistedValueRef.current = nextValue;
      setValue((previousValue) =>
        previousValue === nextValue ? previousValue : nextValue,
      );
    } catch {
      lastPersistedValueRef.current = initialValue;
      setValue((previousValue) =>
        previousValue === initialValue ? previousValue : initialValue,
      );
    }
  }, [storageKey, initialValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (lastPersistedValueRef.current === value) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, value);
      lastPersistedValueRef.current = value;
    } catch {
      // Ignore storage errors in restricted or quota-limited environments.
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
};
