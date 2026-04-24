"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Pencil, Trash2, FolderOpen, Tag, MapPin, Banknote } from "lucide-react";
import { proyectosApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ProyectoDetalle {
  id: number;
  nombre: string;
  descripcion?: string;
  sector?: string;
  ubicacion?: string;
  presupuesto?: number;
  fechaCreacion?: string;
  creadoEn?: string;
}

function formatPresupuesto(presupuesto?: number): string {
  if (presupuesto == null) return "No especificado";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(presupuesto);
}

function formatFecha(fecha?: string): string {
  if (!fecha) return "No disponible";
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    proyectosApi
      .get(Number(id))
      .then((res) => setProyecto(res.data as ProyectoDetalle))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!proyecto || deleting) return;
    const ok = confirm("¿Seguro que quieres eliminar este proyecto?");
    if (!ok) return;

    setDeleting(true);
    const loadingId = toast.loading("Eliminando proyecto...");
    try {
      await proyectosApi.delete(proyecto.id);
      toast.update(loadingId, "success", "Proyecto eliminado correctamente");
      const listRes = await proyectosApi.list();
      const restantes = Array.isArray(listRes.data) ? listRes.data.length : 0;
      router.push(restantes > 0 ? "/proyectos" : "/dashboard");
    } catch {
      toast.update(loadingId, "error", "No se pudo eliminar el proyecto");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-10 w-64 bg-surface-muted rounded-xl animate-pulse mb-4" />
        <div className="h-60 bg-surface-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="max-w-3xl mx-auto text-center py-14">
        <p className="text-foreground-muted">No se pudo cargar el proyecto.</p>
        <Link href="/proyectos" className="text-primary hover:underline text-sm mt-3 inline-block">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
        </Link>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-foreground-subtle mb-2">
              Detalle del proyecto
            </p>
            <h1 className="text-2xl font-bold text-foreground">{proyecto.nombre}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/proyectos/${proyecto.id}/editar`}>
              <Button variant="secondary" size="sm" icon={<Pencil className="w-4 h-4" />}>
                Editar
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
              loading={deleting}
              className="text-red-600 hover:bg-red-50"
            >
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-foreground-subtle mb-1">Sector</p>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {proyecto.sector || "No especificado"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-foreground-subtle mb-1">Ubicación</p>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {proyecto.ubicacion || "No especificada"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-foreground-subtle mb-1">Presupuesto</p>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              {formatPresupuesto(proyecto.presupuesto)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-foreground-subtle mb-1">Fecha de creación</p>
            <p className="text-sm text-foreground">{formatFecha(proyecto.fechaCreacion || proyecto.creadoEn)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-foreground-subtle mb-2">Descripción</p>
          <p className="text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">
            {proyecto.descripcion || "No has añadido descripción a este proyecto."}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/proyectos/${proyecto.id}/recomendaciones`}>
            <Button icon={<FolderOpen className="w-4 h-4" />}>
              Ver convocatorias de este proyecto
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/proyectos/nuevo">
            <Button variant="secondary">Crear otro proyecto</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

