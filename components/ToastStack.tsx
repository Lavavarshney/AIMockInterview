"use client";

import { useEffect } from "react";
import { useInterview } from "@/context/InterviewContext";

export function ToastStack() {
  const { state, dispatch } = useInterview();

  useEffect(() => {
    if (!state.toasts.length) return;
    const timers = state.toasts.map((toast) =>
      setTimeout(() => dispatch({ type: "DISMISS_TOAST", payload: toast.id }), 5200)
    );
    return () => timers.forEach(clearTimeout);
  }, [dispatch, state.toasts]);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur ${
            toast.type === "error"
              ? "border-ember/40 bg-ember/15 text-rose-100"
              : toast.type === "success"
                ? "border-accent/40 bg-accent/15 text-teal-50"
                : "border-white/15 bg-white/10 text-slate-100"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
