import { loadingProgress } from "./loading-progress";

export const API_TIMEOUT_MS = 30000;
export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const finish = loadingProgress.begin(
    `api:${crypto.randomUUID()}`,
    "Taking care of your request…",
    0,
  );
  try {
    const response = await fetch(`/api/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error("We couldn’t complete that request. Please try again.");
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(
        data.error || "Something went wrong. Please try again.",
      ) as Error & { details?: unknown };
      error.details = data.details;
      throw error;
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("The request timed out. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
    finish();
  }
}
