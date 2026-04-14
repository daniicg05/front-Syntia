"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { proyectosApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { staggerChildren, staggerItem, fadeIn } from "@/lib/motion";
import { useReducedMotion } from "framer-motion";
import { FolderOpen, Plus, Trash2, ArrowRight, Pencil, MoreVertical, Banknote, Tag } from "lucide-react";

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  sector?: string;
  presupuesto?: number;
  fechaCreacion?: string;
}

const PROJECT_COLORS = [
  { bg: "bg-primary-light", text: "text-primary" },
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-amber-50", text: "text-amber-600" },
  { bg: "bg-purple-50", text: "text-purple-600" },
  { bg: "bg-emerald-50", text: "text-emerald-600" },
];

function formatPresupuesto(presupuesto?: number): string | null {
  if (presupuesto == null || presupuesto === 0) return null;
  if (presupuesto >= 1_000_000) {
    return `${(presupuesto / 1_000_000).toFixed(1).replace(".", ",")} M€`;
  }
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(presupuesto);
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6">
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="22" width="90" height="63" rx="8" fill="#b9eaff" />
          <rect x="25" y="12" width="36" height="20" rx="4" fill="#005a71" opacity="0.25" />
          <rect x="30" y="40" width="60" height="6" rx="3" fill="#005a71" opacity="0.2" />
          <rect x="30" y="52" width="44" height="5" rx="2.5" fill="#005a71" opacity="0.12" />
          <rect x="30" y="63" width="52" height="5" rx="2.5" fill="#005a71" opacity="0.12" />
          <circle cx="90" cy="75" r="18" fill="#005a71" />
          <path d="M90 67v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M86 75h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Aún no tienes proyectos
      </h2>
      <p className="text-foreground-muted text-sm mb-6 max-w-xs mx-auto">
        Crea tu primer proyecto y Syntia buscará automáticamente las subvenciones más
        compatibles.
      </p>
      <Link
        href="/proyectos/nuevo"
        className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        <Plus className="w-4 h-4" />
        Crear primer proyecto
      </Link>
    </div>
  );
}

export default function ProyectosPage() {
  const toast = useToast();
  const shouldReduce = useReducedMotion();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const motionProps = shouldReduce ? {} : { initial: "hidden", animate: "visible" };

  useEffect(() => {
    proyectosApi
      .list()
      .then((res) => setProyectos(res.data as Proyecto[]))
      .catch(() => setError("No se pudieron cargar los proyectos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    setOpenMenuId(null);
    if (!confirm("¿Seguro que quieres eliminar este proyecto?")) return;
    setDeleting(id);
    const loadingId = toast.loading("Eliminando proyecto...");
    try {
      await proyectosApi.delete(id);
      setProyectos((prev) => prev.filter((p) => p.id !== id));
      toast.update(loadingId, "success", "Proyecto eliminado correctamente");
    } catch {
      toast.update(loadingId, "error", "No se pudo eliminar el proyecto");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Invisible overlay to close open menus */}
      {openMenuId !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Page header */}
      <motion.div
        {...motionProps}
        variants={fadeIn}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis proyectos</h1>
          <p className="text-foreground-muted mt-1">
            Gestiona tus proyectos y consulta sus subvenciones compatibles
          </p>
        </div>
        <Link
          href="/proyectos/nuevo"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-hover font-semibold text-sm transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </Link>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-destructive-light border border-destructive/20 text-destructive rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && proyectos.length === 0 && !error && (
        <motion.div {...motionProps} variants={fadeIn}>
          <Card>
            <EmptyState />
          </Card>
        </motion.div>
      )}

      {/* Project grid */}
      {!loading && proyectos.length > 0 && (
        <motion.div
          {...motionProps}
          variants={staggerChildren}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {proyectos.map((proyecto, index) => {
              const color = PROJECT_COLORS[index % PROJECT_COLORS.length];
              const presupuestoFmt = formatPresupuesto(proyecto.presupuesto);

              return (
                <motion.div
                  key={proyecto.id}
                  variants={staggerItem}
                  initial="hidden"
                  animate="visible"
                  exit={shouldReduce ? {} : { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  layout
                >
                  <Card className="flex flex-col h-full">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}>
                        <FolderOpen className="w-5 h-5" />
                      </div>

                      {/* Kebab menu */}
                      <div className="relative z-20">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === proyecto.id ? null : proyecto.id)}
                          className="p-1.5 rounded-lg text-foreground-subtle hover:text-foreground hover:bg-surface-muted transition-colors"
                          aria-label="Opciones del proyecto"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === proyecto.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-9 z-30 w-36 bg-surface border border-border rounded-xl shadow-lg overflow-hidden"
                            >
                              <Link
                                href={`/proyectos/${proyecto.id}/editar`}
                                className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted transition-colors"
                                onClick={() => setOpenMenuId(null)}
                              >
                                <Pencil className="w-3.5 h-3.5 text-foreground-subtle" />
                                Editar
                              </Link>
                              <button
                                onClick={() => handleDelete(proyecto.id)}
                                disabled={deleting === proyecto.id}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deleting === proyecto.id ? "Eliminando..." : "Eliminar"}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                      {proyecto.nombre}
                    </h3>
                    <p className="text-sm text-foreground-muted leading-relaxed line-clamp-2 flex-1">
                      {proyecto.descripcion}
                    </p>

                    {/* Tags */}
                    {(proyecto.sector || presupuestoFmt) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {proyecto.sector && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-foreground-muted border border-border">
                            <Tag className="w-3 h-3" />
                            {proyecto.sector}
                          </span>
                        )}
                        {presupuestoFmt && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                            <Banknote className="w-3 h-3" />
                            {presupuestoFmt}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Link
                        href={`/proyectos/${proyecto.id}/recomendaciones`}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl text-sm font-semibold bg-primary-light text-primary hover:bg-primary hover:text-white transition-all duration-200"
                      >
                        Ver subvenciones
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
