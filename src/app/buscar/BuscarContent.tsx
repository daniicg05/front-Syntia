"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { convocatoriasPublicasApi, convocatoriasUsuarioApi, ConvocatoriaPublica, BusquedaPublicaResponse, RegionNodo } from "@/lib/api";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { ModalAccesoRequerido } from "@/components/ModalAccesoRequerido";

const stripCodigo = (d: string) => d.replace(/^[A-Z0-9]+ - /, "").trim();

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

const TAMANOS_PAGINA = [10, 20, 50] as const;

export default function BuscarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const qParam       = searchParams.get("q") ?? "";
    const sectorParam  = searchParams.get("sector") ?? "";
    const pageParam    = parseInt(searchParams.get("page") ?? "0", 10);
    const sizeCandidate = parseInt(searchParams.get("size") ?? "20", 10);
    const sizeParam = TAMANOS_PAGINA.includes(sizeCandidate as (typeof TAMANOS_PAGINA)[number])
        ? sizeCandidate
        : 20;
    const cerradasParam = searchParams.get("cerradas") === "1";
    const regionParam   = searchParams.get("regionId") ? Number(searchParams.get("regionId")) : null;

    const [query, setQuery]               = useState(qParam);
    const [sector, setSector]             = useState(sectorParam);
    const [soloAbiertas, setSoloAbiertas] = useState(!cerradasParam);
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(regionParam);
    const [regiones, setRegiones]         = useState<RegionNodo[]>([]);
    const [resultados, setResultados]     = useState<BusquedaPublicaResponse | null>(null);
    const [loading, setLoading]           = useState(false);
    const [modalAcceso, setModalAcceso]   = useState(false);
    const [showFiltros, setShowFiltros]   = useState(false);
    const [autenticado, setAutenticado]   = useState(false);
    const [authReady, setAuthReady]       = useState(false);

    const buscar = useCallback((q: string, sec: string, page: number, abiertas: boolean, regionId?: number | null) => {
        setLoading(true);
        const params = {
            q:        q   || undefined,
            sector:   sec || undefined,
            abierto:  abiertas ? true : undefined,
            regionId: regionId ?? undefined,
            page,
            size: 20
        };
        const request = autenticado
            ? convocatoriasUsuarioApi.buscar(params)
            : convocatoriasPublicasApi.buscar(params);

        request
            .then((res) => setResultados(res.data))
            .catch(() => setResultados(null))
            .finally(() => setLoading(false));
    }, [autenticado]);

    useEffect(() => {
        if (regiones.length === 0) {
            convocatoriasPublicasApi.regiones()
                .then((res) => setRegiones(res.data))
                .catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setQuery(qParam);
        setSector(sectorParam);
        setSoloAbiertas(!cerradasParam);
        setSelectedRegionId(regionParam);
        buscar(qParam, sectorParam, pageParam, !cerradasParam, regionParam);
    }, [qParam, sectorParam, pageParam, cerradasParam, regionParam, buscar]);

    function buildParams(q: string, sec: string, page: number, abiertas: boolean,size:number, regionId?: number | null) {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (sec) params.set("sector", sec);
        if (page) params.set("page", String(page));
        if (size !== 20) params.set("size", String(size));
        if (!abiertas) params.set("cerradas", "1");
        if (regionId) params.set("regionId", String(regionId));
        return params.toString();
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.push(`/buscar?${buildParams(query.trim(), sector, 0, soloAbiertas, selectedRegionId)}`);
    }

    function handleSectorChange(value: string) {
        setSector(value);
        router.push(`/buscar?${buildParams(query.trim(), value, 0, soloAbiertas, selectedRegionId)}`);
    }

    function handleToggleAbiertas() {
        const next = !soloAbiertas;
        router.push(`/buscar?${buildParams(qParam, sectorParam, 0, next, selectedRegionId)}`);
    }

    function handleRegionChange(value: string) {
        const id = value ? Number(value) : null;
        setSelectedRegionId(id);
        router.push(`/buscar?${buildParams(qParam, sectorParam, 0, soloAbiertas, id)}`);
    }

    function goToPage(page: number) {
        router.push(`/buscar?${buildParams(qParam, sectorParam, page, soloAbiertas, selectedRegionId)}`);
    }

    const tieneResultados = resultados && resultados.content.length > 0;

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
                            showFiltros || sector || !soloAbiertas || selectedRegionId
                                ? "border-primary bg-primary-light text-primary"
                                : "border-border text-foreground-muted hover:bg-surface-muted"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {(sector || !soloAbiertas || selectedRegionId) && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                </form>

                {/* Filtros desplegables */}
                {showFiltros && (
                    <div className="mt-3 p-4 bg-surface border border-border rounded-xl space-y-4">
                        <div>
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

                        {regiones.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-3">
                                    Región / CCAA
                                </p>
                                <select
                                    value={selectedRegionId ?? ""}
                                    onChange={(e) => handleRegionChange(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-primary transition-colors text-foreground"
                                >
                                    <option value="">Toda España</option>
                                    {regiones.map((macroRegion) => (
                                        <optgroup key={macroRegion.id} label={stripCodigo(macroRegion.descripcion)}>
                                            {macroRegion.children.map((ccaa) => (
                                                <option key={ccaa.id} value={ccaa.id}>
                                                    {stripCodigo(ccaa.descripcion)}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="border-t border-border pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Incluir convocatorias cerradas</p>
                                <p className="text-xs text-foreground-subtle mt-0.5">Por defecto solo se muestran las convocatorias abiertas</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleAbiertas}
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                                    !soloAbiertas ? "bg-primary" : "bg-border"
                                }`}
                                role="switch"
                                aria-checked={!soloAbiertas}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                                    !soloAbiertas ? "translate-x-6" : "translate-x-1"
                                }`} />
                            </button>
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
                            convocatoria{resultados.totalElements !== 1 ? "s" : ""}{" "}
                            {soloAbiertas ? "abiertas" : ""} encontrada{resultados.totalElements !== 1 ? "s" : ""}
                            {qParam && (
                                <> para <span className="font-medium text-foreground">"{qParam}"</span></>
                            )}
                            {sectorParam && (
                                <> · sector <span className="font-medium text-foreground capitalize">{sectorParam}</span></>
                            )}
                        </p>
                    ) : (
                        <p className="text-sm text-foreground-muted">Sin resultados</p>
                    )}
                </div>

                {authReady && !autenticado && (
                    <p className="text-xs text-foreground-subtle hidden sm:block">
                        <a href="/login" className="text-primary font-semibold hover:underline">
                            Inicia sesión
                        </a>{" "}
                        para ver el detalle completo
                    </p>
                )}
            </div>

            <div className="flex items-center justify-end mb-5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                        Número de subvenciones
                    </span>
                    <div className="flex items-center gap-2">
                        {TAMANOS_PAGINA.map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => handlePageSizeChange(size)}
                                className={`min-w-10 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                                    sizeParam === size
                                        ? "border-primary bg-primary-light text-primary"
                                        : "border-border text-foreground-muted hover:border-primary/40 hover:text-foreground"
                                }`}
                                aria-label={`Mostrar ${size} subvenciones por página`}
                                aria-pressed={sizeParam === size}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resultados */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-36 bg-surface border border-border rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : tieneResultados ? (
                <>
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {resultados.content.map((c: ConvocatoriaPublica) => (
                            <ConvocatoriaCard
                                key={c.id}
                                convocatoria={c}
                                autenticado={autenticado}
                                showMatch={autenticado && c.matchScore != null}
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
            ) : !loading ? (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <p className="font-medium text-foreground mb-2">No encontramos resultados</p>
                    <p className="text-sm text-foreground-muted mb-6">
                        Prueba con otros términos o elimina algunos filtros
                    </p>
                    {(qParam || sectorParam || !soloAbiertas) && (
                        <button
                            onClick={() => router.push("/buscar")}
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : null}
        </div>
    );
}
