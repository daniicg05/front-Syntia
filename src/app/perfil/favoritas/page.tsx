"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Star } from "lucide-react";
import { useFavoritesList } from "@/hooks/useFavorites";

export default function PerfilFavoritasPage() {
  const { items: favoritas, status, error, refetch } = useFavoritesList(true);

  const stats = useMemo(() => {
    return {
      total: favoritas.length,
      conPresupuesto: favoritas.filter((f) => typeof f.presupuesto === "number").length,
      conFechaCierre: favoritas.filter((f) => Boolean(f.fechaCierre)).length,
    };
  }, [favoritas]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Convocatorias favoritas</h1>
        <p className="text-sm text-foreground-muted mt-1.5">
          Gestiona tus convocatorias guardadas y marca su estado de solicitud.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <p className="text-xs text-foreground-subtle uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground-subtle uppercase tracking-wider mb-1">Con presupuesto</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.conPresupuesto}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground-subtle uppercase tracking-wider mb-1">Con fecha limite</p>
          <p className="text-2xl font-bold text-foreground">{stats.conFechaCierre}</p>
        </Card>
      </div>

      {status === "loading" && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-surface-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {status === "error" && (
        <Card>
          <div className="py-8 text-center">
            <p className="font-semibold text-foreground mb-1">No se pudieron cargar tus favoritas</p>
            <p className="text-sm text-foreground-muted mb-4">{error?.message ?? "Error inesperado"}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Reintentar
            </button>
          </div>
        </Card>
      )}

      {status === "success" && favoritas.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3">
              <Star className="w-5 h-5" />
            </div>
            <p className="font-semibold text-foreground mb-1">No tienes convocatorias favoritas</p>
            <p className="text-sm text-foreground-muted mb-4">
              Abre una convocatoria y marcalo como favorito para seguirla desde aqui.
            </p>
            <Link href="/home" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Explorar convocatorias <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      ) : status === "success" ? (
        <div className="space-y-4">
          {favoritas.map((fav) => (
            <div key={fav.convocatoriaId}>
              <ConvocatoriaCard
                convocatoria={{
                  id: fav.convocatoriaId,
                  titulo: fav.titulo,
                  organismo: fav.organismo ?? undefined,
                  ubicacion: fav.ubicacion ?? undefined,
                  tipo: fav.tipo ?? undefined,
                  sector: fav.sector ?? undefined,
                  fechaPublicacion: fav.fechaPublicacion ?? undefined,
                  fechaCierre: fav.fechaCierre ?? undefined,
                  presupuesto: fav.presupuesto ?? undefined,
                  urlOficial: fav.urlOficial ?? undefined,
                  favorita: true,
                }}
                autenticado
                compactTitle
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

