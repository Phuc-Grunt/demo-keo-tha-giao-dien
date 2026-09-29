import { timingSafeEqual } from "node:crypto";

export function isAdminRequest(request: Request): boolean {
  const expected = process.env.DEMO_ADMIN_TOKEN;
  const actual = request.headers.get("x-demo-admin-token");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
