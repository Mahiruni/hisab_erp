"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect, useReducer } from "react";
import { useFormStatus } from "react-dom";

type ActionMachineState = "idle" | "pressed" | "submitting";
type ActionMachineEvent = "PRESS" | "RELEASE" | "SUBMIT" | "RESET";

type FinancialActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  pendingLabel?: string;
};

function actionMachine(state: ActionMachineState, event: ActionMachineEvent): ActionMachineState {
  if (event === "SUBMIT") return "submitting";
  if (event === "RESET") return "idle";
  if (event === "PRESS" && state === "idle") return "pressed";
  if (event === "RELEASE" && state === "pressed") return "idle";
  return state;
}

export function FinancialActionButton({
  children,
  pendingLabel = "Processing…",
  className = "",
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...props
}: FinancialActionButtonProps) {
  const { pending } = useFormStatus();
  const [state, dispatch] = useReducer(actionMachine, "idle");

  useEffect(() => {
    dispatch(pending ? "SUBMIT" : "RESET");
  }, [pending]);

  return (
    <button
      {...props}
      aria-busy={pending}
      className={`financial-action-button ${className}`.trim()}
      data-action-state={state}
      disabled={disabled || pending}
      onPointerCancel={(event) => {
        dispatch("RELEASE");
        onPointerCancel?.(event);
      }}
      onPointerDown={(event) => {
        dispatch("PRESS");
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        dispatch("RELEASE");
        onPointerUp?.(event);
      }}
      type="submit"
    >
      <span className="financial-action-spinner" aria-hidden="true" />
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
