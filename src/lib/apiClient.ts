/**
 * Conditional Data Fetching Client
 *
 * Checks process.env.NEXT_PUBLIC_DEMO_MODE:
 * - When "true" or "1": Returns instant mock data from the centralized registry or custom override.
 * - Otherwise: Performs standard HTTP network request via fetch to the API routes.
 */

import { getMockDataForEndpoint } from "./mockData";

/**
 * Checks whether DEMO MODE is enabled via NEXT_PUBLIC_DEMO_MODE environment variable.
 * Safe to call in both client-side and server-side contexts.
 */
export function isDemoMode(): boolean {
  const envVal = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (!envVal) return false;
  return String(envVal).trim().toLowerCase() === "true" || envVal === "1";
}

export interface FetchDataOptions<T = any> extends RequestInit {
  /** Optional custom mock data override for this specific call when in demo mode */
  mockData?: T | (() => T | Promise<T>);
  /** Simulated delay in milliseconds when in demo mode (default: 150ms for realistic UI feel) */
  mockDelayMs?: number;
}

/**
 * High-level conditional data fetcher returning the parsed JSON result.
 *
 * @example
 * // Automatic mock endpoint lookup or live API call
 * const reports = await fetchData<ReportsData>('/api/reports?range=today');
 *
 * // With custom mock override
 * const categories = await fetchData('/api/categories', {
 *   mockData: [{ _id: '1', nameBn: 'স্পেশাল বিরিয়ানি' }]
 * });
 */
export async function fetchData<T = any>(
  url: string,
  options?: FetchDataOptions<T>,
  inlineMockData?: T | (() => T | Promise<T>)
): Promise<T> {
  const mockOverride = inlineMockData !== undefined ? inlineMockData : options?.mockData;
  const delayMs = options?.mockDelayMs ?? 150;

  if (isDemoMode()) {
    // Simulate real network latency for natural UX transitions and loading skeletons
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (typeof mockOverride === "function") {
      return await (mockOverride as () => T | Promise<T>)();
    }
    if (mockOverride !== undefined) {
      return mockOverride;
    }

    // Default to the centralized restaurant mock registry
    return getMockDataForEndpoint(url, options?.method || "GET") as T;
  }

  // Live API network request
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status} (${res.statusText})`;
    try {
      const errorJson = await res.json();
      if (errorJson && (errorJson.error || errorJson.message)) {
        errorMsg = errorJson.error || errorJson.message;
      }
    } catch {
      // Keep default HTTP status message
    }
    throw new Error(errorMsg);
  }

  return (await res.json()) as T;
}

/**
 * Drop-in replacement for native `window.fetch`.
 * Returns a valid Web `Response` object in both demo mode and live API mode.
 *
 * Allows existing code with `res.ok`, `res.json()`, `res.status` to work seamlessly.
 *
 * @example
 * const res = await fetchWithDemo('/api/menu');
 * if (res.ok) {
 *   const data = await res.json();
 * }
 */
export async function fetchWithDemo(
  input: string | URL | Request,
  init?: FetchDataOptions,
  customMockData?: any
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || (input instanceof Request ? input.method : "GET");
  const delayMs = init?.mockDelayMs ?? 150;

  if (isDemoMode()) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const mockOverride = customMockData !== undefined ? customMockData : init?.mockData;
    let payload: any;

    if (typeof mockOverride === "function") {
      payload = await mockOverride();
    } else if (mockOverride !== undefined) {
      payload = mockOverride;
    } else {
      payload = getMockDataForEndpoint(url, method);
    }

    // Return a standard Web standard Response instance
    return new Response(JSON.stringify(payload), {
      status: 200,
      statusText: "OK (Demo Mode)",
      headers: {
        "Content-Type": "application/json",
        "X-Demo-Mode": "true",
      },
    });
  }

  return fetch(input, init);
}

/**
 * Convenient API Client object grouping common HTTP methods
 */
export const apiClient = {
  get: <T = any>(url: string, options?: FetchDataOptions<T>) =>
    fetchData<T>(url, { ...options, method: "GET" }),

  post: <T = any>(url: string, body?: any, options?: FetchDataOptions<T>) =>
    fetchData<T>(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any, options?: FetchDataOptions<T>) =>
    fetchData<T>(url, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string, options?: FetchDataOptions<T>) =>
    fetchData<T>(url, { ...options, method: "DELETE" }),
};
