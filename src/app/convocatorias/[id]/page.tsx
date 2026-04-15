"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Briefcase, Building2, CalendarDays, ChevronDown, CircleHelp, Cpu, Download, Factory, FileText, Hash, Leaf, Lock, MapPin, Sparkles, Star, Users } from "lucide-react";
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

const PREGUNTAS_FRECUENTES_MOCK = [
  {
    pregunta: "¿Cual es el plazo maximo para presentar la solicitud?",
    respuesta: "El plazo orientativo es de 30 dias naturales desde la fecha de publicacion en el boletin oficial.",
  },
  {
    pregunta: "¿Se permite presentar la documentacion en formato digital?",
    respuesta: "Si, la presentacion puede realizarse de forma telematica adjuntando los documentos requeridos en PDF firmado.",
  },
  {
    pregunta: "¿Esta convocatoria permite anticipos de financiacion?",
    respuesta: "De forma mockeada, se contempla la posibilidad de anticipo parcial sujeto a disponibilidad presupuestaria.",
  },
  {
    pregunta: "¿Como se notificara la resolucion de concesion?",
    respuesta: "La resolucion se notificara por sede electronica y se publicara en el tablon oficial de anuncios correspondiente.",
  },
];

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
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-4">
        <Link href="/home" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        <article className="lg:col-span-7 bg-white border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <header>
            <p className="text-xs font-bold tracking-widest uppercase text-foreground-muted">Detalle de convocatoria</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-light px-3 py-1 text-xs font-semibold text-primary cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                Abierta
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Local
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Pymes
              </button>
            </div>
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
              <FileText className="w-3.5 h-3.5" /> Descripcion detallada
            </p>
            <p className="mt-2 text-sm text-foreground whitespace-pre-line">
              Esta subvencion parece orientada a impulsar proyectos con impacto real en competitividad y transformacion empresarial.
              Por el enfoque del titulo, prioriza actuaciones que mejoren procesos internos, digitalizacion y capacidad de innovacion.
              Tambien sugiere una evaluacion centrada en viabilidad tecnica, alcance territorial y resultados medibles en el corto y medio plazo.
              En conjunto, la convocatoria apunta a entidades que puedan ejecutar acciones concretas, justificables y alineadas con objetivos publicos.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Organismo convocante
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="text-foreground-muted space-y-2">
                <p>Nivel</p>
                <p>Administracion</p>
                <p>Departamento</p>
                <p>Region</p>
              </div>
              <div className="text-foreground font-medium space-y-2">
                <p>Autonomico</p>
                <p>Generalitat Valenciana</p>
                <p>Conselleria de Innovacion, Industria y Turismo</p>
                <p>Comunidad Valenciana</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Informacion general
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-foreground-muted font-semibold">Tipo de convocatoria</p>
                <p className="text-foreground">Concesion directa - instrumental</p>
              </div>

              <div>
                <p className="text-foreground-muted font-semibold">Finalidad</p>
                <p className="text-foreground">Servicios Sociales y Promocion Social</p>
              </div>

              <div>
                <p className="text-foreground-muted font-semibold">Instrumentos</p>
                <p className="text-foreground">{"descripcion => SUBVENCION Y ENTREGA DINERARIA SIN CONTRAPRESTACION"}</p>
              </div>

              <div>
                <p className="text-foreground-muted font-semibold">Publicacion</p>
                <p className="text-foreground">06/02/2026</p>
              </div>

              <div>
                <p className="text-foreground-muted font-semibold">Bases de la convocatoria</p>
                <a
                  href="https://bop2.dipgra.es/opencms/opencms/portal/index.jsp?o..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline break-all"
                >
                  https://bop2.dipgra.es/opencms/opencms/portal/index.jsp?o...
                </a>
              </div>
            </div>
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
                <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">
                  Pymes en crecimiento
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-foreground">No especificado</p>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Sectores
            </p>
            <p className="mt-2 text-sm text-foreground whitespace-pre-line">
              Impulso de iniciativas en digitalizacion, innovacion social, modernizacion de servicios publicos y mejora de la competitividad territorial.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                aria-label="Sector industria"
                title="Industria"
                className="h-11 w-11 rounded-xl border border-border bg-white inline-flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Factory className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Sector tecnologia"
                title="Tecnologia"
                className="h-11 w-11 rounded-xl border border-border bg-white inline-flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Cpu className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Sector servicios"
                title="Servicios"
                className="h-11 w-11 rounded-xl border border-border bg-white inline-flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Building2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Sector sostenibilidad"
                title="Sostenibilidad"
                className="h-11 w-11 rounded-xl border border-border bg-white inline-flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Leaf className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Ambito geografico
            </p>
            <p className="mt-2 text-sm text-foreground whitespace-pre-line">
              Convocatoria de aplicacion en todo el territorio de la Comunidad Valenciana, con posibilidad de actuaciones en ambito municipal y comarcal.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Documentacion necesaria
            </p>
            <p className="mt-2 text-sm text-foreground">
              Documentacion requerida mockeada para la solicitud: memoria tecnica del proyecto, declaracion responsable y presupuesto detallado de ejecucion.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Memoria_tecnica.pdf
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Declaracion_responsable.pdf
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Presupuesto_detallado.xlsx
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 bg-surface">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
              <CircleHelp className="w-3.5 h-3.5" /> Preguntas frecuentes
            </p>
            <div className="mt-3 space-y-2">
              {PREGUNTAS_FRECUENTES_MOCK.map((item, index) => {
                const abierta = preguntaAbierta === index;
                return (
                  <div key={item.pregunta} className="rounded-lg border border-border bg-white">
                    <button
                      type="button"
                      onClick={() => setPreguntaAbierta(abierta ? null : index)}
                      className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                      aria-expanded={abierta}
                    >
                      <span className="text-sm font-semibold text-foreground">{item.pregunta}</span>
                      <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform ${abierta ? "rotate-180" : "rotate-0"}`} />
                    </button>
                    {abierta && (
                      <p className="px-3 pb-3 text-sm text-foreground-muted">{item.respuesta}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Añadir Favorito
              </p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <p className="text-sm text-foreground max-w-[65%]">
                  Guarda esta convocatoria en tu lista para consultarla mas tarde y recibir seguimiento.
                </p>
                <button
                  type="button"
                  aria-label="Añadir a favoritos"
                  className="h-14 w-14 shrink-0 rounded-2xl bg-primary inline-flex items-center justify-center shadow-sm hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Star className="w-7 h-7 text-white fill-white" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Accede a la gu<span className="text-primary">IA</span>
                </span>
              </p>
              <p className="mt-2 text-sm text-foreground">
                Consulta una ruta orientativa con pasos, requisitos y recomendaciones.
              </p>
              <button
                type="button"
                className="mt-3 w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 mr-2" />
                <span>
                  Accede a nuestra guia inteligente
                </span>
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Fechas importantes
              </p>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-muted font-semibold">Inicio</span>
                  <span className="text-foreground">10/05/2026</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-muted font-semibold">Cierre</span>
                  <span className="text-foreground">30/06/2026</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-muted font-semibold">Resolucion</span>
                  <span className="text-foreground">15/09/2026</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleVolverArriba}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
        >
          Volver arriba
        </button>
      </div>
    </section>
  );
}

