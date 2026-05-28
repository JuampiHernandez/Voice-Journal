export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  );
}

/** Deployed demo (Vercel) — browse-only, no voice or writes. */
export function isReadOnlyRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.READ_ONLY === "1";
}

export function isClientReadOnly(): boolean {
  if (typeof window === "undefined") return false;
  return !isLocalHostname(window.location.hostname);
}
