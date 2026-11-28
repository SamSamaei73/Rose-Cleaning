"use client";
import Link from "@/components/app-link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function NavLink({
  href,
  children,
  appearance = "button",
}: {
  href: string;
  children: ReactNode;
  appearance?: "button" | "text";
}) {
  const path = usePathname();
  const exact = href === "/dashboard" || href === "/staff";
  const active =
    path === href ||
    (!exact &&
      path.startsWith(`${href}/`) &&
      !(href === "/dashboard/requests" && path === "/dashboard/requests/new"));
  return (
    <Link
      className={appearance === "button" ? "nav-control" : undefined}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
