import { useState, useCallback } from "react";
import type { Slide } from "../types/index";

interface HistoryState {
  past: Slide[][];
  present: Slide[];
  future: Slide[][];
}

export const useHistory = (initialState: Slide[]) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      const { past, present, future } = currentHistory;
      if (past.length === 0) return currentHistory;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      const { past, present, future } = currentHistory;
      if (future.length === 0) return currentHistory;

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const pushHistory = useCallback((newState: Slide[]) => {
    setHistory((currentHistory) => {
      const { past, present } = currentHistory;

      const MAX_HISTORY_LENGTH = 50;
      const newPast = [...past, present].slice(-MAX_HISTORY_LENGTH);

      return {
        past: newPast,
        present: newState,
        future: [],
      };
    });
  }, []);

  return {
    slides: history.present,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
