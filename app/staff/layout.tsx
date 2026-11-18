import { requirePageSession } from "@/lib/server/auth";
import { PortalShell } from "@/components/portal";
export const metadata = { robots: { index: false, follow: false } };
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageSession(true);
  return <PortalShell staff>{children}</PortalShell>;
}
