"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, FileText, Hash, Users } from "lucide-react";
import { ConvocatoriaDetalle, convocatoriasPublicasApi } from "@/lib/api";

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeTipos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ConvocatoriaDetallePage() {
  const params = useParams<{ id: string }>();
  const idRaw = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const convocatoriaId = useMemo(() => {
    const parsed = Number(idRaw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [idRaw]);

  const [detalle, setDetalle] = useState<ConvocatoriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDetalle() {
      if (convocatoriaId === null) {
        if (mounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(false);
      setNotFound(false);

      try {
        const response = await convocatoriasPublicasApi.detalle(convocatoriaId);
        if (!mounted) return;

        const data = response.data;
        setDetalle({
          id: data.id,
          codigoBdns: normalizeText(data.codigoBdns),
          sector: normalizeText(data.sector),
          descripcion: normalizeText(data.descripcion),
          tiposBeneficiario: normalizeTipos(data.tiposBeneficiario),
        });
      } catch (err: unknown) {
        if (!mounted) return;
        const status =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { status?: number } }).response?.status === "number"
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 404) {
          setNotFound(true);
        } else {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDetalle();

    return () => {
      mounted = false;
    };
  }, [convocatoriaId]);

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 animate-pulse space-y-5">
          <div className="h-4 w-32 bg-surface-muted rounded" />
          <div className="h-8 w-56 bg-surface-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 bg-surface-muted rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Convocatoria no encontrada</h1>
          <p className="text-sm text-foreground-muted">No existe una convocatoria con ese identificador.</p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al listado
          </Link>
        </div>
      </section>
    );
  }

  if (error || !detalle) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">No se pudo cargar el detalle</h1>
          <p className="text-sm text-foreground-muted">
            Ha ocurrido un problema al consultar esta convocatoria. Intentalo de nuevo en unos minutos.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al listado
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-4">
        <Link href="/home" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>
      </div>

      <article className="bg-white border border-border rounded-2xl p-6 sm:p-8 space-y-6">
        <header>
          <p className="text-xs font-bold tracking-widest uppercase text-foreground-muted">Detalle de convocatoria</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">Convocatoria #{detalle.id}</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Codigo BDNS
            </p>
            <p className="mt-2 text-sm text-foreground">{detalle.codigoBdns ?? "No disponible"}</p>
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Sector
            </p>
            <p className="mt-2 text-sm text-foreground">{detalle.sector ?? "No disponible"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 bg-surface">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Descripcion
          </p>
          <p className="mt-2 text-sm text-foreground whitespace-pre-line">
            {detalle.descripcion ?? "No disponible"}
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 bg-surface">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Tipos de beneficiario
          </p>
          {detalle.tiposBeneficiario.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {detalle.tiposBeneficiario.map((tipo) => (
                <span
                  key={tipo}
                  className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold"
                >
                  {tipo}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-foreground">No especificado</p>
          )}
        </div>
      </article>
    </section>
  );
}

