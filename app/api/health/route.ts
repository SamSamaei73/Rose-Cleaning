import { releaseIdentity } from "@/lib/server/health";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", ...releaseIdentity() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
