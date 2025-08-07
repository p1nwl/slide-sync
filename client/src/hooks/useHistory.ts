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

  const deepEqualSlides = useCallback((a: Slide[], b: Slide[]): boolean => {
    if (a === b) return true;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      const slideA = a[i];
      const slideB = b[i];

      if (slideA.elements.length !== slideB.elements.length) {
        return false;
      }

      for (let j = 0; j < slideA.elements.length; j++) {
        const elA = slideA.elements[j];
        const elB = slideB.elements[j];

        if (
          elA._id !== elB._id ||
          elA.type !== elB.type ||
          elA.content !== elB.content ||
          elA.position?.x !== elB.position?.x ||
          elA.position?.y !== elB.position?.y ||
          elA.size?.width !== elB.size?.width ||
          elA.size?.height !== elB.size?.height
        ) {
          return false;
        }

        if (elA.style && elB.style) {
          const styleKeysA = Object.keys(elA.style);
          const styleKeysB = Object.keys(elB.style);
          if (styleKeysA.length !== styleKeysB.length) {
            return false;
          }
          for (const key of styleKeysA) {
            if (elA.style[key] !== elB.style[key]) {
              return false;
            }
          }
        } else if (elA.style || elB.style) {
          return false;
        }
      }
      if (slideA.order !== slideB.order) {
        return false;
      }
    }
    return true;
  }, []);

  const deepCopyState = useCallback((state: Slide[]): Slide[] => {
    return state.map((slide) => ({
      ...slide,
      elements: slide.elements.map((el) => {
        if (el.style) {
          return {
            ...el,
            style: { ...el.style },
          };
        }
        return { ...el };
      }),
    }));
  }, []);

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

  const pushHistory = useCallback(
    (newState: Slide[]) => {
      setHistory((currentHistory) => {
        const { past, present } = currentHistory;

        const statesAreEqual = deepEqualSlides(newState, present);

        if (statesAreEqual) {
          return currentHistory;
        }

        const MAX_HISTORY_LENGTH = 50;
        const newPast = [...past, present].slice(-MAX_HISTORY_LENGTH);

        return {
          past: newPast,
          present: deepCopyState(newState),
          future: [],
        };
      });
    },
    [deepCopyState, deepEqualSlides]
  );

  const forcePushHistory = useCallback(
    (newState: Slide[]) => {
      setHistory((currentHistory) => {
        const { past, present } = currentHistory;

        const MAX_HISTORY_LENGTH = 50;
        const newPast = [...past, present].slice(-MAX_HISTORY_LENGTH);

        return {
          past: newPast,
          present: deepCopyState(newState),
          future: [],
        };
      });
    },
    [deepCopyState]
  );

  return {
    slides: history.present,
    pushHistory,
    forcePushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
