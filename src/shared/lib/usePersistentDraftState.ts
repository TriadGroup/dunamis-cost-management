import { useRef, useState, type SetStateAction } from 'react';

const resolveInitialValue = <T,>(initialValue: T | (() => T)): T =>
  typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;

const readPersistedValue = <T,>(storageKey: string, initialValue: T | (() => T)): T => {
  const fallback = resolveInitialValue(initialValue);
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const usePersistentDraftState = <T,>(storageKey: string, initialValue: T | (() => T)) => {
  const [value, setValue] = useState<T>(() => readPersistedValue(storageKey, initialValue));
  const valueRef = useRef(value);

  const persistValue = (nextValue: T) => {
    valueRef.current = nextValue;
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
    } catch {
      // Ignore quota and serialization issues. The in-memory draft still works.
    }
  };

  const updateValue = (nextValue: SetStateAction<T>) => {
    setValue((currentValue) => {
      const resolvedValue =
        typeof nextValue === 'function'
          ? (nextValue as (currentValue: T) => T)(currentValue)
          : nextValue;
      persistValue(resolvedValue);
      return resolvedValue;
    });
  };

  const clear = (): T => {
    const nextValue = resolveInitialValue(initialValue);
    valueRef.current = nextValue;
    setValue(nextValue);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage access issues when clearing a draft.
      }
    }

    return nextValue;
  };

  return {
    value,
    setValue: updateValue,
    clear
  };
};
