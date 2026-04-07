"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, StatCard } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  FolderOpen,
  Star,
  Plus,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface RecomendacionDTO {
  id: number;
  puntuacion: number;
  explicacion: string;
  convocatoria: { titulo: string };
  proyecto: { id: number; nombre: string };
}

interface DashboardData {
  email: string;
  totalRecomendaciones: number;
  topRecomendaciones: Record<string, RecomendacionDTO[]>;
  roadmap: { proyecto: { id: number; nombre: string }; recomendacion: RecomendacionDTO }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    dashboardApi
      .get()
      .then((res) => setData(res.data as DashboardData))
      .catch(() => setError("No se pudieron cargar los datos del dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const nombre = user?.sub?.split("@")[0] ?? "usuario";
  const totalProyectos = Object.keys(data?.topRecomendaciones ?? {}).length;
  const roadmapCount = data?.roadmap?.length ?? 0;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {nombre}
          </h1>
          <p className="text-foreground-muted mt-1">
            Aquí tienes el resumen de tu actividad en Syntia
          </p>
        </div>
        <Link
          href="/proyectos/nuevo"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-hover font-semibold text-sm transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </Link>
      </div>

      {error && <Alert variant="error" message={error} className="mb-6" />}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Recomendaciones totales"
            value={data?.totalRecomendaciones ?? 0}
            icon={<Star className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Proyectos activos"
            value={totalProyectos}
            icon={<FolderOpen className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Oportunidades en roadmap"
            value={roadmapCount}
            icon={<TrendingUp className="w-5 h-5" />}
            color="amber"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top recommendations */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Top recomendaciones por proyecto
              </h2>
              <Link href="/proyectos" className="text-sm text-primary hover:underline font-medium">
                Ver todos
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data && Object.keys(data.topRecomendaciones).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(data.topRecomendaciones).map(([proyectoNombre, recs]) =>
                  recs.length > 0 ? (
                    <div key={proyectoNombre}>
                      <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-2">
                        {proyectoNombre}
                      </p>
                      <div className="space-y-2">
                        {recs.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-start justify-between gap-4 p-3 bg-surface-muted rounded-xl hover:bg-border/40 transition-colors"
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
              <div className="text-center py-10">
                <FolderOpen className="w-12 h-12 text-foreground-subtle mx-auto mb-3" />
                <p className="text-foreground-muted font-medium mb-1">
                  Aún no tienes recomendaciones
                </p>
                <p className="text-sm text-foreground-subtle mb-4">
                  Crea tu primer proyecto para empezar
                </p>
                <Link
                  href="/proyectos/nuevo"
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear proyecto
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Roadmap sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Roadmap
              </h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-surface-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : data?.roadmap && data.roadmap.length > 0 ? (
              <div className="space-y-2">
                {data.roadmap.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-surface-muted rounded-xl"
                  >
                    <p className="text-xs font-medium text-foreground-muted mb-0.5">
                      {item.proyecto.nombre}
                    </p>
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.recomendacion.convocatoria?.titulo}
                    </p>
                    <ScoreBadge score={item.recomendacion.puntuacion} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted text-center py-4">
                Tu roadmap aparecerá aquí
              </p>
            )}
          </Card>

          {/* Quick tip */}
          <Card className="bg-primary-light border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary mb-1">Consejo</p>
                <p className="text-xs text-primary/80 leading-relaxed">
                  Cuanto más detallada sea la descripción de tu proyecto, mejores resultados
                  obtendrás del matching con IA.
                </p>
                <Link
                  href="/proyectos/nuevo"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline"
                >
                  Añadir proyecto
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
