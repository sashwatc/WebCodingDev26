// Inspired by react-hot-toast library
//
// use-toast — the headless state engine behind the custom toast system
// (toast.jsx renders the UI, toaster.jsx wires it up). It is NOT a React
// context: state lives in a module-level singleton (`memoryState`) mutated by a
// reducer, and any mounted useToast() hook subscribes via a `listeners` array.
// This lets non-React code call `toast()` to enqueue a notification.
import { useState, useEffect } from "react";

// Max number of toasts kept at once (older ones are dropped beyond this).
const TOAST_LIMIT = 20;
// Delay (ms) between a toast being dismissed (animate out) and removed from state.
const TOAST_REMOVE_DELAY = 250;

// The set of reducer action names.
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

// Monotonic counter used to generate unique toast ids.
let count = 0;

// Returns the next unique id as a string (wraps at MAX_VALUE).
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Tracks pending removal timers keyed by toast id, so we don't double-schedule.
const toastTimeouts = new Map();

// Schedules a toast for hard removal TOAST_REMOVE_DELAY ms after it is dismissed,
// giving the exit animation time to play. No-op if already queued.
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Cancels a pending removal timer (currently unused; kept for completeness).
const _clearFromRemoveQueue = (toastId) => {
  const timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(toastId);
  }
};

// Pure reducer computing the next toast state from an action.
export const reducer = (state, action) => {
  switch (action.type) {
    // Prepend the new toast and cap the list at TOAST_LIMIT.
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    // Merge new fields into the matching toast (used by the update() handle).
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    // Begin dismissal: mark toast(s) closed (triggers exit) and queue removal.
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      // A specific id dismisses one toast; omitting it dismisses all of them.
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    // Hard-remove from state after the exit delay (or clear all if no id).
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// setState callbacks of every mounted useToast() hook; notified on each change.
const listeners = [];

// The single source of truth for toast state, living outside React.
let memoryState = { toasts: [] };

// Runs the reducer against the singleton state and pushes it to all subscribers.
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Imperative API to show a toast. Returns { id, dismiss, update } handles and
// auto-dismisses after props.duration (default 7000ms). Callable anywhere.
function toast({ ...props }) {
  const id = genId();

  // Patch this toast's content later by id.
  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  // Dismiss this specific toast.
  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  // Add it to state, open; dismiss it if the UI reports it closed.
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Safety auto-dismiss so toasts never linger forever.
  setTimeout(() => {
    dismiss();
  }, props.duration || 7000);

  return {
    id,
    dismiss,
    update,
  };
}

// React hook exposing the live toast state plus toast()/dismiss() helpers.
function useToast() {
  // Local mirror of the singleton state, seeded with the current value.
  const [state, setState] = useState(memoryState);

  // Subscribe this component's setState on mount; unsubscribe on unmount so the
  // module-level store re-renders every mounted consumer when toasts change.
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast }; 
