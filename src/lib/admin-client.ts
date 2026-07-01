"use client";

const STORAGE_KEY = "mgdream-admin-secret";

export function getStoredAdminSecret(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function promptForAdminSecret(): string | null {
  const existing = getStoredAdminSecret();
  if (existing) return existing;
  const entered = window.prompt("Enter the admin secret to make changes:");
  if (entered) window.localStorage.setItem(STORAGE_KEY, entered);
  return entered;
}

export function clearStoredAdminSecret() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
