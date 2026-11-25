"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const path = usePathname();
  const exact = href === "/dashboard" || href === "/staff";
  const active =
    path === href ||
    (!exact &&
      path.startsWith(`${href}/`) &&
      !(href === "/dashboard/requests" && path === "/dashboard/requests/new"));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
