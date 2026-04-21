"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Briefcase, Building2, CalendarDays, ChevronDown, CircleHelp, Cpu, Download, Factory, FileText, Hash, Leaf, Lock, MapPin, Sparkles, Star, Users, type LucideIcon } from "lucide-react";
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

const parsePresupuesto = (value: unknown) => {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    return Number(
      value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".")
    );
  }

  return null;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "No disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-ES");
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "No disponible";
  const raw = typeof value === "number" ? value : Number(String(value).replace(/[^0-9,.-]/g, "").replace(/,/g, "."));
  if (Number.isNaN(raw)) return String(value);
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(raw);
}

type FilaDetalle = {
  clave: "id" | "codigoBdns" | "sector" | "descripcion" | "tiposBeneficiario";
  campo: string;
  valor: string;
  icono: LucideIcon;
};

export default function ConvocatoriaDetallePage() {
  const params = useParams<{ id: string }>();
  const idRaw = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const convocatoriaId = useMemo(() => {
    const parsed = Number(idRaw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [idRaw]);

  const [detalle, setDetalle] = useState<ConvocatoriaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null);

  function handleVolverArriba() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
          ...data,
          titulo: normalizeText(data.titulo),
          tipo: normalizeText(data.tipo),
          ubicacion: normalizeText(data.ubicacion),
          urlOficial: normalizeText(data.urlOficial),
          fuente: normalizeText(data.fuente),
          idBdns: normalizeText(data.idBdns),
          numeroConvocatoria: normalizeText(data.numeroConvocatoria),
          fechaCierre: normalizeText(data.fechaCierre),
          organismo: normalizeText(data.organismo),
          fechaPublicacion: normalizeText(data.fechaPublicacion),
          sector: normalizeText(data.sector),
          descripcion: normalizeText(data.descripcion),
          textoCompleto: normalizeText(data.textoCompleto),
          finalidad: normalizeText(data.finalidad),
          fechaInicio: normalizeText(data.fechaInicio),
          tiposBeneficiario: normalizeTipos(data.tiposBeneficiario),
          presupuesto: parsePresupuesto(data.presupuesto),
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
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 animate-pulse space-y-5">
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
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
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
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
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

  const filasDetalle: FilaDetalle[] = [
    { clave: "id", campo: "id", valor: String(detalle.id), icono: Hash },
    { clave: "codigoBdns", campo: "codigo BDNS", valor: detalle.codigoBdns ?? "No disponible", icono: FileText },
    { clave: "sector", campo: "sector", valor: detalle.sector ?? "No disponible", icono: Building2 },
    { clave: "descripcion", campo: "descripcion", valor: detalle.descripcion ?? "No disponible", icono: FileText },
    {
      clave: "tiposBeneficiario",
      campo: "tipos de beneficiario",
      valor: detalle.tiposBeneficiario.length > 0 ? detalle.tiposBeneficiario.join(", ") : "No disponible",
      icono: Users,
    },
  ];

  const primeraPalabraDescripcion = detalle.descripcion?.trim().split(/\s+/).slice(0, 5).join(" ") ?? "No disponible";
  const tituloDetalle = `# id ${detalle.id} I · I ${primeraPalabraDescripcion}`;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-4">
        <Link href="/home" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>
      </div>
      <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-5 mb-4 shadow-sm">
        <p className="ml-3 text-xl font-semibold tracking-tight text-foreground font-sans">
          {tituloDetalle}
        </p>
      </div>


      <div className="grid grid-cols-2 lg:grid-cols-10 gap-6 items-start">
        <article className="lg:col-span-8 bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-4">
            <div className="rounded-xl border border-border p-4 bg-surface">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-foreground-muted" />
                descripcion
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-line">{detalle.descripcion ?? "No disponible"}</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 bg-surface">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-foreground-muted" />
                  id
                </p>
                <p className="mt-2 text-sm text-foreground">{String(detalle.id)}</p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-surface">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-foreground-muted" />
                  codigo BDNS
                </p>
                <p className="mt-2 text-sm text-foreground">{detalle.codigoBdns ?? "No disponible"}</p>
              </div>
            </div>
          </div>

          {filasDetalle
            .filter((fila) => fila.clave !== "id" && fila.clave !== "codigoBdns" && fila.clave !== "descripcion")
            .map((fila) => (
              <div key={fila.clave} className="flex flex-col rounded-xl border border-border p-4 bg-surface">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <fila.icono className="w-3.5 h-3.5 text-foreground-muted" />
                  {fila.campo}
                </p>

                <button className="mt-2 self-start px-4 py-1 text-sm bg-green-200 text-black border border-border rounded-full whitespace-pre-line cursor-pointer hover:bg-green-500 transition-colors">
                  {fila.valor}
                </button>
              </div>
            ))}
        </article>
        <aside className="lg:col-span-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-10">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 mr-2" />
                <span>
                  Acceder a la guia
                </span>
              </button>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span>
                  Analizar con IA
                </span>
              </button>
            </div>
          </div>
        </aside>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleVolverArriba}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
        >
          Volver arriba
        </button>
      </div>
    </section>
  );
}

