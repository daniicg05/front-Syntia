"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, Briefcase, Building2, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, Clock, Euro, ExternalLink, FileCheck, FileText, Hash, Landmark,
  Lock, MapPin, Scale, ShoppingBag, Sparkles, Star, Target, Users, X,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  ConvocatoriaDetalle, convocatoriasPublicasApi,
  convocatoriasUsuarioApi, favoritosApi,
  AnalisisCompleto, AnalisisSlide, AnalisisItem,
} from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtPresupuesto(p: number | null | undefined): string {
  if (p == null) return "—";
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace(".", ",")}M\u00A0\u20AC`;
  if (p >= 1_000) return `${Math.round(p / 1_000)}k\u00A0\u20AC`;
  return `${new Intl.NumberFormat("es-ES").format(Math.round(p))}\u00A0\u20AC`;
}

function tipoAdminLabel(code: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = { C: "Estatal", A: "Autonómico", L: "Local", O: "Otros" };
  return code.split(", ").map(c => map[c.trim()] ?? c).join(", ");
}

function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TagList({ items, emptyText = "No especificado" }: { items: string[]; emptyText?: string }) {
  if (items.length === 0) return <p className="text-sm text-foreground-muted">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-medium border border-primary/15">
          {item}
        </span>
      ))}
    </div>
  );
}

function MetaRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-foreground-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function SidebarCard({ icon: Icon, title, accent, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${accent ?? "bg-surface-muted"} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${accent ? "text-white" : "text-foreground-muted"}`} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">{title}</p>
      </div>
      {children}
    </Card>
  );
}

// ── Analisis IA Card (new: comprehensive analysis with slides gallery) ──────

const SLIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  resumen: Sparkles, elegibilidad: Users, gastos: Euro, criterios: Target,
  documentacion: FileText, procedimiento: Landmark, plazos: CalendarDays,
  obligaciones: Scale, justificacion: FileCheck, advertencias: Star,
};

const SLIDE_COLORS: Record<string, string> = {
  resumen: "from-violet-500 to-primary", elegibilidad: "from-emerald-500 to-teal-600",
  gastos: "from-blue-500 to-cyan-600", criterios: "from-amber-500 to-orange-600",
  documentacion: "from-indigo-500 to-violet-600", procedimiento: "from-teal-500 to-emerald-600",
  plazos: "from-orange-500 to-red-500", obligaciones: "from-purple-500 to-indigo-600",
  justificacion: "from-cyan-500 to-blue-600", advertencias: "from-red-500 to-rose-600",
};

function compatBadge(nivel: string) {
  switch (nivel) {
    case "ALTA": return { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-200", text: "Alta compatibilidad" };
    case "MEDIA": return { bg: "bg-amber-500/10 text-amber-600 border-amber-200", text: "Compatibilidad media" };
    case "BAJA": return { bg: "bg-red-500/10 text-red-600 border-red-200", text: "Baja compatibilidad" };
    default: return { bg: "bg-gray-500/10 text-gray-600 border-gray-200", text: "No evaluable" };
  }
}

function estadoIcon(estado?: string | null) {
  switch (estado) {
    case "cumple": return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    case "no_cumple": return <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    case "verificar": return <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    default: return <span className="w-4 h-4 shrink-0" />;
  }
}

function AnalisisGalleryModal({ analisis, onClose }: { analisis: AnalisisCompleto; onClose: () => void }) {
  const slides = analisis.slides ?? [];
  const totalSlides = slides.length + 1; // slides + resources/disclaimer
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(totalSlides - 1, c + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const renderSlide = (slide: AnalisisSlide, idx: number) => {
    const Icon = SLIDE_ICONS[slide.tipo] ?? FileText;
    const gradient = SLIDE_COLORS[slide.tipo] ?? "from-primary to-primary";
    return (
      <motion.div key={`slide-${idx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{slide.titulo}</h3>
            <span className="text-xs text-foreground-muted capitalize">{slide.tipo}</span>
          </div>
        </div>

        {slide.contenido && (
          <p className="text-sm text-foreground leading-relaxed">{slide.contenido}</p>
        )}

        {slide.items?.length > 0 && (
          <div className="space-y-2">
            {slide.items.map((item, i) => (
              <div key={i} className={`rounded-xl border p-3 ${
                item.estado === "cumple" ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800" :
                item.estado === "no_cumple" ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800" :
                item.estado === "verificar" ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800" :
                item.tipo === "advertencia" ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800" :
                item.tipo === "consejo" ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800" :
                "border-border/50 bg-surface-muted/30"
              }`}>
                <div className="flex items-start gap-2.5">
                  {item.estado ? estadoIcon(item.estado) : (
                    item.tipo === "criterio" && item.peso != null ? (
                      <span className="inline-flex items-center justify-center w-8 h-5 rounded bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{item.peso}%</span>
                    ) : item.tipo === "paso" ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    ) : (
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground-muted/40 shrink-0" />
                    )
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.titulo}</p>
                    {item.descripcion && <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">{item.descripcion}</p>}
                    {item.sub_items && item.sub_items.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {item.sub_items.map((sub, si) => (
                          <li key={si} className="text-xs text-foreground-muted flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground-muted/30 shrink-0" />
                            {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.tiempo_minutos && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-foreground-muted">
                        <Clock className="w-3 h-3" /> ~{item.tiempo_minutos} min
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0 mt-0.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {slide.consejo && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Consejo personalizado</p>
            <p className="text-sm text-blue-900 dark:text-blue-100">{slide.consejo}</p>
          </div>
        )}

        {slide.alerta && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Atención</p>
            <p className="text-sm text-amber-900 dark:text-amber-100">{slide.alerta}</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-3xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Análisis completo</p>
              <p className="text-xs text-foreground-muted">{current + 1} / {totalSlides}</p>
            </div>
          </div>
          {analisis.compatibilidad && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${compatBadge(analisis.compatibilidad.nivel).bg}`}>
                {compatBadge(analisis.compatibilidad.nivel).text}
                {analisis.compatibilidad.puntuacion > 0 && (
                  <span className="font-bold">{analisis.compatibilidad.puntuacion}%</span>
                )}
              </span>
            </div>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-muted">
          <div className="h-1 bg-primary transition-all duration-300 rounded-r" style={{ width: `${((current + 1) / totalSlides) * 100}%` }} />
        </div>

        {/* Slide tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border/50 overflow-x-auto scrollbar-hide">
          {slides.map((s, i) => {
            const Icon = SLIDE_ICONS[s.tipo] ?? FileText;
            return (
              <button key={i} onClick={() => setCurrent(i)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  current === i ? "bg-primary/10 text-primary" : "text-foreground-muted hover:bg-surface-muted"
                }`}>
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.titulo.split(" ").slice(0, 2).join(" ")}</span>
              </button>
            );
          })}
          <button onClick={() => setCurrent(totalSlides - 1)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              current === totalSlides - 1 ? "bg-primary/10 text-primary" : "text-foreground-muted hover:bg-surface-muted"
            }`}>
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Recursos</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {current < slides.length && renderSlide(slides[current], current)}

            {current === totalSlides - 1 && (
              <motion.div key="recursos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Enlaces y recursos</h3>
                </div>

                {analisis.recursos && (
                  <div className="space-y-2">
                    {analisis.recursos.url_convocatoria && (
                      <a href={analisis.recursos.url_convocatoria} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                        <BookOpen className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1"><p className="text-sm font-medium text-foreground">Convocatoria oficial</p><p className="text-xs text-foreground-muted truncate">Portal BDNS</p></div>
                        <ExternalLink className="w-4 h-4 text-foreground-muted" />
                      </a>
                    )}
                    {analisis.recursos.url_bases_reguladoras && (
                      <a href={analisis.recursos.url_bases_reguladoras} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1"><p className="text-sm font-medium text-foreground">Bases reguladoras</p><p className="text-xs text-foreground-muted truncate">Texto integro</p></div>
                        <ExternalLink className="w-4 h-4 text-foreground-muted" />
                      </a>
                    )}
                    {analisis.recursos.url_sede_electronica && (
                      <a href={analisis.recursos.url_sede_electronica} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                        <Landmark className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1"><p className="text-sm font-medium text-foreground">Sede electrónica</p><p className="text-xs text-foreground-muted truncate">Presentar solicitud</p></div>
                        <ExternalLink className="w-4 h-4 text-foreground-muted" />
                      </a>
                    )}
                    {analisis.recursos.documentos?.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                        <FileCheck className="w-5 h-5 text-foreground-muted shrink-0" />
                        <div className="flex-1"><p className="text-sm font-medium text-foreground">{doc.nombre}</p>{doc.descripcion && <p className="text-xs text-foreground-muted">{doc.descripcion}</p>}</div>
                        {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 text-primary" /></a>}
                      </div>
                    ))}
                  </div>
                )}

                {analisis.disclaimer && (
                  <div className="bg-surface-muted rounded-xl p-4 mt-4">
                    <p className="text-xs text-foreground-muted italic">{analisis.disclaimer}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-muted/50">
          <button onClick={prev} disabled={current === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-border hover:bg-foreground-muted"}`} />
            ))}
          </div>
          <button onClick={current === totalSlides - 1 ? onClose : next}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              current === totalSlides - 1 ? "bg-primary text-white hover:bg-primary-hover" : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
            }`}>
            {current === totalSlides - 1 ? "Cerrar" : <>Siguiente <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnalisisIaCard({ convocatoriaId }: { convocatoriaId: number }) {
  const [autenticado, setAutenticado] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [analisis, setAnalisis] = useState<AnalisisCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => { setAutenticado(isAuthenticated()); }, []);

  const analizar = async () => {
    if (analizando) return;
    setAnalizando(true);
    setError(null);
    try {
      const res = await convocatoriasUsuarioApi.analisis(convocatoriaId);
      setAnalisis(res.data);
      setShowGallery(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Error al analizar. Inténtalo de nuevo.");
    } finally {
      setAnalizando(false);
    }
  };

  if (!autenticado) {
    return (
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
            Analizar con <span className="text-primary">IA</span>
          </p>
        </div>
        <p className="text-sm text-foreground-muted mb-3">Inicia sesión para analizar esta convocatoria con IA.</p>
        <Link href="/login" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
          <Lock className="w-4 h-4" /> Iniciar sesión
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
            Analizar con <span className="text-primary">IA</span>
          </p>
        </div>

        {analisis ? (
          <div className="space-y-3">
            {/* Compatibility badge */}
            {analisis.compatibilidad && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${compatBadge(analisis.compatibilidad.nivel).bg}`}>
                    {compatBadge(analisis.compatibilidad.nivel).text}
                    {analisis.compatibilidad.puntuacion > 0 && <span className="font-bold">{analisis.compatibilidad.puntuacion}%</span>}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{analisis.compatibilidad.explicacion}</p>
              </div>
            )}

            {/* Quick slide preview */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">Contenido del análisis</p>
              {analisis.slides?.slice(0, 4).map((s, i) => {
                const Icon = SLIDE_ICONS[s.tipo] ?? FileText;
                return (
                  <button key={i} type="button" onClick={() => { setShowGallery(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left">
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{s.titulo}</span>
                  </button>
                );
              })}
              {(analisis.slides?.length ?? 0) > 4 && (
                <p className="text-xs text-foreground-muted text-center">+{analisis.slides.length - 4} secciones más</p>
              )}
            </div>

            <button type="button" onClick={() => setShowGallery(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
              <BookOpen className="w-4 h-4" /> Ver análisis completo
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground-muted mb-3">
              Análisis completo: requisitos, documentación, plazos, gastos subvencionables y guía paso a paso personalizada.
            </p>
            <button type="button" onClick={analizar} disabled={analizando}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {analizando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Analizar con IA</>
              )}
            </button>
          </>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
        )}
      </Card>

      <AnimatePresence>
        {showGallery && analisis && (
          <AnalisisGalleryModal analisis={analisis} onClose={() => setShowGallery(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="h-4 w-28 bg-surface-muted rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-8 animate-pulse space-y-5">
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-surface-muted rounded-full" />
              <div className="h-6 w-20 bg-surface-muted rounded-full" />
            </div>
            <div className="h-8 w-4/5 bg-surface-muted rounded" />
            <div className="h-4 w-2/3 bg-surface-muted rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-surface-muted rounded" />
              <div className="h-3 w-5/6 bg-surface-muted rounded" />
              <div className="h-3 w-3/4 bg-surface-muted rounded" />
            </div>
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
              <div className="h-4 w-32 bg-surface-muted rounded mb-3" />
              <div className="h-3 w-full bg-surface-muted rounded" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-3 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-24 bg-surface-muted rounded mb-3" />
              <div className="h-6 w-16 bg-surface-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConvocatoriaDetallePage() {
  const params = useParams<{ id: string }>();
  const idRaw = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const convocatoriaId = useMemo(() => {
    const parsed = Number(idRaw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [idRaw]);

  const [detalle, setDetalle] = useState<ConvocatoriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [favToggling, setFavToggling] = useState(false);

  useEffect(() => {
    if (convocatoriaId !== null) {
      favoritosApi.ids().then(r => {
        setEsFavorito(new Set(r.data).has(convocatoriaId));
      }).catch(() => {});
    }
  }, [convocatoriaId]);

  async function toggleFavorito() {
    if (convocatoriaId === null || favToggling) return;
    setFavToggling(true);
    try {
      if (esFavorito) {
        await favoritosApi.eliminar(convocatoriaId);
        setEsFavorito(false);
      } else {
        await favoritosApi.agregar(convocatoriaId);
        setEsFavorito(true);
      }
    } catch { /* silently fail */ }
    finally { setFavToggling(false); }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (convocatoriaId === null) { if (mounted) { setNotFound(true); setLoading(false); } return; }
      setLoading(true); setError(false); setNotFound(false);
      try {
        const r = await convocatoriasPublicasApi.detalle(convocatoriaId);
        if (mounted) setDetalle(r.data);
      } catch (err: unknown) {
        if (!mounted) return;
        const s = (err as { response?: { status?: number } })?.response?.status;
        if (s === 404) setNotFound(true); else setError(true);
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [convocatoriaId]);

  if (loading) return <DetailSkeleton />;

  if (notFound || error || !detalle) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <Card className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {notFound ? "Convocatoria no encontrada" : "Error al cargar"}
          </h1>
          <p className="text-sm text-foreground-muted mb-4">
            {notFound ? "No existe una convocatoria con ese identificador." : "Ha ocurrido un problema. Inténtalo más tarde."}
          </p>
          <Link href="/home" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al listado
          </Link>
        </Card>
      </section>
    );
  }

  const daysLeft = daysUntil(detalle.fechaCierre);
  const nivel = tipoAdminLabel(detalle.tipoAdmin);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-5">
        <Link href="/home" className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* ── Main column ──────────────────────────────────────────── */}
        <motion.div
          className="lg:col-span-7 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Hero card */}
          <Card padding="lg">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {detalle.abierto != null && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  detalle.abierto
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                    : "bg-red-500/10 text-red-600 border border-red-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${detalle.abierto ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                  {detalle.abierto ? "Abierta" : "Cerrada"}
                </span>
              )}
              {detalle.tipo && (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted">
                  {detalle.tipo}
                </span>
              )}
              {detalle.mrr && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  MRR
                </span>
              )}
              {daysLeft != null && daysLeft > 0 && daysLeft <= 30 && (
                <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  {daysLeft} días restantes
                </span>
              )}
            </div>

            {/* Title */}
            <p className="text-base font-semibold text-foreground leading-snug" role="heading" aria-level={1}>
              {detalle.titulo ?? `Convocatoria #${detalle.id}`}
            </p>

            {/* Quick meta under title */}
            {(detalle.organismo || detalle.sector) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                {detalle.organismo && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {detalle.organismo}
                  </span>
                )}
                {detalle.sector && (
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> {detalle.sector}
                  </span>
                )}
                {detalle.ubicacion && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {detalle.ubicacion}
                  </span>
                )}
              </div>
            )}

            {/* IDs */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-foreground-muted">
              {detalle.idBdns && (
                <span className="inline-flex items-center gap-1 bg-surface-muted rounded-lg px-2.5 py-1.5 font-mono">
                  <Hash className="w-3 h-3" /> BDNS: {detalle.idBdns}
                </span>
              )}
              {detalle.numeroConvocatoria && (
                <span className="inline-flex items-center gap-1 bg-surface-muted rounded-lg px-2.5 py-1.5 font-mono">
                  N.º {detalle.numeroConvocatoria}
                </span>
              )}
            </div>
          </Card>

          {/* Descripción */}
          {detalle.descripcion && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Descripción
              </h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {detalle.descripcion}
              </p>
            </Card>
          )}

          {/* Texto completo */}
          {detalle.textoCompleto && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Descripción detallada
              </h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {detalle.textoCompleto}
              </p>
            </Card>
          )}

          {/* Información general — grid de MetaRows */}
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-1 inline-flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Información de la convocatoria
            </h2>
            <div className="divide-y divide-border/50">
              {nivel && (
                <MetaRow icon={Building2} label="Nivel administrativo">
                  {nivel}
                </MetaRow>
              )}
              {detalle.organismo && (
                <MetaRow icon={Building2} label="Organismo convocante">
                  {detalle.organismo}
                </MetaRow>
              )}
              {detalle.organos.length > 0 && (
                <MetaRow icon={Landmark} label="Órganos">
                  <TagList items={detalle.organos} />
                </MetaRow>
              )}
              {detalle.finalidad && (
                <MetaRow icon={FileText} label="Finalidad">
                  {detalle.finalidad}
                </MetaRow>
              )}
              {detalle.finalidades.length > 0 && (
                <MetaRow icon={FileText} label="Finalidades (catálogo BDNS)">
                  <TagList items={detalle.finalidades} />
                </MetaRow>
              )}
              {detalle.instrumentos.length > 0 && (
                <MetaRow icon={FileText} label="Instrumentos">
                  <TagList items={detalle.instrumentos} />
                </MetaRow>
              )}
              {detalle.urlOficial && (
                <MetaRow icon={ExternalLink} label="Enlace oficial">
                  <a href={detalle.urlOficial} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline break-all">
                    Ver en BDNS <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </MetaRow>
              )}
            </div>
          </Card>

          {/* Beneficiarios */}
          {detalle.tiposBeneficiario.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Tipos de beneficiario
              </h2>
              <TagList items={detalle.tiposBeneficiario} />
            </Card>
          )}

          {/* Regiones */}
          {detalle.regiones.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Ámbito geográfico
              </h2>
              <TagList items={detalle.regiones} />
            </Card>
          )}

          {/* Actividades */}
          {detalle.actividades?.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> Actividades económicas
              </h2>
              <TagList items={detalle.actividades} />
            </Card>
          )}

          {/* Objetivos */}
          {detalle.objetivos?.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Objetivos
              </h2>
              <TagList items={detalle.objetivos} />
            </Card>
          )}

          {/* Reglamentos */}
          {detalle.reglamentos?.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Marco regulatorio
              </h2>
              <TagList items={detalle.reglamentos} />
            </Card>
          )}

          {/* Sectores / Productos */}
          {detalle.sectoresProducto?.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3 inline-flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> Sectores y productos
              </h2>
              <TagList items={detalle.sectoresProducto} />
            </Card>
          )}
        </motion.div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <motion.aside
          className="lg:col-span-3 lg:sticky lg:top-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="space-y-4">
            {/* Fechas */}
            <SidebarCard icon={CalendarDays} title="Fechas clave" accent="bg-primary">
              <div className="space-y-2.5">
                {detalle.fechaInicio && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Inicio</span>
                    <span className="font-medium text-foreground">{fmtDate(detalle.fechaInicio)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Publicación</span>
                  <span className="font-medium text-foreground">{fmtDate(detalle.fechaPublicacion)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Cierre</span>
                  <span className={`font-semibold ${daysLeft != null && daysLeft <= 7 ? "text-red-600" : daysLeft != null && daysLeft <= 30 ? "text-orange-600" : "text-foreground"}`}>
                    {fmtDate(detalle.fechaCierre)}
                  </span>
                </div>
                {daysLeft != null && daysLeft > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-foreground-muted">Tiempo restante</span>
                      <span className="font-bold text-foreground">{daysLeft} días</span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${daysLeft <= 7 ? "bg-red-500" : daysLeft <= 30 ? "bg-orange-500" : "bg-primary"}`}
                        style={{ width: `${Math.max(5, Math.min(100, 100 - (daysLeft / 90 * 100)))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </SidebarCard>

            {/* Presupuesto */}
            {detalle.presupuesto != null && (
              <SidebarCard icon={Euro} title="Presupuesto" accent="bg-emerald-500">
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {fmtPresupuesto(detalle.presupuesto)}
                </p>
              </SidebarCard>
            )}

            {/* Analizar con IA */}
            <AnalisisIaCard convocatoriaId={detalle.id} />

            {/* Favorito */}
            <button
              type="button"
              onClick={toggleFavorito}
              disabled={favToggling}
              aria-label={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all group disabled:opacity-50 ${
                esFavorito
                  ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-border bg-surface text-foreground-muted hover:bg-primary hover:text-white hover:border-primary"
              }`}
            >
              <Star className={`w-4 h-4 transition-colors ${
                esFavorito ? "fill-amber-500 text-amber-500" : "group-hover:fill-white"
              }`} />
              {esFavorito ? "En favoritos" : "Añadir a favoritos"}
            </button>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
