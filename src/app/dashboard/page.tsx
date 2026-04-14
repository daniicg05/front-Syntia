"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { dashboardApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, StatCard } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { fadeIn, slideUp, staggerChildren, staggerItem } from "@/lib/motion";
import {
  TrendingUp,
  FolderOpen,
  Star,
  Plus,
  ArrowRight,
  Lightbulb,
  Sparkles,
} from "lucide-react";

interface RecomendacionDTO {
  id: number;
  puntuacion: number;
  explicacion: string;
  presupuesto?: number;
  convocatoria: { titulo: string };
  proyecto: { id: number; nombre: string };
}

interface DashboardData {
  email: string;
  totalRecomendaciones: number;
  topRecomendaciones: Record<string, RecomendacionDTO[]>;
  roadmap: { proyecto: { id: number; nombre: string }; recomendacion: RecomendacionDTO }[];
}

function getGreeting(nombre: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Buenos días, ${nombre}`;
  if (hour < 20) return `Buenas tardes, ${nombre}`;
  return `Buenas noches, ${nombre}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("usuario");
  const shouldReduce = useReducedMotion();

  const mp = shouldReduce ? {} : { initial: "hidden", animate: "visible" };

  useEffect(() => {
    const user = getUser();
    setNombre(user?.sub?.split("@")[0] ?? "usuario");

    dashboardApi
      .get()
      .then((res) => setData(res.data as DashboardData))
      .catch(() => setError("No se pudieron cargar los datos del dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const totalProyectos = Object.keys(data?.topRecomendaciones ?? {}).length;
  const roadmapCount = data?.roadmap?.length ?? 0;

  return (
    <motion.div {...mp} variants={fadeIn}>
      {/* Header */}
      <motion.div {...mp} variants={slideUp} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-widest mb-1">
              Panel de control
            </p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {getGreeting(nombre)}
            </h1>
            <p className="text-foreground-muted mt-1.5 text-sm">
              Aquí tienes el resumen de tu actividad en Syntia
            </p>
          </div>
          <Link
            href="/proyectos/nuevo"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-hover font-semibold text-sm transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </Link>
        </div>
      </motion.div>

      {error && <Alert variant="error" message={error} className="mb-6" />}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <motion.div
          {...mp}
          variants={staggerChildren}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              label="Recomendaciones totales"
              value={data?.totalRecomendaciones ?? 0}
              icon={<Star className="w-5 h-5" />}
              color="green"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              label="Proyectos activos"
              value={totalProyectos}
              icon={<FolderOpen className="w-5 h-5" />}
              color="blue"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              label="Oportunidades en roadmap"
              value={roadmapCount}
              icon={<TrendingUp className="w-5 h-5" />}
              color="amber"
            />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top recommendations */}
        <motion.div {...mp} variants={slideUp} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2.5">
                <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                Top recomendaciones por proyecto
              </h2>
              <Link
                href="/proyectos"
                className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data && Object.keys(data.topRecomendaciones).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(data.topRecomendaciones).map(([proyectoNombre, recs]) =>
                  recs.length > 0 ? (
                    <div key={proyectoNombre}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="w-1 h-4 bg-primary rounded-full" />
                        <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                          {proyectoNombre}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {recs.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-start justify-between gap-4 p-3.5 bg-surface-muted rounded-xl hover:bg-border/40 transition-colors border border-transparent hover:border-border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {rec.convocatoria?.titulo ?? rec.proyecto?.nombre}
                              </p>
                              <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">
                                {rec.explicacion}
                              </p>
                            </div>
                            <ScoreBadge score={rec.puntuacion} size="sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-semibold mb-1.5">
                  Aún no tienes recomendaciones
                </p>
                <p className="text-sm text-foreground-muted mb-5 max-w-xs mx-auto">
                  Crea tu primer proyecto y Syntia buscará las subvenciones más compatibles con IA
                </p>
                <Link
                  href="/proyectos/nuevo"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear proyecto
                </Link>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div {...mp} variants={slideUp} className="flex flex-col gap-4">
          {/* Roadmap */}
          <Card>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-semibold text-foreground">Roadmap</h2>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-surface-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : data?.roadmap && data.roadmap.length > 0 ? (
              <div className="space-y-2">
                {data.roadmap.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-surface-muted rounded-xl hover:bg-border/30 transition-colors"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground-muted mb-0.5 truncate">
                        {item.proyecto.nombre}
                      </p>
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                        {item.recomendacion.convocatoria?.titulo}
                      </p>
                      <div className="mt-1.5">
                        <ScoreBadge score={item.recomendacion.puntuacion} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted text-center py-4">
                Tu roadmap aparecerá aquí
              </p>
            )}
          </Card>

          {/* Tip card with gradient */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-hover text-white">
            <div className="absolute -top-5 -right-5 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute bottom-1 -right-3 w-16 h-16 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" />
                <p className="text-sm font-bold">Consejo</p>
              </div>
              <p className="text-xs text-white/85 leading-relaxed mb-3">
                Cuanto más detallada sea la descripción de tu proyecto, mejores resultados
                obtendrás del matching con IA.
              </p>
              <Link
                href="/proyectos/nuevo"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Añadir proyecto
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
