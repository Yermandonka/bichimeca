"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createEmptyProgress,
  type ProgressData,
} from "@/domain/progress/progress";
import {
  createLocalProgressStore,
  type ProgressStore,
} from "@/infrastructure/storage/progressStore";

interface ProgressContextValue {
  /** null while loading from storage. */
  progress: ProgressData | null;
  updateProgress: (updater: (progress: ProgressData) => ProgressData) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ProgressStore | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    const store = createLocalProgressStore(window.localStorage);
    storeRef.current = store;
    setProgress(store.load() ?? createEmptyProgress(new Date().toISOString()));
  }, []);

  const updateProgress = useCallback(
    (updater: (progress: ProgressData) => ProgressData) => {
      setProgress((previous) => {
        if (previous === null) return previous;
        const next = updater(previous);
        storeRef.current?.save(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ progress, updateProgress }),
    [progress, updateProgress],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress requiere un ProgressProvider");
  }
  return context;
}
