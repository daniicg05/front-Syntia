"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { Card } from "@/components/ui/Card";
import { convocatoriasPublicasApi } from "@/lib/api";
import {
  FAVORITAS_UPDATED_EVENT,
  getFavoritas,
  setEstadoSolicitud,
  updateFavorita,
  type ConvocatoriaFavorita,
} from "@/lib/favoritos";
import { ArrowRight, Star } from "lucide-react";

function getStringFromAliases(source: Record<string, unknown>, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const value = source[alias];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function getNumberFromAliases(source: Record<string, unknown>, aliases: string[]): number | undefined {
  for (const alias of aliases) {
    const value = source[alias];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const cleaned = value.replace(/[^\d,.-]/g, "").trim();
      const normalized = cleaned.includes(",")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned;
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function buildBdnsUrl(idBdns?: string): string | undefined {
  if (!idBdns) return undefined;
  const clean = idBdns.trim();
  if (!clean) return undefined;
  return `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria/${encodeURIComponent(clean)}`;
}

export default function PerfilFavoritasPage() {
  const [favoritas, setFavoritas] = useState<ConvocatoriaFavorita[]>([]);

  useEffect(() => {
    function sync() {
      setFavoritas(getFavoritas());
    }

    sync();
    window.addEventListener(FAVORITAS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(FAVORITAS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const pendientes = favoritas.filter(
      (fav) =>
        fav.presupuesto == null ||
        !fav.ubicacion ||
        !fav.urlOficial ||
        !fav.numeroConvocatoria ||
        !fav.idBdns
    );

    if (pendientes.length === 0) return;

    let cancelled = false;

    (async () => {
      await Promise.all(
        pendientes.map(async (fav) => {
          try {
            const res = await convocatoriasPublicasApi.detalle(fav.id);
            if (cancelled) return;

            const data = res.data;
            const raw = data as unknown as Record<string, unknown>;
            const idBdns = data.codigoBdns ?? getStringFromAliases(raw, ["idBdns", "codigo_bdns"]);
            const organismo = data.organismo ?? getStringFromAliases(raw, ["organoConvocante", "entidadConvocante"]);
            let presupuesto = getNumberFromAliases(raw, [
              "presupuesto",
              "importe",
              "cuantia",
              "presupuestoTotal",
              "importeTotal",
              "cuantiaTotal",
            ]);

            // Fallback: usa el mismo listado publico de /home para recuperar presupuesto por id.
            if (presupuesto == null) {
              try {
                const q = fav.titulo?.trim();
                if (q) {
                  const searchRes = await convocatoriasPublicasApi.buscar({ q, page: 0, size: 20 });
                  const match = searchRes.data.content.find((item) => item.id === fav.id);
                  if (typeof match?.presupuesto === "number" && Number.isFinite(match.presupuesto)) {
                    presupuesto = match.presupuesto;
                  }
                }
              } catch {
                // Mantenemos el valor actual si falla el fallback.
              }
            }

            updateFavorita(fav.id, {
              organismo: organismo === idBdns ? undefined : organismo ?? undefined,
              ubicacion: data.ubicacion ?? getStringFromAliases(raw, ["ambitoGeografico", "ambito"]),
              tipo: getStringFromAliases(raw, ["tipo", "tipoConvocatoria"]),
              sector: data.sector ?? undefined,
              fechaPublicacion: data.fechaPublicacion ?? getStringFromAliases(raw, ["fechaPublicada", "fechaInicio"]),
              fechaCierre: data.fechaCierre ?? getStringFromAliases(raw, ["fechaFin", "plazoFin"]),
              presupuesto,
              abierto: typeof data.abierto === "boolean" ? data.abierto : undefined,
              urlOficial:
                data.urlOficial ??
                getStringFromAliases(raw, ["enlaceOficial", "url", "link"]) ??
                buildBdnsUrl(idBdns ?? undefined),
              idBdns: idBdns ?? undefined,
              numeroConvocatoria:
                data.numeroConvocatoria ?? getStringFromAliases(raw, ["numero", "expediente"]),
            });
          } catch {
            // Si falla un detalle puntual, mantenemos la card con datos actuales.
          }
        })
      );

      if (!cancelled) {
        setFavoritas(getFavoritas());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [favoritas]);

  const stats = useMemo(() => {
    const solicitadas = favoritas.filter((f) => f.estadoSolicitud === "solicitada").length;
    return {
      total: favoritas.length,
      solicitadas,
      pendientes: favoritas.length - solicitadas,
    };
  }, [favoritas]);

  function handleEstadoChange(convocatoriaId: number, estado: "no_solicitada" | "solicitada") {
    setEstadoSolicitud(convocatoriaId, estado);
    setFavoritas(getFavoritas());
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle mb-1">
          Perfil
        </p>
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
          <p className="text-xs text-foreground-subtle uppercase tracking-wider mb-1">Solicitadas</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.solicitadas}</p>
        </Card>
        <Card>
          <p className="text-xs text-foreground-subtle uppercase tracking-wider mb-1">No solicitadas</p>
          <p className="text-2xl font-bold text-foreground">{stats.pendientes}</p>
        </Card>
      </div>

      {favoritas.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {favoritas.map((fav) => (
            <div key={fav.id}>
              {(() => {
                const tipoNormalizado = (fav.tipo ?? "").trim().toLowerCase();
                const sectorNormalizado = (fav.sector ?? "").trim().toLowerCase();
                const tipo = tipoNormalizado && tipoNormalizado !== sectorNormalizado ? fav.tipo : undefined;

                return (
              <ConvocatoriaCard
                convocatoria={{
                  id: fav.id,
                  titulo: fav.titulo,
                  organismo: fav.organismo === fav.idBdns ? undefined : fav.organismo,
                  ubicacion: fav.ubicacion,
                  tipo,
                  sector: fav.sector,
                  fechaPublicacion: fav.fechaPublicacion,
                  fechaCierre: fav.fechaCierre,
                  presupuesto: fav.presupuesto,
                  abierto: fav.abierto,
                  urlOficial: fav.urlOficial,
                  idBdns: fav.idBdns,
                  numeroConvocatoria: fav.numeroConvocatoria,
                }}
                autenticado
                compactTitle
                estadoSolicitud={fav.estadoSolicitud}
                onEstadoSolicitudChange={(estado) => handleEstadoChange(fav.id, estado)}
              />
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

