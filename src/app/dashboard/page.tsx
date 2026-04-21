"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { proyectosApi, recomendacionesApi, type ConvocatoriaPublica } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card, StatCard } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { fadeIn, slideUp, staggerChildren, staggerItem } from "@/lib/motion";
import {
  FolderOpen,
  Star,
  Plus,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Proyecto {
  id: number;
  nombre: string;
  descripcion?: string;
  sector?: string;
  presupuesto?: number;
}

interface RecomendacionDTO {
  id: number;
  convocatoriaId?: number;
  titulo?: string;
  tipo?: string;
  sector?: string;
  ubicacion?: string;
  urlOficial?: string;
  vigente?: boolean;
  presupuesto?: number;
  fechaCierre?: string;
  fechaPublicacion?: string;
  organismo?: string;
  puntuacion: number;
  explicacion?: string;
  convocatoria?: {
    id?: number;
    titulo?: string;
    tipo?: string;
    sector?: string;
    ubicacion?: string;
    urlOficial?: string;
    vigente?: boolean;
    presupuesto?: number;
    fechaCierre?: string;
    fechaPublicacion?: string;
    organismo?: string;
  };
  proyecto?: { id: number; nombre: string };
  proyectoId?: number;
  proyectoNombre?: string;
}

function toConvocatoria(rec: RecomendacionDTO): ConvocatoriaPublica {
  return {
    id: rec.convocatoriaId ?? rec.convocatoria?.id ?? rec.id,
    titulo: rec.titulo ?? rec.convocatoria?.titulo ?? "Convocatoria sin título",
    tipo: rec.tipo ?? rec.convocatoria?.tipo,
    sector: rec.sector ?? rec.convocatoria?.sector,
    ubicacion: rec.ubicacion ?? rec.convocatoria?.ubicacion,
    urlOficial: rec.urlOficial ?? rec.convocatoria?.urlOficial,
    abierto: rec.vigente ?? rec.convocatoria?.vigente,
    presupuesto: rec.presupuesto ?? rec.convocatoria?.presupuesto,
    fechaCierre: rec.fechaCierre ?? rec.convocatoria?.fechaCierre,
    fechaPublicacion: rec.fechaPublicacion ?? rec.convocatoria?.fechaPublicacion,
    organismo: rec.organismo ?? rec.convocatoria?.organismo,
    matchScore: rec.puntuacion,
    matchRazon: rec.explicacion,
  };
}

function getGreeting(nombre: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Buenos días, ${nombre}`;
  if (hour < 20) return `Buenas tardes, ${nombre}`;
  return `Buenas noches, ${nombre}`;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("usuario");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");
  const [infoProyectoAbierta, setInfoProyectoAbierta] = useState(false);
  const shouldReduce = useReducedMotion();

  const mp = shouldReduce ? {} : { initial: "hidden", animate: "visible" };

  useEffect(() => {
    const user = getUser();
    setNombre(user?.sub?.split("@")[0] ?? "usuario");

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const proyectosRes = await proyectosApi.list();
        const proyectosData = (proyectosRes.data as Proyecto[]) ?? [];
        setProyectos(proyectosData);

        if (proyectosData.length === 0) {
          setRecomendaciones([]);
          setSelectedProjectId("all");
          return;
        }

        const projectIdFromUrl = Number(searchParams.get("projectId"));
        const hasProjectFromUrl =
          Number.isFinite(projectIdFromUrl) &&
          proyectosData.some((proyecto) => proyecto.id === projectIdFromUrl);

        setSelectedProjectId(hasProjectFromUrl ? projectIdFromUrl : "all");

        const recsPorProyecto = await Promise.all(
          proyectosData.map(async (proyecto) => {
            try {
              const recsRes = await recomendacionesApi.list(proyecto.id);
              const recs = (recsRes.data as RecomendacionDTO[]) ?? [];
              return recs.map((rec) => ({
                ...rec,
                proyectoId: rec.proyecto?.id ?? proyecto.id,
                proyectoNombre: rec.proyecto?.nombre ?? proyecto.nombre,
              }));
            } catch {
              return [];
            }
          })
        );

        setRecomendaciones(recsPorProyecto.flat());
      } catch {
        setError("No se pudieron cargar tus proyectos y recomendaciones");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchParams]);

  const totalProyectos = proyectos.length;
  const selectedProjectName =
    selectedProjectId === "all"
      ? "No seleccionado"
      : proyectos.find((p) => p.id === selectedProjectId)?.nombre ?? "No seleccionado";

  const convocatoriasProyecto = recomendaciones
    .filter((rec) => selectedProjectId !== "all" && rec.proyectoId === selectedProjectId)
    .sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0));

  return (
    <motion.div {...mp} variants={fadeIn}>
      {/* Header */}
      <motion.div {...mp} variants={slideUp} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-widest mb-1">
              Mis proyectos
            </p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {getGreeting(nombre)}
            </h1>
            <p className="text-foreground-muted mt-1.5 text-sm">
              Gestiona tus proyectos y revisa sus convocatorias en un solo lugar
            </p>
          </div>
          <Link
            href="/proyectos/nuevo"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-hover font-semibold text-sm transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Crear proyecto
          </Link>
        </div>
      </motion.div>

      {error && <Alert variant="error" message={error} className="mb-6" />}

      <motion.div {...mp} variants={slideUp} className="mb-6">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1.5">Para que sirve un proyecto en Syntia</h2>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  Crea proyectos para que Syntia entienda mejor tu contexto y te muestre convocatorias
                  realmente utiles para cada iniciativa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInfoProyectoAbierta((prev) => !prev)}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              aria-expanded={infoProyectoAbierta}
            >
              <Lightbulb className="w-4 h-4" />
              {infoProyectoAbierta ? "Ocultar" : "Ver mas"}
              {infoProyectoAbierta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          {infoProyectoAbierta && (
            <div className="mt-4 pt-4 border-t border-border space-y-2.5 text-sm text-foreground-muted">
              <p>
                <span className="font-semibold text-foreground">1)</span> Un proyecto agrupa la informacion clave:
                nombre, descripcion, sector, ubicacion y presupuesto.
              </p>
              <p>
                <span className="font-semibold text-foreground">2)</span> Puedes crear varios proyectos para separar
                lineas de trabajo y comparar ayudas por cada uno.
              </p>
              <p>
                <span className="font-semibold text-foreground">3)</span> Al seleccionar un proyecto veras sus
                convocatorias asociadas, y en cada convocatoria podras abrir el detalle completo.
              </p>
              <p>
                <span className="font-semibold text-foreground">4)</span> Marca convocatorias como favoritas para
                seguirlas desde tu apartado de perfil y controlar si ya las has solicitado.
              </p>
            </div>
          )}
        </Card>
      </motion.div>

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
              label="Proyectos activos"
              value={totalProyectos}
              icon={<FolderOpen className="w-5 h-5" />}
              color="blue"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              label="Subvenciones recomendadas"
              value={recomendaciones.length}
              icon={<Star className="w-5 h-5" />}
              color="green"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              label="Proyecto seleccionado"
              value={selectedProjectId === "all" ? "Todos" : selectedProjectName}
              icon={<Target className="w-5 h-5" />}
              color="amber"
            />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Convocatorias por proyecto */}
        <motion.div {...mp} variants={slideUp} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2.5">
                <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-primary" />
                </div>
                {selectedProjectId === "all"
                  ? "Convocatorias por proyecto"
                  : `Convocatorias de ${selectedProjectName}`}
              </h2>
              {proyectos.length > 0 && (
                <select
                  value={selectedProjectId}
                  onChange={(e) =>
                    setSelectedProjectId(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
                >
                  <option value="all">Ninguno seleccionado</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-surface-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : convocatoriasProyecto.length > 0 ? (
              <div className="space-y-4">
                {convocatoriasProyecto.map((rec) => (
                  <ConvocatoriaCard
                    key={`${rec.proyectoId}-${rec.id}`}
                    convocatoria={toConvocatoria(rec)}
                    autenticado
                    showMatch
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-semibold mb-1.5">No hay subvenciones para este filtro</p>
                <p className="text-sm text-foreground-muted mb-5 max-w-xs mx-auto">
                  {selectedProjectId === "all"
                    ? "Selecciona un proyecto para ver sus convocatorias."
                    : "Selecciona otro proyecto o crea uno nuevo para empezar a recibir recomendaciones."}
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
          <Card>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Mis proyectos activos</h2>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-surface-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : proyectos.length > 0 ? (
              <div className="space-y-2">
                {proyectos.map((proyecto) => (
                  <button
                    key={proyecto.id}
                    onClick={() => setSelectedProjectId(proyecto.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedProjectId === proyecto.id
                        ? "border-primary bg-primary-light"
                        : "border-border bg-surface-muted hover:bg-border/30"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{proyecto.nombre}</p>
                    {proyecto.sector && (
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-1">{proyecto.sector}</p>
                    )}
                  </button>
                ))}
                <Link
                  href="/proyectos"
                  className="block text-center text-sm text-primary font-medium hover:underline pt-1"
                >
                  Ver lista de proyectos
                </Link>
              </div>
            ) : (
              <p className="text-sm text-foreground-muted text-center py-4">
                Crea tu primer proyecto para empezar
              </p>
            )}
          </Card>

          <Link href="/perfil/favoritas" className="block">
            <Card className="hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Convocatorias favoritas</h2>
              </div>
              <p className="text-sm text-foreground-muted mb-4">
                Revisa tus convocatorias guardadas y marca si ya han sido solicitadas.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Ir a convocatorias favoritas
              </span>
            </Card>
          </Link>

          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-hover text-white">
            <div className="absolute -top-5 -right-5 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute bottom-1 -right-3 w-16 h-16 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" />
                <p className="text-sm font-bold">Consejo</p>
              </div>
              <p className="text-xs text-white/85 leading-relaxed mb-3">
                Usa el selector de proyecto para revisar convocatorias concretas y ve a Ver detalles
                para editar o completar la información del proyecto.
              </p>
              <Link
                href="/proyectos/nuevo"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Añadir proyecto
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
