import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  House,
  Plus,
  Settings,
  Users,
  Mail,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { ActionButton } from "./ui";
import { brand } from "@/lib/brand";
export function PortalShell({
  staff = false,
  children,
}: {
  staff?: boolean;
  children: React.ReactNode;
}) {
  const links = staff
    ? [
        { href: "/staff", label: "Overview", icon: House },
        {
          href: "/staff/bookings",
          label: "Requests & visits",
          icon: ClipboardList,
        },
        { href: "/staff/calendar", label: "Calendar", icon: CalendarDays },
        {
          href: "/staff/catalogue",
          label: "Services & pricing",
          icon: SlidersHorizontal,
        },
        { href: "/staff/settings", label: "Team & settings", icon: Users },
        { href: "/staff/outbox", label: "Enquiries & outbox", icon: Mail },
      ]
    : [
        { href: "/dashboard", label: "Overview", icon: House },
        { href: "/dashboard/book", label: "Request a clean", icon: Plus },
        {
          href: "/dashboard/bookings",
          label: "Your requests",
          icon: CalendarDays,
        },
        {
          href: "/dashboard/settings",
          label: "Account & addresses",
          icon: Settings,
        },
      ];
  return (
    <div className="portal">
      <aside className="portal-sidebar">
        <p className="side-label">
          {staff ? "Rose operations" : "Your Rose account"}
        </p>
        <nav
          className="side-nav"
          aria-label={staff ? "Staff navigation" : "Account navigation"}
        >
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={18} strokeWidth={1.6} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-help">
          <p>Need a hand?</p>
          <a href={brand.phoneHref}>{brand.phone}</a>
          <div style={{ marginTop: 25 }}>
            <ActionButton
              path="auth"
              body={{ action: "logout" }}
              className="text-link"
            >
              <LogOut size={14} /> Sign out
            </ActionButton>
          </div>
        </div>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}
