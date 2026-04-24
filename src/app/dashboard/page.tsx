"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { dashboardApi, favoritosApi, ConvocatoriaPublica } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { Card, StatCard } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { fadeIn, slideUp, staggerChildren, staggerItem } from "@/lib/motion";
import {
  FolderOpen,
  Star,
  Plus,
  ArrowRight,
  Sparkles,
  Heart,
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
  const [favoritos, setFavoritos] = useState<ConvocatoriaPublica[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [favLoading, setFavLoading] = useState(true);
  const shouldReduce = useReducedMotion();

  const mp = shouldReduce ? {} : { initial: "hidden", animate: "visible" };

  function handleFavoritoChange(convocatoriaId: number, esFav: boolean) {
    setFavIds(prev => {
      const next = new Set(prev);
      if (esFav) next.add(convocatoriaId); else next.delete(convocatoriaId);
      return next;
    });
    setFavoritos(prev => esFav ? prev : prev.filter(c => c.id !== convocatoriaId));
  }

  useEffect(() => {
    const user = getUser();
    setNombre(user?.sub?.split("@")[0] ?? "usuario");

    dashboardApi
      .get()
      .then((res) => setData(res.data as DashboardData))
      .catch(() => setError("No se pudieron cargar los datos del dashboard"))
      .finally(() => setLoading(false));

    favoritosApi.list()
      .then(res => {
        setFavoritos(res.data);
        setFavIds(new Set(res.data.map((c: ConvocatoriaPublica) => c.id)));
      })
      .catch(() => {})
      .finally(() => setFavLoading(false));
  }, []);

  const totalProyectos = Object.keys(data?.topRecomendaciones ?? {}).length;

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
              icon={<Sparkles className="w-5 h-5" />}
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
              label="Convocatorias favoritas"
              value={favoritos.length}
              icon={<Star className="w-5 h-5" />}
              color="amber"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Top recommendations */}
      <motion.div {...mp} variants={slideUp} className="mb-8">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Top recomendaciones por proyecto
            </h2>
            <Link
                href="/proyectos"
                className="text-sm text-primary dark:text-blue-300 hover:underline font-medium flex items-center gap-1"
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

      {/* Convocatorias favoritas */}
      <motion.div {...mp} variants={slideUp}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-amber-500" />
            </div>
            Convocatorias favoritas
          </h2>
          <Link
              href="/home"
              className="text-sm text-primary dark:text-blue-300 hover:underline font-medium flex items-center gap-1"
          >
            Explorar más
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {favLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-surface border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : favoritos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {favoritos.map((c) => (
              <ConvocatoriaCard
                key={c.id}
                convocatoria={c}
                autenticado={true}
                esFavorito={favIds.has(c.id)}
                onFavoritoChange={handleFavoritoChange}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-foreground font-semibold mb-1.5">
                No tienes convocatorias favoritas
              </p>
              <p className="text-sm text-foreground-muted mb-5 max-w-xs mx-auto">
                Explora las convocatorias disponibles y guarda las que más te interesen
              </p>
              <Link
                href="/home"
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Explorar convocatorias
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
