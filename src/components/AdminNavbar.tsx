"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JwtPayload } from "@/lib/auth";
import { logout, getUser } from "@/lib/auth";
import { LayoutDashboard, Users, FileText, LogOut, Database } from "lucide-react";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/convocatorias", label: "Convocatorias", icon: FileText },
  { href: "/admin/bdns", label: "BDNS", icon: Database },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<JwtPayload | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <nav className="bg-foreground text-background px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin/dashboard" className="text-primary font-bold text-lg">
            Syntia Admin
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-white/20 text-background"
                    : "text-background/70 hover:bg-white/10 hover:text-background"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-background/60">{user?.sub}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-background/60 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
