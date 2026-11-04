/**
 * Where the API answers requests made from the server. The browser never uses this —
 * it calls the relative /api path that next.config.ts rewrites to this same origin,
 * which is why both read it from here rather than each keeping its own default.
 */
export const apiOrigin = process.env.API_ORIGIN || "http://127.0.0.1:8000";
