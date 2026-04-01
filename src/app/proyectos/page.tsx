"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { proyectosApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FolderOpen, Plus, Trash2, ArrowRight, Calendar } from "lucide-react";

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  sector?: string;
  presupuesto?: number;
  fechaCreacion?: string;
}

export default function ProyectosPage() {
  const toast = useToast();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    proyectosApi
      .list()
      .then((res) => setProyectos(res.data as Proyecto[]))
      .catch(() => setError("No se pudieron cargar los proyectos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
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
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-destructive-light border border-destructive/20 text-destructive rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && proyectos.length === 0 && !error && (
        <Card className="text-center py-16">
          <FolderOpen className="w-14 h-14 text-foreground-subtle mx-auto mb-4" />
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
        </Card>
      )}

      {/* Project grid */}
      {!loading && proyectos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectos.map((proyecto) => (
            <Card key={proyecto.id} className="flex flex-col group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(proyecto.id)}
                  loading={deleting === proyecto.id}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground-subtle hover:text-destructive"
                  aria-label="Eliminar proyecto"
                >
                  {""}
                </Button>
              </div>

              <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                {proyecto.nombre}
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed line-clamp-3 flex-1">
                {proyecto.descripcion}
              </p>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                {proyecto.fechaCreacion && (
                  <span className="flex items-center gap-1.5 text-xs text-foreground-subtle">
                    <Calendar className="w-3 h-3" />
                    {new Date(proyecto.fechaCreacion).toLocaleDateString("es-ES")}
                  </span>
                )}
                <Link
                  href={`/proyectos/${proyecto.id}/recomendaciones`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline ml-auto"
                >
                  Ver subvenciones
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
