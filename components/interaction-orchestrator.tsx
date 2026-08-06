"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./runtime-interactions.module.css";

type HapticPattern = "selection" | "impact" | "success" | "warning" | "error";
type InputModality = "keyboard" | "pointer" | "touch";

type HapticEventDetail = {
  pattern?: HapticPattern;
};

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 8,
  impact: 14,
  success: [12, 40, 18],
  warning: [18, 54, 18],
  error: [26, 70, 26],
};

const activeAnimations = new WeakMap<HTMLElement, Animation>();

function reducedMotionPreferred() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hapticsEnabled() {
  try {
    return window.localStorage.getItem("hisab-haptics") !== "off";
  } catch {
    return true;
  }
}

function vibrate(pattern: HapticPattern) {
  if (!("vibrate" in navigator) || !hapticsEnabled()) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  navigator.vibrate(HAPTIC_PATTERNS[pattern]);
}

function playAnimation(element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  if (reducedMotionPreferred() || typeof element.animate !== "function") return;

  activeAnimations.get(element)?.cancel();
  const animation = element.animate(keyframes, options);
  activeAnimations.set(element, animation);

  const release = () => {
    if (activeAnimations.get(element) === animation) activeAnimations.delete(element);
  };
  animation.addEventListener("finish", release, { once: true });
  animation.addEventListener("cancel", release, { once: true });
}

function animatePress(element: HTMLElement) {
  playAnimation(
    element,
    [
      { transform: "translate3d(0, 0, 0) scale(1)" },
      { transform: "translate3d(0, 1px, 0) scale(.985)", offset: 0.42 },
      { transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    { duration: 180, easing: "cubic-bezier(.22, 1, .36, 1)" },
  );
}

function animateSpring(element: HTMLElement, delay = 0) {
  playAnimation(
    element,
    [
      { opacity: 0, transform: "translate3d(0, 8px, 0) scale(.992)" },
      { opacity: 1, transform: "translate3d(0, -1px, 0) scale(1.001)", offset: 0.72 },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    {
      duration: 360,
      delay,
      easing: "cubic-bezier(.22, 1, .36, 1)",
      fill: "backwards",
    },
  );
}

function interactionPattern(element: HTMLElement): HapticPattern {
  const explicit = element.dataset.haptic as HapticPattern | undefined;
  if (explicit && explicit in HAPTIC_PATTERNS) return explicit;
  if (element.matches('[aria-current="page"], [aria-selected="true"]')) return "selection";
  if (element.matches('[data-tone="danger"], .danger, .destructive, [name="status"]')) return "warning";
  if (element.matches('button[type="submit"], input[type="submit"], .primary, .marketing-start')) return "impact";
  return "selection";
}

function setInputModality(modality: InputModality) {
  document.documentElement.dataset.inputModality = modality;
}

export function InteractionOrchestrator() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const formTimers = new Map<HTMLFormElement, number>();
    const submittingForms = new Set<HTMLFormElement>();

    const announce = (message: string) => {
      if (!statusRef.current) return;
      statusRef.current.textContent = "";
      window.requestAnimationFrame(() => {
        if (statusRef.current) statusRef.current.textContent = message;
      });
    };

    const updateMotionPreference = () => {
      root.dataset.motion = motionQuery.matches ? "reduced" : "full";
    };

    const updateConnectivity = () => {
      const online = navigator.onLine;
      const previous = root.dataset.connectivity;
      root.dataset.connectivity = online ? "online" : "offline";
      if (previous && previous !== root.dataset.connectivity) {
        announce(online ? "Connection restored." : "You are offline. Changes requiring a connection may be unavailable.");
        vibrate(online ? "success" : "warning");
      }
    };

    const resetForm = (form: HTMLFormElement) => {
      delete form.dataset.submitting;
      form.removeAttribute("aria-busy");
      form.querySelectorAll<HTMLElement>('[data-action-state="submitting"]').forEach((control) => {
        delete control.dataset.actionState;
      });
      const timer = formTimers.get(form);
      if (timer) window.clearTimeout(timer);
      formTimers.delete(form);
      submittingForms.delete(form);
    };

    const resetSubmittingForms = () => {
      submittingForms.forEach(resetForm);
    };

    const markFormSubmitting = (form: HTMLFormElement) => {
      if (form.dataset.noLoading === "true" || form.dataset.submitting === "true") return;
      form.dataset.submitting = "true";
      form.setAttribute("aria-busy", "true");
      form.querySelectorAll<HTMLElement>('button[type="submit"], input[type="submit"]').forEach((control) => {
        control.dataset.actionState = "submitting";
      });
      submittingForms.add(form);
      const existing = formTimers.get(form);
      if (existing) window.clearTimeout(existing);
      formTimers.set(form, window.setTimeout(() => resetForm(form), 20_000));
    };

    updateMotionPreference();
    updateConnectivity();
    setInputModality("pointer");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key.startsWith("Arrow") || event.key === "Enter" || event.key === " ") {
        setInputModality("keyboard");
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      setInputModality(event.pointerType === "touch" ? "touch" : "pointer");
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest<HTMLElement>(
        'button:not([disabled]), a[href], summary, [role="button"]:not([aria-disabled="true"])',
      );
      if (!interactive || interactive.dataset.haptic === "none") return;
      vibrate(interactionPattern(interactive));
      animatePress(interactive);
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      markFormSubmitting(event.target);
    };

    const handleInvalid = (event: Event) => {
      if (!(event.target instanceof HTMLElement)) return;
      setInputModality("keyboard");
      vibrate("warning");
      window.requestAnimationFrame(() => event.target instanceof HTMLElement && event.target.focus({ preventScroll: true }));
      event.target.scrollIntoView({ behavior: reducedMotionPreferred() ? "auto" : "smooth", block: "center" });
    };

    const handleHaptic = (event: Event) => {
      const detail = (event as CustomEvent<HapticEventDetail>).detail;
      vibrate(detail?.pattern ?? "selection");
    };

    const observer = new MutationObserver((records) => {
      let animationIndex = 0;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const candidates = [
            ...(node.matches('[data-live-row="true"], [data-motion-enter]') ? [node] : []),
            ...node.querySelectorAll<HTMLElement>('[data-live-row="true"], [data-motion-enter]'),
          ];
          for (const candidate of candidates.slice(0, 24)) {
            animateSpring(candidate, Math.min(animationIndex * 12, 120));
            animationIndex += 1;
          }
        }
      }
    });

    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    window.addEventListener("pageshow", resetSubmittingForms);
    window.addEventListener("hisab:done", resetSubmittingForms);
    window.addEventListener("hisab:haptic", handleHaptic);
    motionQuery.addEventListener("change", updateMotionPreference);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("invalid", handleInvalid, true);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
      window.removeEventListener("pageshow", resetSubmittingForms);
      window.removeEventListener("hisab:done", resetSubmittingForms);
      window.removeEventListener("hisab:haptic", handleHaptic);
      motionQuery.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("invalid", handleInvalid, true);
      observer.disconnect();
      formTimers.forEach((timer) => window.clearTimeout(timer));
      formTimers.clear();
      submittingForms.clear();
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const root = document.documentElement;
    let transitionTimer = 0;
    root.dataset.routeTransition = "active";

    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>("#workspace-content > :first-child, #public-main-content > :first-child, main");
      if (target) animateSpring(target);
      transitionTimer = window.setTimeout(() => {
        delete root.dataset.routeTransition;
      }, 380);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (transitionTimer) window.clearTimeout(transitionTimer);
      delete root.dataset.routeTransition;
    };
  }, [pathname]);

  return (
    <>
      <span className={styles.runtimeRoot} aria-hidden="true" />
      <span ref={statusRef} className={styles.status} aria-live="polite" aria-atomic="true" />
    </>
  );
}
