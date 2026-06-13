// config.server.ts — server-only config helper (not used in SPA mode).
// In SPA mode there is no server-side context; public config is accessed via
// import.meta.env.VITE_* variables which are safe to use client-side.
//
// Example: use import.meta.env.VITE_API_URL in your components instead.

export function getServerConfig() {
  return {
    nodeEnv: "client" as const,
  };
}
