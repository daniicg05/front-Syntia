"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { recomendacionesApi, proyectosApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useFavoriteIds } from "@/hooks/useFavorites";
import { useToast } from "@/components/ui/Toast";
import type { RecomendacionDTO } from "@/lib/types/recomendacion";
import type { ApiError } from "@/lib/types/favorites";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { Search, Sparkles, ChevronDown, ChevronUp, Loader2, Star } from "lucide-react";

function favoriteErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  if (!apiError?.status) {
    return apiError?.message || "No se pudo actualizar favorita.";
  }
  if (apiError.status === 401) return "Sesion expirada. Inicia sesion de nuevo.";
  if (apiError.status === 403) return "No tienes permisos para gestionar favoritas.";
  if (apiError.status === 404) return "La convocatoria ya no esta disponible.";
  if (apiError.status >= 500) return "Error temporal del servidor. Intentalo de nuevo.";
  return apiError.message || "No se pudo actualizar favorita.";
}

export default function RecomendacionesPage() {
  const { id } = useParams<{ id: string }>();
  const proyectoId = Number(id);
  const [proyecto, setProyecto] = useState<{ nombre: string } | null>(null);
  const [recs, setRecs] = useState<RecomendacionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [busquedaMensaje, setBusquedaMensaje] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [guiasLoading, setGuiasLoading] = useState<Set<number>>(new Set());
  const [guias, setGuias] = useState<Record<number, Record<string, unknown>>>({});
  const [filtro, setFiltro] = useState("");
  const toast = useToast();
  const isAuthenticated = Boolean(getToken());
  const {
    isFavorite,
    toggleFavorite: toggleFavoriteRemote,
    hydrateFromRecommendations,
  } = useFavoriteIds(isAuthenticated);

  const cargarRecs = useCallback(() => {
    recomendacionesApi.list(proyectoId)
      .then((res) => {
        const data = res.data as RecomendacionDTO[];
        setRecs(data);
        hydrateFromRecommendations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proyectoId, hydrateFromRecommendations]);

  const handleToggleFavorite = useCallback(async (convocatoriaId: number) => {
    if (!isAuthenticated) {
      toast.warning("Debes iniciar sesion para guardar favoritas.");
      return;
    }

    const previous = isFavorite(convocatoriaId);
    const optimistic = !previous;

    setRecs((prev) =>
      prev.map((rec) =>
        rec.convocatoriaId === convocatoriaId ? { ...rec, favorita: optimistic } : rec
      )
    );

    try {
      const finalState = await toggleFavoriteRemote(convocatoriaId);
      setRecs((prev) =>
        prev.map((rec) =>
          rec.convocatoriaId === convocatoriaId ? { ...rec, favorita: finalState } : rec
        )
      );
      toast.success(finalState ? "Convocatoria anadida a favoritas." : "Convocatoria eliminada de favoritas.");
    } catch (error) {
      setRecs((prev) =>
        prev.map((rec) =>
          rec.convocatoriaId === convocatoriaId ? { ...rec, favorita: previous } : rec
        )
      );
      toast.error(favoriteErrorMessage(error));
    }
  }, [isAuthenticated, isFavorite, toggleFavoriteRemote, toast]);

  useEffect(() => {
    proyectosApi.get(proyectoId).then((res) => setProyecto(res.data)).catch(() => {});
    cargarRecs();
  }, [proyectoId, cargarRecs]);

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
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/proyectos" className="text-sm text-primary hover:underline">← Proyectos</Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">
          Recomendaciones{proyecto ? ` — ${proyecto.nombre}` : ""}
        </h1>
      </div>

      {/* Panel de acciones */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Buscar y analizar</h2>
            <p className="text-sm text-foreground-muted mt-0.5">
              Lanza la búsqueda y el análisis para actualizar las convocatorias de este proyecto.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={buscar}
              loading={buscando}
              disabled={buscando || streaming}
              icon={<Search className="h-4 w-4" />}
            >
              {buscando ? "Buscando..." : "Buscar convocatorias"}
            </Button>
            <Button
              onClick={iniciarStream}
              loading={streaming}
              disabled={streaming || buscando}
              icon={<Sparkles className="h-4 w-4" />}
            >
              {streaming ? "Analizando..." : "Analizar con IA"}
            </Button>
          </div>
        </div>

        {busquedaMensaje && !buscando && (
          <p className="mt-3 text-sm text-foreground-muted">{busquedaMensaje}</p>
        )}

        {streaming && streamLog.length > 0 && (
          <div className="mt-4 p-4 bg-gray-900 rounded-xl text-sm font-mono text-success max-h-48 overflow-y-auto">
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
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {/* Estado vacío */}
      {candidatas.length === 0 && recsAnalizadas.length === 0 && !streaming && (
        <Card>
          <div className="text-center py-8 text-foreground-muted">
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
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
              Convocatorias encontradas
            </h2>
            <span className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
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
                        <span className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
                          {rec.tipo}
                        </span>
                      )}
                      {!rec.vigente && (
                        <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                          Cerrada
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground line-clamp-2">{rec.titulo}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(rec.convocatoriaId)}
                      aria-label="Alternar favorita"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-surface hover:bg-surface-muted transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${(rec.favorita ?? isFavorite(rec.convocatoriaId)) ? "fill-amber-400 text-amber-500" : "text-foreground-muted"}`}
                      />
                    </button>
                    {rec.urlOficial && (
                      <a
                        href={rec.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver convocatoria
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-foreground-muted mt-2 text-center">
            Pulsa «Analizar con IA» para puntuar y ordenar estas convocatorias.
          </p>
        </div>
      )}

      {/* Recomendaciones analizadas por IA */}
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
          <div className="space-y-3">
            {recsAnalizadas.map((rec) => (
              <Card key={rec.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <ScoreBadge score={rec.puntuacion} />
                        {rec.tipo && (
                          <span className="text-xs text-foreground-muted">{rec.tipo}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{rec.titulo}</h3>
                      <p className="text-sm text-foreground-muted line-clamp-3">{rec.explicacion}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(rec.convocatoriaId)}
                        aria-label="Alternar favorita"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-surface hover:bg-surface-muted transition-colors self-end"
                      >
                        <Star
                          className={`w-4 h-4 ${(rec.favorita ?? isFavorite(rec.convocatoriaId)) ? "fill-amber-400 text-amber-500" : "text-foreground-muted"}`}
                        />
                      </button>
                      {rec.urlOficial && (
                        <a
                          href={rec.urlOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Ver convocatoria
                        </a>
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
                      <div className="mt-4 pt-4 border-t border-border space-y-4 text-sm text-foreground-muted">
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
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
