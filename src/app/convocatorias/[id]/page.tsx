"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  Cpu,
  Euro,
  Factory,
  FileText,
  Hash,
  Leaf,
  Lock,
  MapPin,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  ConvocatoriaDetalle,
  ConvocatoriaDTO,
  convocatoriasPublicasApi,
} from "@/lib/api";
import {
  getFavoritaById,
  setEstadoSolicitud,
  toggleFavorita,
  type EstadoSolicitud,
} from "@/lib/favoritos";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getStringFromAliases(
    source: Record<string, unknown>,
    aliases: string[]
): string | null {
  for (const alias of aliases) {
    const value = source[alias];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function getNumberFromAliases(
    source: Record<string, unknown>,
    aliases: string[]
): number | null {
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
  return null;
}

function buildBdnsUrl(idBdns?: string | null): string | undefined {
  if (!idBdns) return undefined;
  const clean = idBdns.trim();
  if (!clean) return undefined;
  return `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria/${encodeURIComponent(clean)}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "No disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-ES");
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "No disponible";
  const raw =
      typeof value === "number"
          ? value
          : Number(String(value).replace(/[^0-9,.-]/g, "").replace(/,/g, "."));
  if (Number.isNaN(raw)) return String(value);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(raw);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FilaClave = "id" | "codigoBdns" | "sector" | "descripcion" | "tiposBeneficiario";

type FilaDetalle = {
  clave: FilaClave;
  campo: string;
  valor: string;
  icono: LucideIcon;
};

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [esFavorita, setEsFavorita] = useState(false);
  const [estadoSolicitud, setEstadoSolicitudLocal] =
      useState<EstadoSolicitud>("no_solicitada");

  function handleVolverArriba() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Load detail ────────────────────────────────────────────────────────────

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
        const raw = data as unknown as Record<string, unknown>;

        const codigoBdns =
            normalizeText(data.codigoBdns) ??
            getStringFromAliases(raw, ["idBdns", "codigo_bdns"]);

        const urlOficial =
            normalizeText(data.urlOficial ?? null) ??
            getStringFromAliases(raw, ["enlaceOficial", "url", "link"]) ??
            buildBdnsUrl(codigoBdns);

        setDetalle({
          id: data.id,
          titulo: normalizeText((data as unknown as { titulo?: string | null }).titulo ?? null),
          codigoBdns,
          sector: normalizeText(data.sector),
          descripcion: normalizeText(data.descripcion),
          textoCompleto: normalizeText(data.textoCompleto ?? null),
          finalidad: normalizeText(data.finalidad ?? null),
          fechaInicio: normalizeText(data.fechaInicio ?? null),
          tipo:
              normalizeText(data.tipo ?? null) ??
              getStringFromAliases(raw, ["tipoConvocatoria"]),
          fuente:
              normalizeText(data.fuente ?? null) ??
              getStringFromAliases(raw, ["fuenteDatos"]),
          idBdns:
              normalizeText(data.idBdns ?? null) ??
              getStringFromAliases(raw, ["codigoBdns", "codigo_bdns"]),
          tiposBeneficiario: normalizeTipos(data.tiposBeneficiario),
          organismo:
              normalizeText(data.organismo ?? null) ??
              getStringFromAliases(raw, ["organoConvocante", "entidadConvocante"]),
          ubicacion:
              normalizeText(data.ubicacion ?? null) ??
              getStringFromAliases(raw, ["ambitoGeografico", "ambito"]),
          fechaCierre:
              normalizeText(data.fechaCierre ?? null) ??
              getStringFromAliases(raw, ["fechaFin", "plazoFin"]),
          fechaPublicacion:
              normalizeText(data.fechaPublicacion ?? null) ??
              getStringFromAliases(raw, ["fechaPublicada", "fechaInicio"]),
          presupuesto:
              data.presupuesto ??
              getNumberFromAliases(raw, [
                "presupuesto",
                "importe",
                "cuantia",
                "presupuestoTotal",
                "importeTotal",
                "cuantiaTotal",
              ]),
          abierto:
              typeof data.abierto === "boolean" ? data.abierto : null,
          urlOficial,
          numeroConvocatoria:
              normalizeText(data.numeroConvocatoria ?? null) ??
              getStringFromAliases(raw, ["numero", "expediente"]),
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
        if (mounted) setLoading(false);
      }
    }

    loadDetalle();
    return () => {
      mounted = false;
    };
  }, [convocatoriaId]);

  // ── Load favorita state ────────────────────────────────────────────────────

  useEffect(() => {
    if (convocatoriaId == null) return;
    const favorita = getFavoritaById(convocatoriaId);
    setEsFavorita(Boolean(favorita));
    setEstadoSolicitudLocal(favorita?.estadoSolicitud ?? "no_solicitada");
  }, [convocatoriaId]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getTituloFavorita(): string {
    if (!detalle) return `Convocatoria #${convocatoriaId ?? ""}`;
    if (detalle.titulo) return detalle.titulo;
    const resumen =
        detalle.descripcion?.trim().split(/\s+/).slice(0, 6).join(" ") ??
        "Convocatoria";
    return `#${detalle.id} - ${resumen}`;
  }

  function handleToggleFavorita() {
    if (!detalle) return;
    const result = toggleFavorita({
      id: detalle.id,
      titulo: getTituloFavorita(),
      organismo: detalle.organismo ?? undefined,
      ubicacion: detalle.ubicacion ?? undefined,
      idBdns: detalle.codigoBdns ?? undefined,
      numeroConvocatoria: detalle.numeroConvocatoria ?? undefined,
      sector: detalle.sector ?? undefined,
      tipo: detalle.tipo ?? undefined,
      fechaPublicacion: detalle.fechaPublicacion ?? undefined,
      fechaCierre: detalle.fechaCierre ?? undefined,
      presupuesto: detalle.presupuesto ?? undefined,
      abierto: detalle.abierto ?? undefined,
      urlOficial: detalle.urlOficial ?? buildBdnsUrl(detalle.codigoBdns),
    });
    setEsFavorita(result.activa);
    setEstadoSolicitudLocal(result.favorita?.estadoSolicitud ?? "no_solicitada");
  }

  function handleEstadoSolicitudChange(nextEstado: EstadoSolicitud) {
    if (!detalle) return;
    const updated = setEstadoSolicitud(detalle.id, nextEstado);
    if (!updated) return;
    setEstadoSolicitudLocal(nextEstado);
  }

  // ── filasDetalle ───────────────────────────────────────────────────────────

  const filasDetalle: FilaDetalle[] = detalle
      ? [
        {
          clave: "id",
          campo: "ID",
          valor: String(detalle.id),
          icono: Hash,
        },
        {
          clave: "codigoBdns",
          campo: "Código BDNS",
          valor: detalle.codigoBdns ?? "No disponible",
          icono: FileText,
        },
        {
          clave: "sector",
          campo: "Sector",
          valor: detalle.sector ?? "No disponible",
          icono: Building2,
        },
        {
          clave: "descripcion",
          campo: "Descripción",
          valor: detalle.descripcion ?? "No disponible",
          icono: FileText,
        },
        {
          clave: "tiposBeneficiario",
          campo: "Tipos de beneficiario",
          valor:
              detalle.tiposBeneficiario.length > 0
                  ? detalle.tiposBeneficiario.join(", ")
                  : "No especificado",
          icono: Users,
        },
      ]
      : [];

  // ── Loading / error states ─────────────────────────────────────────────────

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
            <h1 className="text-2xl font-bold text-foreground">
              Convocatoria no encontrada
            </h1>
            <p className="text-sm text-foreground-muted">
              No existe una convocatoria con ese identificador.
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

  if (error || !detalle) {
    return (
        <section className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              No se pudo cargar el detalle
            </h1>
            <p className="text-sm text-foreground-muted">
              Ha ocurrido un problema al consultar esta convocatoria. Inténtalo
              de nuevo en unos minutos.
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const tituloPreview = detalle.descripcion
      ? detalle.descripcion.split(/\s+/).filter(Boolean).slice(0, 15).join(" ")
      : detalle.titulo ?? `Convocatoria #${detalle.id}`;

  return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        {/* Back link */}
        <div className="mb-4">
          <Link
              href="/home"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al listado
          </Link>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">

          {/* ── Article (left) ──────────────────────────────────────────────── */}
          <article className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">

            {/* Header */}
            <header>
              <p className="text-xs font-bold tracking-widest uppercase text-foreground-muted">
                Detalle de convocatoria
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-light hover:bg-cyan-400 dark:bg-primary-hover dark:hover:bg-primary-hover px-3 py-1 text-xs font-semibold text-primary cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {detalle.abierto === false ? "Cerrada" : "Abierta"}
                </button>

                {detalle.tipo && (
                    <button
                        type="button"
                        className="inline-flex items-center hover:bg-blue-300 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      {detalle.tipo}
                    </button>
                )}

                {detalle.ubicacion && (
                    <button
                        type="button"
                        className="inline-flex items-center hover:bg-blue-300 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      {detalle.ubicacion}
                    </button>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mt-1">
                {tituloPreview}
              </h2>
            </header>            

            {/* Nº Convocatoria + Sector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4 bg-surface">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Código BDNS
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {detalle.numeroConvocatoria ??
                      detalle.idBdns ??
                      "No disponible"}
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-surface">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Sector
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {detalle.sector ?? "No disponible"}
                </p>
              </div>
            </div>

            {/* Descripción detallada */}
            <div className="rounded-xl border border-border p-4 bg-surface">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Descripción detallada
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-line">
                {detalle.textoCompleto ?? detalle.descripcion ?? "No disponible"}
              </p>
            </div>

            {/* Organismo convocante */}
            <div className="rounded-xl border border-border p-4 bg-surface">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Organismo convocante
              </p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center gap-6">
                  <p className="text-foreground-muted w-32">Organismo</p>
                  <p className="text-foreground font-medium">
                    {detalle.organismo ?? "No disponible"}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-foreground-muted w-32">Fuente</p>
                  <p className="text-foreground font-medium">
                    {detalle.fuente ?? "No disponible"}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-foreground-muted w-32">Región</p>
                  <p className="text-foreground font-medium">
                    {detalle.ubicacion ?? "No disponible"}
                  </p>
                </div>
              </div>
            </div>

            {/* Información general */}
            <div className="rounded-xl border border-border p-4 bg-surface">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Información general
              </p>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className="text-foreground-muted font-semibold">
                    Tipo de convocatoria
                  </p>
                  <p className="text-foreground">{detalle.tipo ?? "No disponible"}</p>
                </div>
                <div>
                  <p className="text-foreground-muted font-semibold">Finalidad</p>
                  <p className="text-foreground">
                    {detalle.finalidad ?? "No disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-muted font-semibold">Publicación</p>
                  <p className="text-foreground">
                    {formatDate(detalle.fechaPublicacion)}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-muted font-semibold">
                    Bases de la convocatoria
                  </p>
                  {detalle.urlOficial ? (
                      <a
                          href={detalle.urlOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-semibold hover:underline break-all"
                      >
                        {detalle.urlOficial}
                      </a>
                  ) : (
                      <p className="text-foreground">No disponible</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tipos de beneficiario */}
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
                    <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">
                  Pymes en crecimiento
                </span>
                  </div>
              ) : (
                  <p className="mt-2 text-sm text-foreground">No especificado</p>
              )}
            </div>

            {/* Sectores */}
            <div className="rounded-xl border border-border p-4 bg-surface">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Sectores
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-line">
                Impulso de iniciativas en digitalización, innovación social,
                modernización de servicios públicos y mejora de la competitividad
                territorial.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { icono: Factory, label: "Industria" },
                  { icono: Cpu, label: "Tecnología" },
                  { icono: Building2, label: "Servicios" },
                  { icono: Leaf, label: "Sostenibilidad" },
                ].map(({ icono: Icon, label }) => (
                    <button
                        key={label}
                        type="button"
                        aria-label={`Sector ${label}`}
                        title={label}
                        className="h-11 w-11 rounded-xl border border-border bg-surface inline-flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                ))}
              </div>
            </div>

            {/* Ámbito geográfico */}
            <div className="rounded-xl border border-border p-4 bg-surface">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Ámbito geográfico
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-line">
                {detalle.ubicacion ?? "No disponible"}
              </p>
            </div>
          </article>

          {/* ── Aside (right) ───────────────────────────────────────────────── */}
          <aside className="lg:col-span-3">
            <div className="space-y-4">

              {/* Añadir favorito */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Añadir Favorito
                </p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <p className="text-sm text-foreground max-w-[65%]">
                    Guarda esta convocatoria en tu lista para consultarla más
                    tarde y recibir seguimiento.
                  </p>
                  <button
                      type="button"
                      aria-label="Añadir a favoritos"
                      onClick={handleToggleFavorita}
                      className={`h-14 w-14 shrink-0 rounded-2xl inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer ${
                          esFavorita
                              ? "bg-amber-400 hover:bg-amber-500"
                              : "bg-primary hover:bg-primary-hover dark:bg-primary/90 dark:hover:bg-primary-hover"
                      } text-white`}
                  >
                    <Star
                        className={`w-7 h-7 text-white ${esFavorita ? "fill-white" : ""}`}
                    />
                  </button>
                </div>

                {esFavorita && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-foreground-muted mb-1.5">
                        Estado de solicitud
                      </label>
                      <select
                          value={estadoSolicitud}
                          onChange={(e) =>
                              handleEstadoSolicitudChange(
                                  e.target.value as EstadoSolicitud
                              )
                          }
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                      >
                        <option value="no_solicitada">No solicitada</option>
                        <option value="solicitada">Ya solicitada</option>
                      </select>
                    </div>
                )}
              </div>

              {/* Guía IA */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                  Accede a la gu<span className="text-primary">IA</span>
                </span>
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Consulta una ruta orientativa con pasos, requisitos y
                  recomendaciones.
                </p>
                <button
                    type="button"
                    className="mt-3 w-full inline-flex items-center justify-center rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-hover dark:bg-blue-500 dark:hover:bg-blue-500 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Accede a nuestra guía inteligente</span>
                </button>
              </div>

              {/* Presupuesto */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <Euro className="w-3.5 h-3.5" /> Presupuesto
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-foreground-muted">Asignado</p>
                  <p className="text-lg font-semibold text-foreground">
                    {detalle.presupuesto
                        ? formatCurrency(detalle.presupuesto)
                        : "Sin cuantía"}
                  </p>
                </div>
              </div>

              {/* Fechas importantes */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Fechas importantes
                </p>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-muted font-semibold">
                    Publicación
                  </span>
                    <span className="text-foreground">
                    {formatDate(detalle.fechaPublicacion)}
                  </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-muted font-semibold">
                    Inicio
                  </span>
                    <span className="text-foreground">
                    {detalle.fechaInicio != null
                        ? formatDate(detalle.fechaInicio)
                        : formatDate(detalle.fechaPublicacion)}
                  </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-muted font-semibold">
                    Cierre
                  </span>
                    <span className="text-foreground">
                    {formatDate(detalle.fechaCierre)}
                  </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Volver arriba */}
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