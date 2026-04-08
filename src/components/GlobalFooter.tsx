"use client";

/**
 * Cambio global:
 * este componente centraliza el Footer para que se muestre automáticamente
 * en todas las páginas desde el layout raíz.
 */
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

/** Rutas donde el Footer no debe renderizarse. */
const HIDDEN_ROUTES = ["/login", "/registro"];

export function GlobalFooter() {
    const pathname = usePathname();

    /**
     * Oculta el Footer tanto en la ruta exacta como en subrutas.
     * Ejemplo: /login y /login/reset
     */
    const hideFooter = HIDDEN_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    /** Si está en una ruta excluida, no renderiza nada. */
    if (hideFooter) return null;

    /** En el resto de páginas, renderiza el Footer global. */
    return <Footer />;
}