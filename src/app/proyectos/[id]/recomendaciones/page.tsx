"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { recomendacionesApi, proyectosApi } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ScoreBadge } from "@/src/components/ui/Badge";
import { Search, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface Recomendacion {
  id: number;
  puntuacion: number;
  explicacion: string;
  guia?: string;
  convocatoriaId: number;
  titulo: string;
  tipo: string;
  sector: string;
  ubicacion: string;
  urlOficial: string;
  fuente: string;
  vigente: boolean;
  usadaIa: boolean;
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

  // Paso 1: búsqueda BDNS sin IA
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

  // Paso 2: análisis IA vía SSE
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
        setStreamLog((prev) => [...prev, `✓ Nueva recomendación encontrada`]);
        break;
      case "completado":
        setStreamLog((prev) => [...prev, `✓ Análisis completado: ${clean}`]);
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

  const recsFiltradas = recs.filter((r) =>
    !filtro || r.titulo?.toLowerCase().includes(filtro.toLowerCase())
  );

  const candidatas = recsFiltradas.filter((r) => !r.usadaIa);
  const recsAnalizadas = recsFiltradas.filter((r) => r.usadaIa && r.puntuacion >= 20);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/proyectos" className="text-sm text-blue-600 hover:underline">← Proyectos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Recomendaciones{proyecto ? ` — ${proyecto.nombre}` : ""}
        </h1>
      </div>

      {/* Panel de acciones */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Buscar y analizar</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Paso 1: busca convocatorias en BDNS.&nbsp; Paso 2: analiza con IA.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={buscar}
              loading={buscando}
              disabled={buscando || streaming}
            >
              <Search className="h-4 w-4" />
              {buscando ? "Buscando..." : "Buscar convocatorias"}
            </Button>
            <Button
              onClick={iniciarStream}
              loading={streaming}
              disabled={streaming || buscando}
            >
              <Sparkles className="h-4 w-4" />
              {streaming ? "Analizando..." : "Analizar con IA"}
            </Button>
          </div>
        </div>

        {busquedaMensaje && !buscando && (
          <p className="mt-3 text-sm text-gray-600">{busquedaMensaje}</p>
        )}

        {streaming && streamLog.length > 0 && (
          <div className="mt-4 p-4 bg-gray-900 rounded-lg text-sm font-mono text-green-400 max-h-48 overflow-y-auto">
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
      </Card>

      {/* Buscador */}
      {recs.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filtrar por título..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Estado vacío */}
      {candidatas.length === 0 && recsAnalizadas.length === 0 && !streaming && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            {recs.length === 0
              ? "Pulsa «Buscar convocatorias» para encontrar subvenciones relevantes para este proyecto."
              : "No hay resultados que coincidan con el filtro."}
          </div>
        </Card>
      )}

      {/* Candidatas (sin analizar por IA) */}
      {candidatas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Convocatorias encontradas
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {candidatas.length} pendientes de análisis IA
            </span>
          </div>
          <div className="space-y-2">
            {candidatas.map((rec) => (
              <Card key={rec.id} padding={false}>
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {rec.tipo && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {rec.tipo}
                        </span>
                      )}
                      {!rec.vigente && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          Cerrada
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{rec.titulo}</h3>
                  </div>
                  {rec.urlOficial && (
                    <a
                      href={rec.urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    >
                      Ver convocatoria
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Pulsa «Analizar con IA» para puntuar y ordenar estas convocatorias.
          </p>
        </div>
      )}

      {/* Recomendaciones analizadas por IA */}
      {recsAnalizadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Recomendaciones IA
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {recsAnalizadas.length} ordenadas por puntuación
            </span>
          </div>
          <div className="space-y-3">
            {recsAnalizadas.map((rec) => (
              <Card key={rec.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <ScoreBadge score={rec.puntuacion} />
                        {rec.tipo && (
                          <span className="text-xs text-gray-500">{rec.tipo}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{rec.titulo}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{rec.explicacion}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {rec.urlOficial && (
                        <a
                          href={rec.urlOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver convocatoria
                        </a>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={guiasLoading.has(rec.id)}
                        onClick={() => cargarGuia(rec.id)}
                      >
                        {expandedRec === rec.id ? (
                          <><ChevronUp className="h-3.5 w-3.5" />Ocultar guía</>
                        ) : (
                          <><ChevronDown className="h-3.5 w-3.5" />Ver guía</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Guía expandida */}
                  {expandedRec === rec.id && guias[rec.id] && (() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const g = guias[rec.id] as any;
                    const summary = g?.grant_summary;
                    const docs: string[] = g?.required_documents ?? [];
                    const reqs: string[] = g?.universal_requirements_lgs_art13 ?? [];
                    const methods: {method?: string; description?: string}[] = g?.application_methods ?? [];
                    const disclaimer: string = g?.legal_disclaimer ?? "";
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 text-sm text-gray-700">
                        <h4 className="font-semibold text-gray-900">Guía de solicitud</h4>

                        {summary && (
                          <div className="space-y-1">
                            {summary.title && <p><span className="font-medium">Título:</span> {summary.title}</p>}
                            {summary.organism && <p><span className="font-medium">Organismo:</span> {summary.organism}</p>}
                            {summary.objective && <p><span className="font-medium">Objetivo:</span> {summary.objective}</p>}
                            {summary.who_can_apply && <p><span className="font-medium">Quién puede solicitar:</span> {summary.who_can_apply}</p>}
                            {summary.deadline && <p><span className="font-medium">Plazo:</span> {summary.deadline}</p>}
                            {summary.official_link && <p><span className="font-medium">Enlace oficial:</span>{" "}
                              <a href={summary.official_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{summary.official_link}</a>
                            </p>}
                          </div>
                        )}

                        {methods.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Métodos de solicitud:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              {methods.map((m, i) => (
                                <li key={i}>{m.method}{m.description ? ` — ${m.description}` : ""}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {docs.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Documentos requeridos:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              {docs.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                          </div>
                        )}

                        {reqs.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Requisitos LGS art. 13:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              {reqs.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}

                        {disclaimer && (
                          <p className="text-xs text-gray-500 italic border-t pt-2">{disclaimer}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
