"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const HIDDEN_ROUTES = ["/", "/login", "/registro", "/aviso-legal"];

export function GlobalUserNavbar() {
  const pathname = usePathname();

  const hideByExactOrPrefix = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (hideByExactOrPrefix || isAdminRoute) {
    return null;
  }

  return <Navbar />;
}
