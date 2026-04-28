"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { recomendacionesApi, proyectosApi, ConvocatoriaPublica } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { Search, ArrowRight, Sparkles, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";

interface Recomendacion {
  id: number;
  puntuacion: number;
  explicacion: string;
  guia?: string;
  convocatoriaId: number;
  titulo: string;
  tipo?: string;
  sector?: string;
  ubicacion?: string;
  urlOficial?: string;
  fuente?: string;
  vigente: boolean;
  usadaIa: boolean;
  fechaCierre?: string;
  organismo?: string;
  presupuesto?: number;
  fechaPublicacion?: string;
  numeroConvocatoria?: string;
  abierto?: boolean;
}

/** Mapea una Recomendacion al formato ConvocatoriaPublica para reutilizar ConvocatoriaCard. */
function toConvocatoriaPublica(rec: Recomendacion): ConvocatoriaPublica {
  return {
    id: rec.convocatoriaId,
    titulo: rec.titulo,
    tipo: rec.tipo,
    sector: rec.sector,
    ubicacion: rec.ubicacion,
    urlOficial: rec.urlOficial,
    fechaCierre: rec.fechaCierre,
    organismo: rec.organismo,
    presupuesto: rec.presupuesto,
    fechaPublicacion: rec.fechaPublicacion,
    numeroConvocatoria: rec.numeroConvocatoria,
    abierto: rec.abierto ?? rec.vigente,
    matchScore: rec.usadaIa ? rec.puntuacion : undefined,
  };
}

export default function RecomendacionesPage() {
  const { id } = useParams<{ id: string }>();
  const proyectoId = Number(id);
  const [proyecto, setProyecto] = useState<{ nombre: string } | null>(null);
  const [recs, setRecs] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [busquedaMensaje, setBusquedaMensaje] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [guiasLoading, setGuiasLoading] = useState<Set<number>>(new Set());
  const [guias, setGuias] = useState<Record<number, Record<string, unknown>>>({});
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroSector, setFiltroSector] = useState("");
  const [soloAbiertas, setSoloAbiertas] = useState(true);

  const cargarRecs = () => {
    recomendacionesApi.list(proyectoId)
      .then((res) => setRecs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    proyectosApi.get(proyectoId).then((res) => setProyecto(res.data)).catch(() => {});
    cargarRecs();
  }, [proyectoId]);

  // Paso 1: busqueda BDNS sin IA
  const buscar = async () => {
    if (buscando || streaming) return;
    setBuscando(true);
    setBusquedaMensaje(null);
    try {
      const res = await recomendacionesApi.buscar(proyectoId);
      setBusquedaMensaje(res.data.mensaje);
      cargarRecs();
    } catch {
      setBusquedaMensaje("Error al buscar convocatorias. Inténtalo de nuevo.");
    } finally {
      setBuscando(false);
    }
  };

  // Paso 2: analisis IA via SSE
  const iniciarStream = () => {
    if (streaming || buscando) return;
    setStreaming(true);
    setStreamLog(["Iniciando análisis con IA..."]);

    const token = getToken();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/usuario/proyectos/${proyectoId}/recomendaciones/stream`;

    (async () => {
      try {
        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.body) throw new Error("Sin respuesta SSE");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventName = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              const data = line.slice(5).trim();
              handleSseEvent(eventName || "message", data);
              eventName = "";
            }
          }
        }
      } catch (err) {
        setStreamLog((prev) => [...prev, `Error: ${err}`]);
      } finally {
        setStreaming(false);
        cargarRecs();
      }
    })();
  };

  const handleSseEvent = (name: string, data: string) => {
    const clean = data.replace(/^\"|\"$/g, "");
    switch (name) {
      case "estado":
        setStreamLog((prev) => [...prev, clean]);
        break;
      case "keywords":
        setStreamLog((prev) => [...prev, `Keywords: ${clean}`]);
        break;
      case "busqueda":
        setStreamLog((prev) => [...prev, `Buscando: ${clean}`]);
        break;
      case "progreso":
        setStreamLog((prev) => [...prev, `Progreso: ${clean}`]);
        break;
      case "resultado":
        setStreamLog((prev) => [...prev, `Nueva recomendación encontrada`]);
        break;
      case "completado":
        setStreamLog((prev) => [...prev, `Análisis completado: ${clean}`]);
        break;
      case "error":
        setStreamLog((prev) => [...prev, `Error: ${clean}`]);
        break;
    }
  };

  const cargarGuia = async (recId: number) => {
    if (guias[recId]) {
      setExpandedRec(expandedRec === recId ? null : recId);
      return;
    }
    setGuiasLoading((prev) => new Set(prev).add(recId));
    try {
      const res = await recomendacionesApi.guiaEnriquecida(proyectoId, recId);
      setGuias((prev) => ({ ...prev, [recId]: res.data }));
      setExpandedRec(recId);
    } catch {
      alert("No se pudo cargar la guía");
    } finally {
      setGuiasLoading((prev) => { const s = new Set(prev); s.delete(recId); return s; });
    }
  };

  // Valores únicos para los selectores de filtro
  const tiposUnicos = [...new Set(recs.map((r) => r.tipo).filter(Boolean))] as string[];
  const sectoresUnicos = [...new Set(recs.map((r) => r.sector).filter(Boolean))] as string[];

  const recsFiltradas = recs.filter((r) => {
    if (filtro && !r.titulo?.toLowerCase().includes(filtro.toLowerCase())) return false;
    if (filtroTipo && r.tipo !== filtroTipo) return false;
    if (filtroSector && r.sector !== filtroSector) return false;
    if (soloAbiertas && !(r.abierto ?? r.vigente)) return false;
    return true;
  });

  const candidatas = recsFiltradas.filter((r) => !r.usadaIa);
  const recsAnalizadas = recsFiltradas.filter((r) => r.usadaIa && r.puntuacion >= 20);

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/proyectos" className="text-sm text-primary dark:text-blue-300 hover:underline">
            &larr; Proyectos
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">
            Recomendaciones{proyecto ? ` — ${proyecto.nombre}` : ""}
          </h1>
        </div>

      {/* Buscador estilo Home */}
      <form
        onSubmit={(e) => { e.preventDefault(); buscar(); }}
        className="relative max-w-2xl mx-auto mb-4"
      >
        <div className="flex items-center gap-0 bg-surface border-2 border-border rounded-2xl shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors overflow-hidden">
          <Search className="w-5 h-5 text-foreground-muted ml-4 shrink-0" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Busca por sector, tipo de proyecto o nombre de convocatoria..."
            className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-foreground-subtle outline-none focus:outline-none focus-visible:outline-none caret-transparent text-sm"
            style={{ outline: 'none', boxShadow: 'none', caretColor: 'transparent', WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
          />
          {filtro && (
            <button
              type="button"
              onClick={() => setFiltro("")}
              className="mr-2 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={buscando || streaming}
            className="m-1.5 flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shrink-0 disabled:opacity-50"
          >
            {buscando ? "Buscando..." : "Buscar"}
            {buscando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ArrowRight className="w-4 h-4" />
            }
          </button>
        </div>
      </form>

      {/* Filtros rápidos */}
      <div className="max-w-2xl mx-auto flex items-center gap-2 mb-6">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground-muted focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Todos los niveles</option>
          {tiposUnicos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filtroSector}
          onChange={(e) => setFiltroSector(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground-muted focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Explorar por sector</option>
          {sectoresUnicos.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setSoloAbiertas(!soloAbiertas)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
            soloAbiertas
                ? "border-primary bg-primary-light text-primary dark:text-blue-300"
                : "border-border text-foreground-muted hover:border-primary/50"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${soloAbiertas ? "bg-primary" : "bg-foreground-subtle"}`} />
          {soloAbiertas ? "Solo abiertas" : "Incluir cerradas"}
        </button>
      </div>

      {busquedaMensaje && !buscando && (
        <p className="text-sm text-foreground-muted text-center mb-4">{busquedaMensaje}</p>
      )}

      {streaming && streamLog.length > 0 && (
        <div className="mb-6 p-4 bg-gray-900 rounded-xl text-sm font-mono text-success max-h-48 overflow-y-auto">
          {streamLog.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              {i === streamLog.length - 1 && streaming && (
                <Loader2 className="h-3 w-3 animate-spin mt-0.5 flex-shrink-0" />
              )}
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacio */}
      {candidatas.length === 0 && recsAnalizadas.length === 0 && !streaming && (
        <Card>
          <div className="text-center py-8 text-foreground-muted">
            {recs.length === 0
              ? "Busca convocatorias relevantes para este proyecto usando la barra de arriba."
              : "No hay resultados que coincidan con el filtro."}
          </div>
        </Card>
      )}

      {/* Candidatas (sin analizar por IA) — misma card que el Home */}
      {candidatas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
              Convocatorias encontradas
            </h2>
            <span className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
              {candidatas.length} pendientes de análisis IA
            </span>
          </div>
          <div className="space-y-4">
            {candidatas.map((rec) => (
              <ConvocatoriaCard
                key={rec.id}
                convocatoria={toConvocatoriaPublica(rec)}
                autenticado={true}
                />
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones analizadas por IA — card del Home + score + guia */}
      {recsAnalizadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
              Recomendaciones IA
            </h2>
            <span className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
              {recsAnalizadas.length} ordenadas por puntuación
            </span>
          </div>
          <div className="space-y-4">
            {recsAnalizadas.map((rec) => (
              <div key={rec.id} className="space-y-0">
                {/* Score badge + explicacion encima de la card */}
                <div className="flex items-center gap-3 mb-2">
                  <ScoreBadge score={rec.puntuacion} />
                  {rec.explicacion && (
                    <p className="text-sm text-foreground-muted line-clamp-1 flex-1">{rec.explicacion}</p>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={guiasLoading.has(rec.id)}
                    onClick={() => cargarGuia(rec.id)}
                    icon={expandedRec === rec.id
                      ? <ChevronUp className="h-3.5 w-3.5" />
                      : <ChevronDown className="h-3.5 w-3.5" />
                    }
                  >
                    {expandedRec === rec.id ? "Ocultar guía" : "Ver guía"}
                  </Button>
                </div>

                {/* Card identica al Home */}
                <ConvocatoriaCard
                  convocatoria={toConvocatoriaPublica(rec)}
                  autenticado={true}
                  showMatch={true}
                />

                {/* Guia expandida debajo de la card */}
                {expandedRec === rec.id && guias[rec.id] && (() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const g = guias[rec.id] as any;
                  const summary = g?.grant_summary;
                  const docs: string[] = g?.required_documents ?? [];
                  const reqs: string[] = g?.universal_requirements_lgs_art13 ?? [];
                  const methods: {method?: string; description?: string}[] = g?.application_methods ?? [];
                  const disclaimer: string = g?.legal_disclaimer ?? "";
                  return (
                    <div className="mt-2 p-5 rounded-2xl border border-border bg-white space-y-4 text-sm text-foreground-muted">
                      <h4 className="font-semibold text-foreground">Guía de solicitud</h4>

                      {summary && (
                        <div className="space-y-1">
                          {summary.title && <p><span className="font-medium text-foreground">Título:</span> {summary.title}</p>}
                          {summary.organism && <p><span className="font-medium text-foreground">Organismo:</span> {summary.organism}</p>}
                          {summary.objective && <p><span className="font-medium text-foreground">Objetivo:</span> {summary.objective}</p>}
                          {summary.who_can_apply && <p><span className="font-medium text-foreground">Quién puede solicitar:</span> {summary.who_can_apply}</p>}
                          {summary.deadline && <p><span className="font-medium text-foreground">Plazo:</span> {summary.deadline}</p>}
                          {summary.official_link && <p><span className="font-medium text-foreground">Enlace oficial:</span>{" "}
                            <a href={summary.official_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{summary.official_link}</a>
                          </p>}
                        </div>
                      )}

                      {methods.length > 0 && (
                        <div>
                          <p className="font-medium text-foreground mb-1">Métodos de solicitud:</p>
                          <ul className="list-disc list-inside space-y-1 pl-2">
                            {methods.map((m, i) => (
                              <li key={i}>{m.method}{m.description ? ` — ${m.description}` : ""}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {docs.length > 0 && (
                        <div>
                          <p className="font-medium text-foreground mb-1">Documentos requeridos:</p>
                          <ul className="list-disc list-inside space-y-1 pl-2">
                            {docs.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      )}

                      {reqs.length > 0 && (
                        <div>
                          <p className="font-medium text-foreground mb-1">Requisitos LGS art. 13:</p>
                          <ul className="list-disc list-inside space-y-1 pl-2">
                            {reqs.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}

                      {disclaimer && (
                        <p className="text-xs text-foreground-muted italic border-t border-border pt-2">{disclaimer}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
