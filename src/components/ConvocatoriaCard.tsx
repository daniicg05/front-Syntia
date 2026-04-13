"use client";

import { ConvocatoriaPublica } from "@/lib/api";
import { Calendar, MapPin, Building2, ExternalLink, Lock } from "lucide-react";

interface Props {
    convocatoria: ConvocatoriaPublica;
    onAccesoRequerido?: () => void;
    autenticado: boolean;
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

function sectoresBadgeColor(sector?: string): string {
    if (!sector) return "bg-surface-muted text-foreground-muted";
    const s = sector.toLowerCase();
    if (s.includes("tecno") || s.includes("innov") || s.includes("digit")) return "bg-blue-50 text-blue-700";
    if (s.includes("agr") || s.includes("rural") || s.includes("pesc")) return "bg-green-50 text-green-700";
    if (s.includes("indust") || s.includes("manufactu")) return "bg-amber-50 text-amber-700";
    if (s.includes("hostel") || s.includes("turis") || s.includes("restaur")) return "bg-orange-50 text-orange-700";
    if (s.includes("social") || s.includes("cultur") || s.includes("educ")) return "bg-purple-50 text-purple-700";
    if (s.includes("ambient") || s.includes("energia") || s.includes("sostenib")) return "bg-emerald-50 text-emerald-700";
    if (s.includes("salud") || s.includes("sanid") || s.includes("invest")) return "bg-cyan-50 text-cyan-700";
    return "bg-surface-muted text-foreground-muted";
}

export function ConvocatoriaCard({ convocatoria: c, onAccesoRequerido, autenticado }: Props) {
    const esCerrada = c.abierto === false;

    function handleClick() {
        if (!autenticado) {
            onAccesoRequerido?.();
            return;
        }
        if (c.urlOficial) {
            window.open(c.urlOficial, "_blank", "noopener,noreferrer");
        }
    }

    return (
        <div
            className={`group relative flex flex-col gap-3 p-5 bg-surface border border-border rounded-2xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                esCerrada ? "opacity-70" : ""
            }`}
        >
            {/* Sector badge */}
            <div className="flex items-start justify-between gap-2">
                {c.sector ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sectoresBadgeColor(c.sector)}`}>
                        {c.sector}
                    </span>
                ) : (
                    <span />
                )}
                {esCerrada && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                        Cerrada
                    </span>
                )}
                {c.abierto === true && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                        Abierta
                    </span>
                )}
            </div>

            {/* Título */}
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                {c.titulo}
            </h3>

            {/* Meta */}
            <div className="flex flex-col gap-1.5 mt-auto">
                {c.organismo && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{c.organismo}</span>
                    </div>
                )}
                {c.ubicacion && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{c.ubicacion}</span>
                    </div>
                )}
                {c.fechaCierre && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Cierre: {formatFecha(c.fechaCierre)}</span>
                    </div>
                )}
            </div>

            {/* CTA */}
            <button
                onClick={handleClick}
                className={`mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    autenticado
                        ? "bg-primary-light text-primary hover:bg-primary hover:text-white"
                        : "bg-surface-muted text-foreground-muted hover:bg-border"
                }`}
            >
                {autenticado ? (
                    <>
                        Ver convocatoria
                        <ExternalLink className="w-3.5 h-3.5" />
                    </>
                ) : (
                    <>
                        <Lock className="w-3.5 h-3.5" />
                        Iniciar sesión para ver detalle
                    </>
                )}
            </button>
        </div>
    );
}
