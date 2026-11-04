import type { DemoRole, Offer } from "@clearpath/contracts";

export type CatalogData = { offers: Offer[]; policyVersion: string };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, options: { body?: unknown; role?: DemoRole; signal?: AbortSignal } = {}) {
  const headers = new Headers({ Accept: "application/json" });
  if (options.role) headers.set("x-demo-role", options.role);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api${path}`, {
    method: options.body === undefined ? "GET" : "POST",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(result?.error?.message ?? `ClearPath could not complete the request (HTTP ${response.status}).`, response.status);
  }
  if (result === null) throw new ApiError("ClearPath received an unreadable response.", response.status);
  return result as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
