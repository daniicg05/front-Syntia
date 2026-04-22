"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { GlobalUserNavbar } from "@/components/GlobalUserNavbar";

export default function MaybeNavbar() {
  const pathname = usePathname() || "/";

  // Oculta la barra superior en la ruta /suscripcion y sus subrutas
  if (pathname.startsWith("/suscripcion")) return null;

  return <GlobalUserNavbar />;
}
