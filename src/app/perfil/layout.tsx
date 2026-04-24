"use client";

import { usePathname } from "next/navigation";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFavoritas = pathname?.startsWith("/perfil/favoritas");

  return (
    <section className={`${isFavoritas ? "max-w-6xl" : "max-w-3xl"} mx-auto w-full px-4 py-10`}>
      {children}
    </section>
  );
}
