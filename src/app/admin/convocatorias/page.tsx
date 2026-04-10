"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import type { Convocatoria, ConvocatoriasPageResponse } from "@/lib/types/convocatorias";
import { Button } from "@/components/ui/Button";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";

type PageCache = Record<number, ConvocatoriasPageResponse>;

export default function AdminConvocatoriasPage() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const pageCacheRef = useRef<PageCache>({});
  const inFlightRef = useRef<Record<number, Promise<ConvocatoriasPageResponse>>>({});
  const hasLoadedOnceRef = useRef(false);

  const applyPage = (data: ConvocatoriasPageResponse) => {
    setConvocatorias(data.convocatorias);
    setCurrentPage(data.page);
    setPageSize(data.size);
    setTotalElements(data.totalElements);
    setTotalPages(data.totalPages);
    setHasNext(data.hasNext);
  };

  const fetchPage = useCallback(async (page: number) => {
    const cached = pageCacheRef.current[page];
    if (cached) return cached;

    const pending = inFlightRef.current[page];
    if (pending) return pending;

    const request = adminApi.convocatorias
      .list(page)
      .then((r) => {
        pageCacheRef.current[page] = r.data;
        return r.data;
      })
      .finally(() => {
        delete inFlightRef.current[page];
      });

    inFlightRef.current[page] = request;
    return request;
  }, []);

  const prefetchPage = useCallback(
    async (page: number) => {
      if (page < 0) return;
      if (pageCacheRef.current[page]) return;
      try {
        await fetchPage(page);
      } catch {
        // El prefetch no debe bloquear la interaccion del usuario.
      }
    },
    [fetchPage]
  );

  const loadPage = useCallback(
    async (page: number) => {
      setError("");

      const hasCache = Boolean(pageCacheRef.current[page]);
      if (!hasCache) {
        if (!hasLoadedOnceRef.current) setInitialLoading(true);
        else setPageLoading(true);
      }

      try {
        const data = await fetchPage(page);
        applyPage(data);
        hasLoadedOnceRef.current = true;

        if (data.hasNext) {
          void prefetchPage(data.page + 1);
        }
      } catch {
        setError("No se pudieron cargar las convocatorias. Intenta de nuevo.");
      } finally {
        setInitialLoading(false);
        setPageLoading(false);
      }
    },
    [fetchPage, prefetchPage]
  );

  const resetCache = () => {
    pageCacheRef.current = {};
    inFlightRef.current = {};
  };

  const reloadPage = async (page: number) => {
    resetCache();
    await loadPage(page);
  };

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const importar = async () => {
    setImportando(true);
    setMsg("");

    try {
      const res = await adminApi.convocatorias.importarBdns();
      setMsg(res.data.mensaje ?? "Importacion completada");
      await reloadPage(0);
    } catch {
      setMsg("Error al importar desde BDNS");
    } finally {
      setImportando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta convocatoria?")) return;

    try {
      await adminApi.convocatorias.delete(id);
      setMsg("Convocatoria eliminada correctamente");

      const nextPage = convocatorias.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      await reloadPage(nextPage);
    } catch {
      setMsg("No se pudo eliminar la convocatoria");
    }
  };

  const firstElement = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const lastElement = currentPage * pageSize + convocatorias.length;

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Convocatorias ({totalElements})</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={importar}
            loading={importando}
            disabled={pageLoading}
            icon={<Download className="h-4 w-4" />}
          >
            Importar BDNS
          </Button>
          <Link href="/admin/convocatorias/nueva">
            <Button icon={<Plus className="h-4 w-4" />}>Nueva</Button>
          </Link>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl">
          {msg}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={() => void loadPage(currentPage)}>
            Reintentar
          </Button>
        </div>
      )}

      {!error && convocatorias.length === 0 && (
        <div className="p-8 text-center bg-surface rounded-2xl border border-border text-foreground-muted">
          No hay convocatorias para mostrar.
        </div>
      )}

      {!error && convocatorias.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted text-xs text-foreground-muted flex items-center justify-between">
            <span>
              Mostrando {firstElement}-{lastElement} de {totalElements}
            </span>
            {pageLoading && <span>Cargando pagina...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-foreground-muted">Titulo</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground-muted hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground-muted hidden lg:table-cell">Sector</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground-muted hidden lg:table-cell">Cierre</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {convocatorias.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">{c.titulo}</td>
                    <td className="px-4 py-3 text-foreground-muted hidden md:table-cell">{c.tipo || "-"}</td>
                    <td className="px-4 py-3 text-foreground-muted hidden lg:table-cell">{c.sector || "-"}</td>
                    <td className="px-4 py-3 text-foreground-muted hidden lg:table-cell">
                      {c.fechaCierre ? new Date(c.fechaCierre).toLocaleDateString("es") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/convocatorias/${c.id}/editar`}>
                          <Button variant="secondary" size="sm">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={() => void eliminar(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-surface-muted">
            <span className="text-xs text-foreground-muted">
              Pagina {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void loadPage(currentPage - 1)}
                disabled={currentPage === 0 || pageLoading}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void loadPage(currentPage + 1)}
                disabled={!hasNext || pageLoading || totalPages === 0}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
