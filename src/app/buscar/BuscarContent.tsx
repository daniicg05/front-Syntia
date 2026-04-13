"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { convocatoriasPublicasApi, ConvocatoriaPublica, BusquedaPublicaResponse } from "@/lib/api";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { ModalAccesoRequerido } from "@/components/ModalAccesoRequerido";

const SECTORES_FILTRO = [
    { value: "", label: "Todos los sectores" },
    { value: "tecnologia", label: "Tecnología e Innovación" },
    { value: "agricola", label: "Sector Agrícola" },
    { value: "industrial", label: "Sector Industrial" },
    { value: "hosteleria", label: "Hostelería y Turismo" },
    { value: "social", label: "Social y Cultural" },
    { value: "medioambiente", label: "Medio Ambiente" },
    { value: "comercio", label: "Comercio y Pymes" },
    { value: "salud", label: "Salud e Investigación" },
    { value: "educacion", label: "Educación y Formación" },
];

export default function BuscarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const qParam = searchParams.get("q") ?? "";
    const sectorParam = searchParams.get("sector") ?? "";
    const pageParam = parseInt(searchParams.get("page") ?? "0", 10);

    const [query, setQuery] = useState(qParam);
    const [sector, setSector] = useState(sectorParam);
    const [resultados, setResultados] = useState<BusquedaPublicaResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalAcceso, setModalAcceso] = useState(false);
    const [showFiltros, setShowFiltros] = useState(false);
    const autenticado = isAuthenticated();

    const buscar = useCallback((q: string, sec: string, page: number) => {
        setLoading(true);
        convocatoriasPublicasApi
            .buscar({ q: q || undefined, sector: sec || undefined, page, size: 20 })
            .then((res) => setResultados(res.data))
            .catch(() => setResultados(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setQuery(qParam);
        setSector(sectorParam);
        buscar(qParam, sectorParam, pageParam);
    }, [qParam, sectorParam, pageParam, buscar]);

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        const q = query.trim();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (sector) params.set("sector", sector);
        router.push(`/buscar?${params.toString()}`);
    }

    function handleSectorChange(value: string) {
        setSector(value);
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (value) params.set("sector", value);
        router.push(`/buscar?${params.toString()}`);
    }

    function goToPage(page: number) {
        const params = new URLSearchParams();
        if (qParam) params.set("q", qParam);
        if (sectorParam) params.set("sector", sectorParam);
        params.set("page", String(page));
        router.push(`/buscar?${params.toString()}`);
    }

    const tieneResultados = resultados && resultados.content.length > 0;
    const tieneQuery = qParam || sectorParam;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {modalAcceso && (
                <ModalAccesoRequerido onClose={() => setModalAcceso(false)} />
            )}

            {/* Barra de búsqueda */}
            <div className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex-1 flex items-center gap-0 bg-surface border-2 border-border rounded-xl focus-within:border-primary transition-colors overflow-hidden">
                        <Search className="w-4 h-4 text-foreground-muted ml-3 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Busca convocatorias por nombre, sector, organismo..."
                            className="flex-1 px-3 py-3 bg-transparent text-foreground placeholder:text-foreground-subtle outline-none text-sm"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="mr-2 text-foreground-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors"
                    >
                        Buscar
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFiltros((v) => !v)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                            showFiltros || sector
                                ? "border-primary bg-primary-light text-primary"
                                : "border-border text-foreground-muted hover:bg-surface-muted"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {sector && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                </form>

                {/* Filtros desplegables */}
                {showFiltros && (
                    <div className="mt-3 p-4 bg-surface border border-border rounded-xl">
                        <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-3">
                            Sector
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SECTORES_FILTRO.map((s) => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => handleSectorChange(s.value)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                        sector === s.value
                                            ? "border-primary bg-primary-light text-primary"
                                            : "border-border text-foreground-muted hover:border-primary/50 hover:text-foreground"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Header de resultados */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    {loading ? (
                        <div className="h-5 w-48 bg-surface-muted rounded-lg animate-pulse" />
                    ) : resultados ? (
                        <p className="text-sm text-foreground-muted">
                            <span className="font-semibold text-foreground">
                                {resultados.totalElements.toLocaleString()}
                            </span>{" "}
                            convocatorias encontradas
                            {qParam && (
                                <> para <span className="font-medium text-foreground">"{qParam}"</span></>
                            )}
                            {sectorParam && (
                                <> en sector{" "}
                                <span className="font-medium text-foreground capitalize">{sectorParam}</span>
                                </>
                            )}
                        </p>
                    ) : tieneQuery ? (
                        <p className="text-sm text-foreground-muted">Sin resultados</p>
                    ) : (
                        <p className="text-sm text-foreground-muted">Introduce un término de búsqueda</p>
                    )}
                </div>

                {!autenticado && (
                    <p className="text-xs text-foreground-subtle hidden sm:block">
                        <a href="/login" className="text-primary font-semibold hover:underline">
                            Inicia sesión
                        </a>{" "}
                        para ver el detalle completo
                    </p>
                )}
            </div>

            {/* Resultados */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-52 bg-surface border border-border rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : tieneResultados ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                        {resultados.content.map((c: ConvocatoriaPublica) => (
                            <ConvocatoriaCard
                                key={c.id}
                                convocatoria={c}
                                autenticado={autenticado}
                                onAccesoRequerido={() => setModalAcceso(true)}
                            />
                        ))}
                    </div>

                    {/* Paginación */}
                    {resultados.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => goToPage(resultados.page - 1)}
                                disabled={resultados.page === 0}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground-muted hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from(
                                    { length: Math.min(resultados.totalPages, 7) },
                                    (_, i) => {
                                        const total = resultados.totalPages;
                                        const cur = resultados.page;
                                        let p: number;
                                        if (total <= 7) {
                                            p = i;
                                        } else if (cur <= 3) {
                                            p = i;
                                        } else if (cur >= total - 4) {
                                            p = total - 7 + i;
                                        } else {
                                            p = cur - 3 + i;
                                        }
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => goToPage(p)}
                                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                                    p === cur
                                                        ? "bg-primary text-white"
                                                        : "border border-border text-foreground-muted hover:bg-surface-muted"
                                                }`}
                                            >
                                                {p + 1}
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <button
                                onClick={() => goToPage(resultados.page + 1)}
                                disabled={resultados.page >= resultados.totalPages - 1}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground-muted hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            ) : !loading && tieneQuery ? (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <p className="font-medium text-foreground mb-2">No encontramos resultados</p>
                    <p className="text-sm text-foreground-muted mb-6">
                        Prueba con otros términos o elimina algunos filtros
                    </p>
                    <button
                        onClick={() => router.push("/buscar")}
                        className="text-sm text-primary hover:underline font-medium"
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            ) : !loading && !tieneQuery ? (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <p className="font-medium text-foreground mb-2">Empieza a buscar</p>
                    <p className="text-sm text-foreground-muted">
                        Introduce un término de búsqueda o selecciona un sector con los filtros
                    </p>
                </div>
            ) : null}
        </div>
    );
}
