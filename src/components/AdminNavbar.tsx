"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import {logout, getUser, JwtPayload} from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Sun,
  Moon,
  Database,
} from "lucide-react";




const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/convocatorias", label: "Convocatorias", icon: FileText },
  { href: "/admin/bdns", label: "BDNS", icon: Database },
];

export function AdminNavbar() {
  const pathname = usePathname();

  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  function handleLogout() {
    logout();
    router.push("/");
  }

  const [user, setUser] = useState<JwtPayload | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);


  return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
                href="/admin/dashboard"
                className="text-primary font-bold text-lg"
            >
              Syntia Admin
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);

                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active
                                ? "bg-primary-light text-primary"
                                : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
                <button
                    onClick={toggleTheme}
                    type="button"
                    className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                    aria-label={
                      theme === "light" ? "Activar modo oscuro" : "Activar modo claro"
                    }
                    title={
                      theme === "light" ? "Activar modo oscuro" : "Activar modo claro"
                    }
                >
                  {theme === "light" ? (
                      <Moon className="h-4 w-4" />
                  ) : (
                      <Sun className="h-4 w-4" />
                  )}
                </button>
            )}

            <div className="hidden sm:block w-px h-5 bg-border mx-1" />

            <span className="hidden sm:block text-sm text-foreground-muted font-medium">
            {user?.sub}
          </span>

            <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>
  );
}