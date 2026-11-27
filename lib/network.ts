/** Bound provider requests, including stalled response bodies. Native signals clean up automatically. */
export const PROVIDER_TIMEOUT_MS = 15000;
export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const deadline = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
  const inherited =
    init?.signal || (input instanceof Request ? input.signal : undefined);
  return fetch(input, {
    ...init,
    signal: inherited ? AbortSignal.any([inherited, deadline]) : deadline,
  });
}
