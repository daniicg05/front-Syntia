"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getUser, logout } from "@/lib/auth";
import Image from "next/image";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  User,
  Home,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const NAV_LINKS = [
  { href: "/home", label: "Inicio", icon: Home },
  { href: "/proyectos", label: "Mis proyectos", icon: FolderOpen },
  { href: "/guias", label: "Guías", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const username = user?.sub?.split("@")[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center">
          <Image
            src="/images/syntia-grants-logo.png"
            alt="Syntia Grants"
            width={160}
            height={54}
            className="w-[60px] md:w-[100px] h-auto"
            priority
          />
        </Link>

        {/* Desktop nav — solo si autenticado */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
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
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
              aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          )}

          {user ? (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
                    <Link
                      href="/perfil"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Mi perfil
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 w-full text-sm text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              <Link
                href="/login"
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-surface-muted"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          {user ? (
            <>
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary-light text-primary"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
              <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
                <Link
                  href="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mi perfil ({username})
                </Link>
                {mounted && (
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                  >
                    {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {theme === "light" ? "Modo oscuro" : "Modo claro"}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <>
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {theme === "light" ? "Modo oscuro" : "Modo claro"}
                </button>
              )}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}