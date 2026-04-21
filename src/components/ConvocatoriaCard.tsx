"use client";

import { useEffect, useState } from "react";
import { ConvocatoriaPublica } from "@/lib/api";
import { FAVORITAS_UPDATED_EVENT, getFavoritaById, type EstadoSolicitud } from "@/lib/favoritos";
import { ArrowRight, ExternalLink, Lock, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    convocatoria: ConvocatoriaPublica;
    onAccesoRequerido?: () => void;
    autenticado: boolean;
    showMatch?: boolean;
    compactTitle?: boolean;
    estadoSolicitud?: "no_solicitada" | "solicitada";
    onEstadoSolicitudChange?: (estado: "no_solicitada" | "solicitada") => void;
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
            day: "numeric", month: "short", year: "numeric",
        });
    } catch { return fecha; }
}

function formatPresupuesto(p?: number): string | null {
    if (p == null || p === 0) return null;
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace(".", ",")}M€`;
    if (p >= 100_000)   return `${Math.round(p / 1_000)}k€`;
    return `${new Intl.NumberFormat("es-ES").format(Math.round(p))}€`;
}

function buildBdnsUrl(idBdns?: string): string | null {
    if (!idBdns) return null;
    const clean = String(idBdns).trim();
    if (!clean) return null;
    return `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria/${encodeURIComponent(clean)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConvocatoriaCard({
    convocatoria: c,
    onAccesoRequerido,
    autenticado,
    showMatch = false,
    compactTitle = false,
    estadoSolicitud: estadoSolicitudProp,
    onEstadoSolicitudChange,
}: Props) {
    const router = useRouter();
    const [favorita, setFavorita] = useState(false);
    const [estadoSolicitudLocal, setEstadoSolicitudLocal] = useState<EstadoSolicitud | null>(null);
    const esCerrada = c.abierto === false;
    const daysLeft  = calcDaysLeft(c.fechaCierre);
    const highMatch = showMatch && (c.matchScore ?? 0) >= 70;
    const urgent    = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
    const moderate  = daysLeft !== null && daysLeft > 7 && daysLeft <= 30;

    const presupuestoFmt = formatPresupuesto(c.presupuesto);
    const progress       = daysLeft != null && daysLeft > 0 ? calcProgress(daysLeft) : null;
    const fuenteOficialUrl = c.urlOficial || buildBdnsUrl(c.idBdns);

    // Left accent bar
    const accentBar =
        esCerrada ? null :
        urgent    ? "bg-red-500" :
        highMatch ? "bg-emerald-500" :
        moderate  ? "bg-amber-400" :
        null;

    // Status badge
    const badge =
        esCerrada                 ? { label: "Cerrada",            bg: "bg-red-50",     text: "text-red-800"     } :
        urgent                    ? { label: "Cierre próximo",     bg: "bg-red-100",    text: "text-red-900"     } :
        highMatch                 ? { label: "Alta compatibilidad",bg: "bg-emerald-100",text: "text-emerald-900" } :
        c.abierto === true        ? { label: "Abierta",            bg: "bg-[#b9eaff]",  text: "text-[#004d62]"  } :
        null;

    // Progress bar + label color
    const progressBarColor =
        urgent   ? "bg-red-500" :
        moderate ? "bg-amber-400" :
        "bg-primary";

    const daysTextColor =
        urgent   ? "text-red-600" :
        moderate ? "text-amber-600" :
        "text-foreground-muted";

    const estadoSolicitudMostrada = estadoSolicitudProp ?? estadoSolicitudLocal;
    const tipoNormalizado = (c.tipo ?? "").trim().toLowerCase();
    const sectorNormalizado = (c.sector ?? "").trim().toLowerCase();
    const mostrarTipo = Boolean(c.tipo) && tipoNormalizado !== sectorNormalizado;

    function handleClick() {
        if (!autenticado) { onAccesoRequerido?.(); return; }
        router.push(`/convocatorias/${c.id}`);
    }

    useEffect(() => {
        function syncFavoritaState() {
            const favoritaGuardada = getFavoritaById(c.id);
            setFavorita(Boolean(favoritaGuardada));
            setEstadoSolicitudLocal(favoritaGuardada?.estadoSolicitud ?? null);
        }

        syncFavoritaState();
        window.addEventListener(FAVORITAS_UPDATED_EVENT, syncFavoritaState);
        window.addEventListener("storage", syncFavoritaState);

        return () => {
            window.removeEventListener(FAVORITAS_UPDATED_EVENT, syncFavoritaState);
            window.removeEventListener("storage", syncFavoritaState);
        };
    }, [c.id]);

    return (
        <div className="bg-white hover:shadow-xl hover:shadow-black/[0.03] transition-all duration-200 p-6 rounded-2xl group relative overflow-hidden border border-border">
            {/* Left accent bar */}
            {accentBar && (
                <div className={`absolute top-0 left-0 w-1 h-full ${accentBar}`} />
            )}

            <div className="flex flex-col md:flex-row justify-between gap-6">

                {/* ── Left content ─────────────────────────────────────── */}
                <div className="flex-1 space-y-4 min-w-0">

                    {/* Badge + ID row */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {badge && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${badge.bg} ${badge.text}`}>
                                        {badge.label}
                                    </span>
                                )}
                                {c.numeroConvocatoria && (
                                    <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                                        Ref: {c.numeroConvocatoria}
                                    </span>
                                )}
                                {c.idBdns && (
                                    <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                                        BDNS: {c.idBdns}
                                    </span>
                                )}
                                {showMatch && c.matchScore != null && !highMatch && (
                                    <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                                        {c.matchScore}% match
                                    </span>
                                )}
                                {favorita && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-amber-100 text-amber-900">
                                        <Star className="w-3 h-3 fill-current" /> Favorita
                                    </span>
                                )}
                                {estadoSolicitudMostrada && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                        estadoSolicitudMostrada === "solicitada"
                                            ? "bg-emerald-100 text-emerald-900"
                                            : "bg-slate-200 text-slate-700"
                                    }`}>
                                        {estadoSolicitudMostrada === "solicitada" ? "Ya solicitada" : "No solicitada"}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className={`${compactTitle ? "text-[15px] md:text-base line-clamp-none break-words [overflow-wrap:anywhere]" : "text-lg md:text-xl line-clamp-2"} font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-150`}>
                                {c.titulo}
                            </h3>
                        </div>
                    </div>

                    {/* Tags: tipo + sector + ubicacion */}
                    {(c.tipo || c.sector || c.ubicacion) && (
                        <div className="flex flex-wrap gap-2">
                            {mostrarTipo && (
                                <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">
                                    {c.tipo}
                                </span>
                            )}
                            {c.sector && (
                                <span className="px-3 py-1 rounded-full bg-surface-muted text-foreground-muted text-xs font-semibold">
                                    {c.sector}
                                </span>
                            )}
                            {c.ubicacion && (
                                <span className="px-3 py-1 rounded-full bg-surface-muted text-foreground-muted text-xs font-semibold">
                                    {c.ubicacion}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Organismo + fecha publicación */}
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

                    {/* Progress bar */}
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

                {/* ── Right metrics ─────────────────────────────────────── */}
                <div className="md:w-56 shrink-0 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">

                    {/* Presupuesto */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                            Presupuesto total
                        </p>
                        {presupuestoFmt ? (
                            <p className="text-3xl font-bold text-primary leading-none">
                                {presupuestoFmt}
                            </p>
                        ) : (
                            <p className="text-sm text-foreground-subtle italic">No especificado</p>
                        )}
                    </div>

                    {/* Fecha cierre */}
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

                    {/* CTA */}
                    <button
                        onClick={handleClick}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all ${
                            autenticado
                                ? "bg-[#0e7490] text-[#d3f1ff]"
                                : "bg-surface-muted text-foreground-muted"
                        }`}
                    >
                        {autenticado ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <ArrowRight className="w-3.5 h-3.5" /> Ver detalles
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" /> Iniciar sesión
                            </span>
                        )}
                    </button>

                    {autenticado && fuenteOficialUrl && (
                        <a
                            href={fuenteOficialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Ver fuente oficial
                        </a>
                    )}

                    {autenticado && estadoSolicitudProp && onEstadoSolicitudChange && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                Estado de solicitud
                            </p>
                            <select
                                value={estadoSolicitudProp}
                                onChange={(e) =>
                                    onEstadoSolicitudChange(e.target.value as "no_solicitada" | "solicitada")
                                }
                                className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
                            >
                                <option value="no_solicitada">No solicitada</option>
                                <option value="solicitada">Ya solicitada</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
