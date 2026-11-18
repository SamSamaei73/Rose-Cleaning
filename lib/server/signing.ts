import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { appSecret } from "./config";
export const digest = (value: string) =>
  createHmac("sha256", appSecret()).update(value).digest("hex");
export function seal(value: unknown) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${body}.${digest(body)}`;
}
export function unseal<T>(token: string): T | null {
  const [body, mac, ...extra] = token.split(".");
  if (!body || !mac || extra.length || !/^[a-f0-9]{64}$/.test(mac)) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(digest(body))))
    return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
