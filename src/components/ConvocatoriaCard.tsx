"use client";

import { ConvocatoriaPublica, favoritosApi } from "@/lib/api";
import { ArrowRight, ExternalLink, Lock, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface Props {
    convocatoria: ConvocatoriaPublica;
    onAccesoRequerido?: () => void;
    autenticado: boolean;
    showMatch?: boolean;
    esFavorito?: boolean;
    onFavoritoChange?: (convocatoriaId: number, esFavorito: boolean) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcDaysLeft(fechaCierre?: string): number | null {
    if (!fechaCierre) return null;
    return Math.ceil((new Date(fechaCierre).getTime() - Date.now()) / 86_400_000);
}

function calcProgress(daysLeft: number): number {
    if (daysLeft <= 0)  return 100;
    if (daysLeft <= 7)  return 90;
    if (daysLeft <= 14) return 75;
    if (daysLeft <= 30) return 55;
    if (daysLeft <= 60) return 30;
    if (daysLeft <= 90) return 15;
    return 5;
}

function formatFecha(fecha?: string): string {
    if (!fecha) return "";
    try {
        return new Date(fecha).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return fecha;
    }
}

function formatPresupuesto(p?: number): string | null {
    if (p == null || p === 0) return null;
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace(".", ",")}M€`;
    if (p >= 100_000)   return `${Math.round(p / 1_000)}k€`;
    return `${new Intl.NumberFormat("es-ES").format(Math.round(p))}€`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConvocatoriaCard({
                                     convocatoria: c,
                                     onAccesoRequerido,
                                     autenticado,
                                     showMatch = false,
                                     esFavorito = false,
                                     onFavoritoChange,
                                 }: Props) {
    const router = useRouter();
    const [favLoading, setFavLoading] = useState(false);
    const { theme } = useTheme();

    const esCerrada = c.abierto === false;
    const daysLeft  = calcDaysLeft(c.fechaCierre);
    const highMatch = showMatch && (c.matchScore ?? 0) >= 70;
    const urgent    = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
    const moderate  = daysLeft !== null && daysLeft > 7 && daysLeft <= 30;

    const presupuestoFmt = formatPresupuesto(c.presupuesto);
    const progress       = daysLeft != null && daysLeft > 0 ? calcProgress(daysLeft) : null;

    const themedPrimaryText = theme === "dark" ? "text-blue-300" : "text-primary";

    const accentBar =
        esCerrada ? null :
            urgent    ? "bg-destructive" :
                highMatch ? "bg-accent-green" :
                    moderate  ? "bg-accent-amber" :
                        null;

    const badge =
        esCerrada
            ? { label: "Cerrada", bg: "bg-destructive-light", text: "text-destructive" }
            : urgent
                ? { label: "Cierre próximo", bg: "bg-destructive-light", text: "text-destructive" }
                : highMatch
                    ? { label: "Alta compatibilidad", bg: "bg-accent-emerald/10", text: "text-accent-emerald" }
                    : c.abierto === true
                        ? { label: "Abierta", bg: "bg-primary-light", text: themedPrimaryText }
                        : null;

    const progressBarColor =
        urgent   ? "bg-destructive" :
            moderate ? "bg-accent-amber" :
                "bg-primary";

    const daysTextColor =
        urgent   ? "text-destructive" :
            moderate ? "text-accent-amber" :
                "text-foreground-muted";

    async function toggleFavorito(e: React.MouseEvent) {
        e.stopPropagation();
        if (!autenticado) {
            onAccesoRequerido?.();
            return;
        }
        if (favLoading) return;
        setFavLoading(true);
        try {
            if (esFavorito) {
                await favoritosApi.eliminar(c.id);
                onFavoritoChange?.(c.id, false);
            } else {
                await favoritosApi.agregar(c.id);
                onFavoritoChange?.(c.id, true);
            }
        } catch {
        } finally {
            setFavLoading(false);
        }
    }

    function handleClick() {
        if (!autenticado) {
            onAccesoRequerido?.();
            return;
        }
        router.push(`/convocatorias/${c.id}`);
    }

    return (
        <div
            className="
                bg-surface
                hover:shadow-xl hover:shadow-black/[0.03]
                transition-all duration-200
                p-6 rounded-2xl group relative overflow-hidden
                border border-border
            "
        >
            {accentBar && (
                <div className={`absolute top-0 left-0 w-1 h-full ${accentBar}`} />
            )}

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                {badge && (
                                    <span
                                        className={`
                                            px-2.5 py-0.5 rounded-full
                                            text-[10px] font-black uppercase tracking-tight
                                            ${badge.bg} ${badge.text}
                                        `}
                                    >
                                        {badge.label}
                                    </span>
                                )}

                                {c.numeroConvocatoria && (
                                    <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                                        ID: #{c.numeroConvocatoria}
                                    </span>
                                )}

                                {showMatch && c.matchScore != null && !highMatch && (
                                    <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                                        {c.matchScore}% match
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-150 line-clamp-2">
                                {c.titulo}
                            </h3>
                        </div>

                        {autenticado && (
                            <button
                                type="button"
                                onClick={toggleFavorito}
                                disabled={favLoading}
                                aria-label={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
                                className="shrink-0 p-1.5 rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50"
                            >
                                <Star
                                    className={`
                                        w-5 h-5 transition-colors
                                        ${
                                        esFavorito
                                            ? "text-amber-500 fill-amber-500"
                                            : "text-foreground-muted hover:text-amber-400"
                                    }
                                    `}
                                />
                            </button>
                        )}
                    </div>

                    {(c.tipo || c.sector || c.ubicacion) && (
                        <div className="flex flex-wrap gap-2">
                            {c.tipo && (
                                <span className={`px-3 py-1 rounded-full bg-primary-light text-xs font-semibold ${themedPrimaryText}`}>
                                    {c.tipo}
                                </span>
                            )}
                            {c.sector && (
                                <span className={`px-3 py-1 rounded-full bg-surface-muted text-xs font-semibold ${themedPrimaryText}`}>
                                    {c.sector}
                                </span>
                            )}
                            {c.ubicacion && (
                                <span className={`px-3 py-1 rounded-full bg-surface-muted text-xs font-semibold ${themedPrimaryText}`}>
                                    {c.ubicacion}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {c.organismo && (
                            <span className="text-xs text-foreground-muted font-medium truncate max-w-[280px]">
                                🏛 {c.organismo}
                            </span>
                        )}
                        {c.fechaPublicacion && (
                            <span className="text-xs text-foreground-subtle">
                                Publicada el {formatFecha(c.fechaPublicacion)}
                            </span>
                        )}
                    </div>

                    {!esCerrada && progress != null && daysLeft != null && daysLeft > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-foreground-muted">Progreso del plazo</span>
                                <span className={daysTextColor}>
                                    Quedan {daysLeft} día{daysLeft !== 1 ? "s" : ""} ({progress}%)
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${progressBarColor} rounded-full`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:w-56 shrink-0 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                            Presupuesto total
                        </p>
                        {presupuestoFmt ? (
                            <p
                                className={`
                                    text-3xl font-bold leading-none
                                    ${theme === "dark" ? "text-blue-300" : "text-primary"}
                                `}
                            >
                                {presupuestoFmt}
                            </p>
                        ) : (
                            <p className="text-sm text-foreground-subtle italic">
                                No especificado
                            </p>
                        )}
                    </div>

                    {c.fechaCierre && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                Fecha límite
                            </p>
                            <p className="text-sm font-bold text-foreground">
                                {formatFecha(c.fechaCierre)}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleClick}
                        className={`
                            w-full rounded-xl font-semibold text-sm
                            flex items-center justify-center gap-2
                            transition-colors
                            ${
                            autenticado
                                ? "bg-primary text-white px-5 py-3 hover:bg-primary-hover"
                                : "bg-surface-muted text-foreground-muted py-2.5"
                        }
                        `}
                    >
                        {autenticado ? (
                            <>
                                Ver detalles
                                <ArrowRight className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                <Lock className="w-3.5 h-3.5" /> Iniciar sesión
                            </>
                        )}
                    </button>

                    {autenticado && c.urlOficial && (
                        <a
                            href={c.urlOficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Ver fuente oficial
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}