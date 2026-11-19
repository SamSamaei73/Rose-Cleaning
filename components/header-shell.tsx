"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="site-header" data-overlay={pathname === "/"}>
      {children}
    </header>
  );
}
