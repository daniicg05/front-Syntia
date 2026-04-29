"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, BookOpen, Briefcase, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, Clock, ExternalLink, FileCheck, FileText, Landmark,
  MapPin, Scale, Search, Sparkles, Target, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isAuthenticated } from "@/lib/auth";
import { guiasUsuarioApi, GuiaUsuarioDTO, GuiaSubvencion } from "@/lib/api";

const guidesStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const guideCardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// ── Guia Modal (slides gallery) ─────────────────────────────────────────────

const GUIA_SECTIONS = [
  { key: "resumen", label: "Resumen", icon: Sparkles, gradient: "from-violet-500 to-primary" },
  { key: "metodos", label: "Solicitud", icon: Landmark, gradient: "from-teal-500 to-emerald-600" },
  { key: "documentos", label: "Documentos", icon: FileText, gradient: "from-indigo-500 to-violet-600" },
  { key: "requisitos", label: "Requisitos", icon: Scale, gradient: "from-amber-500 to-orange-600" },
  { key: "pasos", label: "Pasos", icon: Target, gradient: "from-blue-500 to-cyan-600" },
  { key: "legal", label: "Legal", icon: FileCheck, gradient: "from-purple-500 to-indigo-600" },
] as const;

function GuiaUsuarioModal({ guiaUsuario, onClose }: { guiaUsuario: GuiaUsuarioDTO; onClose: () => void }) {
  const g = guiaUsuario.guia as GuiaSubvencion | undefined;
  const summary = g?.grant_summary;
  const docs: string[] = g?.required_documents ?? [];
  const reqs: string[] = g?.universal_requirements_lgs_art13 ?? [];
  const methods = g?.application_methods ?? [];
  const workflows = g?.workflows ?? [];
  const disclaimer = g?.legal_disclaimer ?? "";

  const sections = GUIA_SECTIONS.filter(s => {
    if (s.key === "resumen") return !!summary;
    if (s.key === "metodos") return methods.length > 0;
    if (s.key === "documentos") return docs.length > 0;
    if (s.key === "requisitos") return reqs.length > 0;
    if (s.key === "pasos") return workflows.length > 0 && (workflows[0].steps?.length ?? 0) > 0;
    if (s.key === "legal") return !!disclaimer || !!summary?.official_link;
    return false;
  });

  const [current, setCurrent] = useState(0);
  const total = sections.length;
  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(total - 1, c + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (total === 0) return null;
  const sec = sections[current];

  const renderContent = () => {
    const Icon = sec.icon;
    return (
      <motion.div key={sec.key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sec.gradient} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-base font-bold text-foreground">{sec.label}</h3>
        </div>

        {sec.key === "resumen" && summary && (
          <div className="space-y-2.5">
            {summary.title && (
              <div className="rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">Titulo</p>
                <p className="text-sm font-medium text-foreground">{summary.title}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {summary.organism && (
                <div className="rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">Organismo</p>
                  <p className="text-sm text-foreground">{summary.organism}</p>
                </div>
              )}
              {summary.who_can_apply && (
                <div className="rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">Beneficiarios</p>
                  <p className="text-sm text-foreground">{summary.who_can_apply}</p>
                </div>
              )}
              {summary.deadline && (
                <div className="rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">Plazo</p>
                  <p className="text-sm text-foreground flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-primary" />{summary.deadline}</p>
                </div>
              )}
            </div>
            {summary.objective && (
              <div className="rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">Objetivo</p>
                <p className="text-sm text-foreground leading-relaxed">{summary.objective}</p>
              </div>
            )}
          </div>
        )}

        {sec.key === "metodos" && (
          <div className="space-y-2">
            {methods.map((m, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{m.method}</p>
                  {m.description && <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">{m.description}</p>}
                  {m.official_portal && (
                    <a href={m.official_portal} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5">
                      <ExternalLink className="w-3 h-3" /> Acceder al portal
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sec.key === "documentos" && (
          <div className="space-y-1.5">
            {docs.map((d, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                <FileCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{d}</p>
              </div>
            ))}
          </div>
        )}

        {sec.key === "requisitos" && (
          <div className="space-y-1.5">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5">Ley General de Subvenciones</p>
              <p className="text-xs text-amber-900 dark:text-amber-100">Requisitos obligatorios del art. 13 LGS que debe cumplir el solicitante.</p>
            </div>
            {reqs.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-surface-muted/30 p-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{r}</p>
              </div>
            ))}
          </div>
        )}

        {sec.key === "pasos" && workflows[0]?.steps && (
          <div className="space-y-2">
            {workflows[0].steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-600 text-white text-xs font-bold flex items-center justify-center">{step.step ?? i + 1}</span>
                  {i < workflows[0].steps.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  {step.description && <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">{step.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {step.estimated_time_minutes && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-foreground-muted">
                        <Clock className="w-3 h-3" /> ~{step.estimated_time_minutes} min
                      </span>
                    )}
                    {step.official_link && (
                      <a href={step.official_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> Portal oficial
                      </a>
                    )}
                  </div>
                  {step.required_documents && step.required_documents.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {step.required_documents.map((doc, di) => (
                        <span key={di} className="inline-flex items-center gap-1 text-[10px] text-foreground-muted mr-2">
                          <FileText className="w-2.5 h-2.5" /> {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sec.key === "legal" && (
          <div className="space-y-3">
            {summary?.official_link && (
              <a href={summary.official_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1"><p className="text-sm font-medium text-foreground">Enlace oficial</p><p className="text-xs text-foreground-muted truncate">{summary.official_link}</p></div>
                <ExternalLink className="w-4 h-4 text-foreground-muted" />
              </a>
            )}
            {disclaimer && (
              <div className="bg-surface-muted rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">Aviso legal</p>
                <p className="text-xs text-foreground-muted italic leading-relaxed">{disclaimer}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-center items-start pt-[100px] bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-3xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[calc(90vh-100px)] flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground truncate max-w-xs">{guiaUsuario.titulo}</p>
              <p className="text-xs text-foreground-muted">{current + 1} / {total}</p>
            </div>
          </div>
          {guiaUsuario.puntuacion > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200 px-3 py-1 text-xs font-semibold">
              {guiaUsuario.puntuacion}% afinidad
            </span>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-muted">
          <div className="h-1 bg-emerald-500 transition-all duration-300 rounded-r" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border/50 overflow-x-auto scrollbar-hide">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setCurrent(i)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${current === i ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-foreground-muted hover:bg-surface-muted"}`}>
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-muted/50">
          <button onClick={prev} disabled={current === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <div className="flex items-center gap-1.5">
            {sections.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-emerald-500" : "w-2 bg-border hover:bg-foreground-muted"}`} />
            ))}
          </div>
          <button onClick={current === total - 1 ? onClose : next}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${current === total - 1 ? "bg-emerald-500 text-white hover:bg-emerald-600" : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"}`}>
            {current === total - 1 ? "Cerrar" : <>Siguiente <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Pagina principal ─────────────────────────────────────────────────────────

export default function GuiasPage() {
  const [search, setSearch] = useState("");
  const [modalUsuario, setModalUsuario] = useState<GuiaUsuarioDTO | null>(null);

  const [misGuias, setMisGuias] = useState<GuiaUsuarioDTO[]>([]);
  const [loadingGuias, setLoadingGuias] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const auth = isAuthenticated();
    setAutenticado(auth);
    if (!auth) {
      setLoadingGuias(false);
      return;
    }
    guiasUsuarioApi.list()
      .then((res) => setMisGuias(res.data))
      .catch((err) => console.warn("Error cargando guias:", err?.response?.status, err?.message))
      .finally(() => setLoadingGuias(false));
  }, []);

  const misGuiasFiltradas = misGuias.filter(
    (g) =>
      search === "" ||
      g.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      g.organismo?.toLowerCase().includes(search.toLowerCase()) ||
      g.sector?.toLowerCase().includes(search.toLowerCase()) ||
      g.proyectoNombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mis guias de subvenciones</h1>
        <p className="text-foreground-muted mt-1">
          Guias personalizadas generadas con IA para tus convocatorias
        </p>
      </div>

      {/* Search */}
      <div className="mb-7 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por titulo, organismo, proyecto..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Loading */}
      {loadingGuias && (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No autenticado */}
      {!autenticado && !loadingGuias && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
          <p className="text-foreground-muted mb-2">Inicia sesion para ver tus guias personalizadas</p>
          <p className="text-sm text-foreground-subtle">
            Las guias se generan automaticamente cuando analizas una convocatoria con IA.
          </p>
        </div>
      )}

      {/* Sin guias */}
      {autenticado && !loadingGuias && misGuias.length === 0 && (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
          <p className="text-foreground-muted mb-2">Aun no tienes guias generadas</p>
          <p className="text-sm text-foreground-subtle">
            Ve al catalogo de convocatorias y pulsa &quot;Analizar con IA&quot; en cualquier convocatoria para generar una guia personalizada.
          </p>
        </div>
      )}

      {/* Sin resultados de busqueda */}
      {autenticado && !loadingGuias && misGuias.length > 0 && misGuiasFiltradas.length === 0 && (
        <div className="text-center py-16 text-foreground-muted">
          No se encontraron guias con ese criterio.
        </div>
      )}

      {/* Grid de guias */}
      {!loadingGuias && misGuiasFiltradas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground-muted">
              {misGuiasFiltradas.length} {misGuiasFiltradas.length === 1 ? "guia" : "guias"}
            </span>
          </div>

          <motion.div
            key={search}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={guidesStagger}
          >
            {misGuiasFiltradas.map((g) => (
              <motion.article
                key={g.id}
                className="group bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer"
                variants={guideCardVariants}
                whileHover={{
                  y: -6,
                  scale: 1.01,
                  boxShadow: "0 16px 32px -8px rgba(0, 0, 0, 0.15)",
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalUsuario(g)}
              >
                {/* Gradient header */}
                <div className="h-24 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-emerald-500/40" />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                      {g.origen === "analisis" ? "Analisis IA" : "Recomendacion IA"}
                    </span>
                    {g.puntuacion > 0 && (
                      <span className="inline-block text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {g.puntuacion}% afinidad
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground mb-1 leading-snug line-clamp-2 text-sm">
                    {g.titulo}
                  </h3>
                  {g.organismo && (
                    <p className="text-xs text-foreground-muted line-clamp-1 mb-2">{g.organismo}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-foreground-subtle">
                      {g.proyectoNombre && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {g.proyectoNombre}
                        </span>
                      )}
                      {g.ubicacion && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {g.ubicacion}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      Ver <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalUsuario && (
          <GuiaUsuarioModal guiaUsuario={modalUsuario} onClose={() => setModalUsuario(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
