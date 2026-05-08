"use client";

const KEY = "zvest:notifications:dry_run_observed";

export function markDryRunObserved(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, "1");
    window.dispatchEvent(new Event("zvest:dry-run-changed"));
  } catch {
    // ignore
  }
}

export function getDryRunObserved(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
