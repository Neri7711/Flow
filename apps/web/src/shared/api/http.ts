import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side client for the Flow API (`apps/api`).
 *
 * Only Server Components and Server Functions use it: the browser never talks to the
 * API directly, it calls Server Functions and Next forwards the session. That keeps the
 * API token in an httpOnly cookie and avoids CORS altogether.
 */

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** httpOnly cookie that holds the API session token. */
export const SESSION_COOKIE = "flow_session";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  /** By default a 401 sends the user to the login screen; sign-in itself needs the error instead. */
  redirectOnUnauthorized?: boolean;
};

async function send(method: Method, path: string, body?: unknown, options: RequestOptions = {}): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 401 && options.redirectOnUnauthorized !== false) redirect("/login");
  return response;
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message;
    throw new ApiError(response.status, message ?? response.statusText);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  get: async <T>(path: string) => read<T>(await send("GET", path)),

  /**
   * Like `get`, but a 404 or a `null` body resolves to `undefined`. With
   * `redirectOnUnauthorized: false`, a 401 also resolves to `undefined` (e.g. "is anyone signed in?").
   */
  find: async <T>(path: string, options?: RequestOptions): Promise<T | undefined> => {
    const response = await send("GET", path, undefined, options);
    if (response.status === 404 || response.status === 401) return undefined;
    return (await read<T | null>(response)) ?? undefined;
  },

  post: async <T>(path: string, body?: unknown, options?: RequestOptions) =>
    read<T>(await send("POST", path, body ?? {}, options)),
  patch: async <T>(path: string, body: unknown) => read<T>(await send("PATCH", path, body)),
  delete: async <T>(path: string) => read<T>(await send("DELETE", path)),
};

/** `?a=1&b=2`, skipping `undefined` values. */
export function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Encodes a single path segment (ids come from URLs and user input). */
export const segment = (value: string) => encodeURIComponent(value);
