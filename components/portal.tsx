import Link from "@/components/app-link";
import { NavLink } from "./nav-link";
import {
  CalendarDays,
  ClipboardList,
  House,
  Plus,
  Settings,
  Users,
  Mail,
  SlidersHorizontal,
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
        {
          href: "/dashboard/requests/new",
          label: "Request a clean",
          icon: Plus,
        },
        {
          href: "/dashboard/requests",
          label: "My requests",
          icon: CalendarDays,
        },
        {
          href: "/dashboard/profile",
          label: "Profile & address",
          icon: Settings,
        },
      ];
  return (
    <div className={`portal${staff ? "" : " customer-portal"}`}>
      <aside className="portal-sidebar">
        <p className="side-label">
          {staff ? "Rose operations" : "Your Rose account"}
        </p>
        <nav
          className="side-nav"
          aria-label={staff ? "Staff navigation" : "Account navigation"}
        >
          {links.map(({ href, label, icon: Icon }) => (
            <NavLink href={href} key={href}>
              <Icon size={18} strokeWidth={1.6} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-help">
          <p>Need a hand?</p>
          <Link href="/contact" className="btn secondary small action-link">
            Contact Rose
          </Link>
          <a className="btn secondary small" href={brand.phoneHref}>
            {brand.phone}
          </a>
        </div>
        <div className="portal-account-actions">
          <ActionButton
            path="auth"
            body={{ action: "logout" }}
            className="btn secondary small"
          >
            Log out
          </ActionButton>
        </div>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}
