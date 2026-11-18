import { requirePageSession } from "@/lib/server/auth";
import { PortalShell } from "@/components/portal";
export const metadata = { robots: { index: false, follow: false } };
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageSession();
  return <PortalShell>{children}</PortalShell>;
}
