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
  ConvocatoriaDetalle, GuiaSubvencion, GuiaVisualStep, convocatoriasPublicasApi,
  convocatoriasUsuarioApi, favoritosApi,
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

// ── Analisis IA Card ─────────────────────────────────────────────────────────

interface AnalisisResultado {
  explicacion: string;
  guia: string;
}

function AnalisisIaCard({ convocatoriaId, onGuiaReady }: {
  convocatoriaId: number;
  onGuiaReady: (guia: GuiaSubvencion) => void;
}) {
  const [autenticado, setAutenticado] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    setAutenticado(isAuthenticated());
  }, []);

  const analizar = async () => {
    if (analizando) return;
    setAnalizando(true);
    setError(null);
    try {
      const res = await convocatoriasUsuarioApi.analisis(convocatoriaId);
      setResultado({ explicacion: res.data.explicacion, guia: res.data.guia });
      if (res.data.guiaCompleta) onGuiaReady(res.data.guiaCompleta);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Error al analizar. Inténtalo de nuevo.");
    } finally {
      setAnalizando(false);
    }
  };

  const pasos = useMemo(() => {
    if (!resultado?.guia) return [];
    return resultado.guia.split("|").map((raw) => {
      const match = raw.match(/^PASO\s*\d+\s*:\s*(.+?)(?:\s*[—–-]\s*(.+))?$/i);
      if (match) return { titulo: match[1].trim(), detalle: match[2]?.trim() || raw.replace(/^PASO\s*\d+\s*:\s*/i, "").trim() };
      return { titulo: raw.trim(), detalle: "" };
    });
  }, [resultado?.guia]);

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
        <p className="text-sm text-foreground-muted mb-3">
          Inicia sesión para analizar esta convocatoria con IA.
        </p>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <Lock className="w-4 h-4" /> Iniciar sesión
        </Link>
      </Card>
    );
  }

  if (resultado) {
    return (
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
            Análisis <span className="text-primary">IA</span>
          </p>
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-3">
          {resultado.explicacion}
        </p>

        {pasos.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">Pasos clave</p>
            {pasos.map((paso, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                className="w-full text-left"
              >
                <div className={`rounded-lg border transition-colors ${
                  expandedStep === i ? "border-primary/30 bg-primary/5" : "border-border/50 hover:border-border"
                }`}>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      expandedStep === i ? "bg-primary text-white" : "bg-surface-muted text-foreground-muted"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">{paso.titulo}</span>
                  </div>
                  {expandedStep === i && paso.detalle && (
                    <div className="px-3 pb-2.5 pt-0">
                      <p className="text-xs text-foreground-muted leading-relaxed pl-7">
                        {paso.detalle}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    );
  }

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

      <p className="text-sm text-foreground-muted mb-3">
        Resumen inteligente de requisitos, documentación y plazos.
      </p>

      <button
        type="button"
        onClick={analizar}
        disabled={analizando}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analizando ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Analizar con IA</>
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
      )}
    </Card>
  );
}

// ── Guía IA Card ─────────────────────────────────────────────────────────────

function GuiaGalleryModal({ guia, onClose }: { guia: GuiaSubvencion; onClose: () => void }) {
  const allSteps: GuiaVisualStep[] = guia.visual_guides?.flatMap((g) => g.steps) ?? [];
  const workflowSteps = guia.workflows?.flatMap((w) => w.steps) ?? [];
  const [current, setCurrent] = useState(0);
  const totalSlides = 1 + allSteps.length + 1; // summary + visual steps + docs/requirements

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

  const phaseColor = (phase: string) => {
    switch (phase) {
      case "preparation": return "bg-blue-500";
      case "submission": return "bg-emerald-500";
      case "review": return "bg-amber-500";
      case "post_submission": return "bg-purple-500";
      default: return "bg-primary";
    }
  };

  const phaseLabel = (phase: string) => {
    switch (phase) {
      case "preparation": return "Preparación";
      case "submission": return "Presentación";
      case "review": return "Revisión";
      case "post_submission": return "Post-envío";
      default: return phase;
    }
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Guía paso a paso</p>
              <p className="text-xs text-foreground-muted">{current + 1} / {totalSlides}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-muted">
          <div
            className="h-1 bg-primary transition-all duration-300 rounded-r"
            style={{ width: `${((current + 1) / totalSlides) * 100}%` }}
          />
        </div>

        {/* Slides */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {/* SLIDE 0: Summary */}
            {current === 0 && (
              <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Resumen
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground text-center leading-snug">
                  {guia.grant_summary?.title ?? "Guía de solicitud"}
                </h3>
                {guia.grant_summary?.organism && (
                  <p className="text-sm text-foreground-muted text-center">{guia.grant_summary.organism}</p>
                )}
                {guia.grant_summary?.objective && (
                  <div className="bg-surface-muted rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">Objetivo</p>
                    <p className="text-sm text-foreground">{guia.grant_summary.objective}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guia.grant_summary?.who_can_apply && (
                    <div className="bg-surface-muted rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">Quién puede solicitar</p>
                      <p className="text-sm text-foreground">{guia.grant_summary.who_can_apply}</p>
                    </div>
                  )}
                  {guia.grant_summary?.deadline && (
                    <div className="bg-surface-muted rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">Plazo</p>
                      <p className="text-sm text-foreground font-medium">{guia.grant_summary.deadline}</p>
                    </div>
                  )}
                </div>
                {guia.application_methods?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">Métodos de solicitud</p>
                    <div className="flex flex-wrap gap-2">
                      {guia.application_methods.map((m, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/8 text-primary text-xs font-medium border border-primary/15">
                          {m.method === "online" ? "Telemático" : m.method === "presencial" ? "Presencial" : m.method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SLIDES 1..N: Visual steps */}
            {current > 0 && current <= allSteps.length && (() => {
              const step = allSteps[current - 1];
              const wStep = workflowSteps.find((w) => w.step === step.step);
              return (
                <motion.div key={`step-${step.step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${phaseColor(step.phase)}`}>
                      {phaseLabel(step.phase)}
                    </span>
                    <span className="text-xs text-foreground-muted font-mono">Paso {step.step}</span>
                  </div>

                  {/* Step number circle + title */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${phaseColor(step.phase)} flex items-center justify-center text-white text-lg font-bold shrink-0`}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                      <p className="text-sm text-foreground-muted mt-1">{step.description}</p>
                    </div>
                  </div>

                  {/* User action */}
                  {wStep?.user_action && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Qué hacer
                      </p>
                      <p className="text-sm text-blue-900 dark:text-blue-100">{wStep.user_action}</p>
                    </div>
                  )}

                  {/* Portal action */}
                  {wStep?.portal_action && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resultado esperado
                      </p>
                      <p className="text-sm text-emerald-900 dark:text-emerald-100">{wStep.portal_action}</p>
                    </div>
                  )}

                  {/* Documents for this step */}
                  {wStep?.required_documents && wStep.required_documents.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" /> Documentos necesarios
                      </p>
                      <ul className="space-y-1">
                        {wStep.required_documents.map((doc, i) => (
                          <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Time + link */}
                  <div className="flex items-center justify-between pt-2">
                    {wStep?.estimated_time_minutes && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
                        <Clock className="w-3.5 h-3.5" /> ~{wStep.estimated_time_minutes} min
                      </span>
                    )}
                    {(step.official_link || wStep?.official_link) && (
                      <a
                        href={step.official_link || wStep?.official_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        Ir al portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* LAST SLIDE: Documents + Requirements */}
            {current === totalSlides - 1 && (
              <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-semibold">
                    <FileCheck className="w-3.5 h-3.5" /> Documentación y requisitos
                  </span>
                </div>

                {guia.required_documents?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">Documentos requeridos</p>
                    <ul className="space-y-1.5">
                      {guia.required_documents.map((doc, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {guia.universal_requirements_lgs_art13?.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2">Requisitos universales (LGS Art. 13)</p>
                    <ul className="space-y-1.5">
                      {guia.universal_requirements_lgs_art13.map((req, i) => (
                        <li key={i} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {guia.legal_disclaimer && (
                  <div className="bg-surface-muted rounded-xl p-4">
                    <p className="text-xs text-foreground-muted italic">{guia.legal_disclaimer}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-muted/50">
          <button
            onClick={prev}
            disabled={current === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-border hover:bg-foreground-muted"
                }`}
              />
            ))}
          </div>

          <button
            onClick={current === totalSlides - 1 ? onClose : next}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              current === totalSlides - 1
                ? "bg-primary text-white hover:bg-primary-hover"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
            }`}
          >
            {current === totalSlides - 1 ? "Cerrar" : <>Siguiente <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GuiaIaCard({ guia }: { guia: GuiaSubvencion | null }) {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
            Guía <span className="text-primary">IA</span>
          </p>
        </div>

        {guia ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground-muted">
              Guía paso a paso para solicitar esta convocatoria.
            </p>
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Ver guía
            </button>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">
            Guía no disponible. Pulsa «Analizar con IA» para generarla.
          </p>
        )}
      </Card>

      <AnimatePresence>
        {showGallery && guia && (
          <GuiaGalleryModal guia={guia} onClose={() => setShowGallery(false)} />
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
  const [guiaData, setGuiaData] = useState<GuiaSubvencion | null>(null);
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
            <AnalisisIaCard convocatoriaId={detalle.id} onGuiaReady={setGuiaData} />

            {/* Guía paso a paso */}
            <GuiaIaCard guia={guiaData} />

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
