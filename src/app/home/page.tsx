"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";

import { Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { ModalAccesoRequerido } from "@/components/ModalAccesoRequerido";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { convocatoriasPublicasApi, convocatoriasUsuarioApi, ConvocatoriaPublica, BusquedaPublicaResponse, RegionNodo } from "@/lib/api";

// ── Datos estáticos ────────────────────────────────────────────────────────────

 


const stripCodigo = (d: string) => d.replace(/^[A-Z0-9]+ - /, "").trim();

const TIPOS_CONVOCATORIA = ["Subvención", "Préstamo", "Garantía", "Premio", "Subvención + Préstamo"];

const PLAZOS_CIERRE = [
    { value: "",   label: "Cualquier plazo"     },
    { value: "7",  label: "Cierra en 7 días"    },
    { value: "30", label: "Cierra en 30 días"   },
    { value: "90", label: "Cierra en 90 días"   },
];

const TIPOS_BENEFICIARIO = ["Pyme", "Autónomo", "Gran Empresa", "Startup", "Entidad sin ánimo de lucro"];

// ── Helpers de orden local ─────────────────────────────────────────────────────

function sortResults(list: ConvocatoriaPublica[], sortBy: string): ConvocatoriaPublica[] {
    if (sortBy === "plazo") {
        return [...list].sort((a, b) => {
            if (!a.fechaCierre) return 1;
            if (!b.fechaCierre) return -1;
            return new Date(a.fechaCierre).getTime() - new Date(b.fechaCierre).getTime();
        });
    }
    if (sortBy === "cuantia") {
        return [...list].sort((a, b) => (b.presupuesto ?? 0) - (a.presupuesto ?? 0));
    }
    return list;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function HomePage() {
    const [autenticado, setAutenticado] = useState(false);

    useEffect(() => {
        setAutenticado(isAuthenticated());
    }, []);

    const [modalAcceso,  setModalAcceso]  = useState(false);
    const [finalidades,  setFinalidades]  = useState<string[]>([]);
    const [tipos,        setTipos]        = useState<string[]>([]);
    const [regiones,     setRegiones]     = useState<RegionNodo[]>([]);

    // Filtros rápidos (barra junto al buscador)
    const [query,        setQuery]        = useState("");
    const [nivel,        setNivel]        = useState("");
    const [soloAbiertas, setSoloAbiertas] = useState(true);

    // Filtros de la barra lateral
    const [sectorActivo,      setSectorActivo]      = useState("");
    const [tipoConvocatoria,  setTipoConvocatoria]  = useState("");
    const [plazoCierre,       setPlazoCierre]        = useState("");
    const [presupuestoMin,    setPresupuestoMin]     = useState(0);
    const [tipoBeneficiario,  setTipoBeneficiario]  = useState("");
    const [selectedRegionId,  setSelectedRegionId]  = useState<number | null>(null);
    const [selectedProvinciaId, setSelectedProvinciaId] = useState<number | null>(null);
    const [sortBy,            setSortBy]             = useState("relevancia");
    const [sidebarVisible,    setSidebarVisible]     = useState(true);

    // Estado de resultados
    const [resultados, setResultados] = useState<BusquedaPublicaResponse | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [page,       setPage]       = useState(0);

    // Filtros aplicados (los que se han enviado al API)
    const [appliedQuery,   setAppliedQuery]   = useState("");
    const [appliedSector,  setAppliedSector]  = useState("");
    const [appliedAbierto, setAppliedAbierto] = useState(true);

    const buscar = useCallback((q: string, sec: string, tipo: string, abierto: boolean, p: number, regionId?: number | null) => {
        setLoading(true);
        const params = {
            q:        q    || undefined,
            sector:   sec  || undefined,
            tipo:     tipo || undefined,
            abierto:  abierto ? true : undefined,
            regionId: regionId ?? undefined,
            page:     p,
            size:     20,
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
        buscar("", "", "", true, 0);
        convocatoriasPublicasApi.finalidades()
            .then((res) => setFinalidades(res.data))
            .catch(() => {});
        convocatoriasPublicasApi.tipos()
            .then((res) => setTipos(res.data))
            .catch(() => {});
        convocatoriasPublicasApi.regiones()
            .then((res) => setRegiones(res.data))
            .catch(() => {});
    }, [buscar]);

    // Búsqueda desde la barra rápida (submit o cambio de filtro)
    function handleQuickSearch(e: FormEvent) {
        e.preventDefault();
        applyQuickFilters(query.trim(), sectorActivo, nivel, soloAbiertas);
    }

    function applyQuickFilters(q: string, sec: string, niv: string, abierto: boolean) {
        setAppliedQuery(q);
        setAppliedSector(sec);
        setAppliedAbierto(abierto);
        setPage(0);
        buscar(q, sec, niv, abierto, 0, selectedProvinciaId ?? selectedRegionId);
    }

    // Aplicar filtros desde la barra lateral
    function handleApplyFilters() {
        setAppliedSector(sectorActivo);
        setAppliedAbierto(soloAbiertas);
        setPage(0);
        buscar(appliedQuery, sectorActivo, nivel, soloAbiertas, 0, selectedProvinciaId ?? selectedRegionId);
    }

    // Limpiar todos los filtros
    function handleClearFilters() {
        setQuery(""); setNivel(""); setSoloAbiertas(true);
        setSectorActivo(""); setTipoConvocatoria(""); setPlazoCierre("");
        setPresupuestoMin(0); setTipoBeneficiario(""); setSelectedRegionId(null);
        setSelectedProvinciaId(null);
        setAppliedQuery(""); setAppliedSector(""); setAppliedAbierto(true);
        setPage(0);
        buscar("", "", "", true, 0, null);
    }

    function goToPage(p: number) {
        setPage(p);
        buscar(appliedQuery, appliedSector, nivel, appliedAbierto, p, selectedProvinciaId ?? selectedRegionId);
        document.getElementById("listado-section")?.scrollIntoView({ behavior: "smooth" });
    }

    // Encuentra el nodo CCAA en el árbol para obtener sus provincias
    function findCcaaNode(regionId: number | null): RegionNodo | null {
        if (!regionId) return null;
        for (const macroRegion of regiones) {
            for (const ccaa of macroRegion.children) {
                if (ccaa.id === regionId) return ccaa;
            }
        }
        return null;
    }

    const ccaaNode = findCcaaNode(selectedRegionId);
    const provincias = ccaaNode?.children ?? [];

    const displayList = resultados ? sortResults(resultados.content, sortBy) : [];

    return (
        <div className="flex flex-col">
            {modalAcceso && <ModalAccesoRequerido onClose={() => setModalAcceso(false)} />}

            {/* ── Hero + buscador ──────────────────────────────────────────── */}
            <section className="px-4 pt-16 pb-10 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
                        Descubre subvenciones{" "}
                        <span className="text-primary">para tu proyecto</span>
                    </h1>
                    <p className="text-lg text-foreground-muted mb-8 max-w-xl mx-auto leading-relaxed">
                        Busca entre miles de convocatorias públicas o explora por sector.
                        {!autenticado && " Crea una cuenta para acceder a recomendaciones personalizadas."}
                    </p>

                    {/* Barra de búsqueda principal */}
                    <form onSubmit={handleQuickSearch} className="relative max-w-2xl mx-auto mb-4">
                        <div className="flex items-center gap-0 bg-surface border-2 border-border rounded-2xl shadow-sm focus-within:border-primary transition-colors overflow-hidden">
                            <Search className="w-5 h-5 text-foreground-muted ml-4 shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Busca por sector, tipo de proyecto o nombre de convocatoria..."
                                className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-foreground-subtle outline-none text-sm"
                            />
                            <button
                                type="submit"
                                className="m-1.5 flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shrink-0"
                            >
                                Buscar
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Filtros rápidos junto al buscador */}
                    <div className="max-w-2xl mx-auto flex items-center gap-2">
                        {/* Nivel */}
                        <select
                            value={nivel}
                            onChange={(e) => { setNivel(e.target.value); applyQuickFilters(query.trim(), sectorActivo, e.target.value, soloAbiertas); }}
                            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground-muted focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">Todos los niveles</option>
                            {tipos.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>

                        {/* Sector */}
                        <select
                            value={sectorActivo}
                            onChange={(e) => { setSectorActivo(e.target.value); applyQuickFilters(query.trim(), e.target.value, nivel, soloAbiertas); }}
                            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground-muted focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">Explorar por sector</option>
                            {finalidades.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>

                        {/* Toggle abiertas/cerradas */}
                        <button
                            type="button"
                            onClick={() => { const next = !soloAbiertas; setSoloAbiertas(next); applyQuickFilters(query.trim(), sectorActivo, next); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                                soloAbiertas
                                    ? "border-primary bg-primary-light text-primary"
                                    : "border-border text-foreground-muted hover:border-primary/50"
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${soloAbiertas ? "bg-primary" : "bg-foreground-subtle"}`} />
                            {soloAbiertas ? "Solo abiertas" : "Incluir cerradas"}
                        </button>
                    </div>

                    {!autenticado && (
                        <p className="mt-4 text-sm text-foreground-subtle">
                            ¿Ya tienes cuenta?{" "}
                            <a href="/login" className="text-primary font-semibold hover:underline">
                                Inicia sesión
                            </a>{" "}
                            para ver recomendaciones personalizadas
                        </p>
                    )}
                </div>
            </section>

            {/* ── Listado con sidebar ──────────────────────────────────────── */}
            <section id="listado-section" className="px-4 pb-16">
                <div className="max-w-6xl mx-auto">
                    <div className={`flex flex-col gap-8 ${sidebarVisible ? "lg:flex-row" : ""}`}>

                        {/* Sidebar de filtros avanzados */}
                        <aside className={`flex-shrink-0 transition-all duration-300 ${sidebarVisible ? "w-full lg:w-72" : "w-full lg:w-auto"}`}>
                            <div className="bg-surface border border-border rounded-2xl sticky top-24 overflow-hidden">
                                {/* Cabecera siempre visible */}
                                <div className="flex items-center justify-between px-6 py-4">
                                    <button
                                        onClick={() => setSidebarVisible((v) => !v)}
                                        className="flex items-center gap-2 font-bold text-foreground text-base hover:text-primary transition-colors"
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-300 ${sidebarVisible ? "rotate-0" : "-rotate-90"}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                        Filtros Avanzados
                                    </button>
                                    {sidebarVisible && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="text-xs text-primary font-semibold hover:underline"
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>

                                {/* Contenido colapsable */}
                                {sidebarVisible && (
                                <div className="px-6 pb-6 border-t border-border pt-4">

                                <div className="space-y-7">
                                    {/* Tipo de convocatoria */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted block">
                                            Tipo de Convocatoria
                                        </label>
                                        <select
                                            value={tipoConvocatoria}
                                            onChange={(e) => setTipoConvocatoria(e.target.value)}
                                            className="w-full bg-surface-muted border border-border rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-primary transition-colors text-foreground"
                                        >
                                            <option value="">Todos los tipos</option>
                                            {TIPOS_CONVOCATORIA.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Plazo de cierre */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted block">
                                            Plazo de Cierre
                                        </label>
                                        <select
                                            value={plazoCierre}
                                            onChange={(e) => setPlazoCierre(e.target.value)}
                                            className="w-full bg-surface-muted border border-border rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-primary transition-colors text-foreground"
                                        >
                                            {PLAZOS_CIERRE.map((p) => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Presupuesto mínimo */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted block">
                                            Presupuesto Mínimo
                                            {presupuestoMin > 0 && (
                                                <span className="ml-2 text-primary normal-case tracking-normal">
                                                    {presupuestoMin >= 1_000_000
                                                        ? `${(presupuestoMin / 1_000_000).toFixed(1)}M€`
                                                        : presupuestoMin >= 1_000
                                                        ? `${Math.round(presupuestoMin / 1_000)}k€`
                                                        : `${presupuestoMin}€`}
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1000000}
                                            step={10000}
                                            value={presupuestoMin}
                                            onChange={(e) => setPresupuestoMin(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-full accent-[var(--color-primary)] bg-surface-muted"
                                        />
                                        <div className="flex justify-between">
                                            <span className="text-[10px] font-bold text-foreground-muted">0€</span>
                                            <span className="text-[10px] font-bold text-foreground-muted">1M€+</span>
                                        </div>
                                    </div>

                                    {/* Tipo de beneficiario (futuro) */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted block">
                                            Tipo de Beneficiario
                                        </label>
                                        <select
                                            value={tipoBeneficiario}
                                            onChange={(e) => setTipoBeneficiario(e.target.value)}
                                            className="w-full bg-surface-muted border border-border rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-primary transition-colors text-foreground"
                                        >
                                            <option value="">Todos</option>
                                            {TIPOS_BENEFICIARIO.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Región / Comunidad Autónoma */}
                                    {regiones.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted block">
                                                Comunidad Autónoma
                                            </label>
                                            <select
                                                value={selectedRegionId ?? ""}
                                                onChange={(e) => {
                                                    setSelectedRegionId(e.target.value ? Number(e.target.value) : null);
                                                    setSelectedProvinciaId(null);
                                                }}
                                                className="w-full bg-surface-muted border border-border rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-primary transition-colors text-foreground"
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

                                    {/* Provincia (aparece solo cuando hay CCAA seleccionada con provincias) */}
                                    {provincias.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted block">
                                                Provincia
                                            </label>
                                            <select
                                                value={selectedProvinciaId ?? ""}
                                                onChange={(e) => setSelectedProvinciaId(e.target.value ? Number(e.target.value) : null)}
                                                className="w-full bg-surface-muted border border-border rounded-xl text-sm py-2.5 px-3 focus:outline-none focus:border-primary transition-colors text-foreground"
                                            >
                                                <option value="">Toda la comunidad</option>
                                                {provincias.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {stripCodigo(p.descripcion)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                </div>

                                <button
                                    onClick={handleApplyFilters}
                                    className="mt-8 w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
                                >
                                    Aplicar Filtros
                                </button>
                                </div>
                                )}
                            </div>
                        </aside>

                        {/* Área de resultados */}
                        <div className="flex-1 space-y-5 min-w-0">

                            {/* Barra de resultados + ordenación */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border p-4 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    {loading ? (
                                        <div className="h-4 w-44 bg-surface-muted rounded-full animate-pulse" />
                                    ) : (
                                        <span className="text-sm text-foreground-muted">
                                            <strong className="text-foreground">
                                                {resultados?.totalElements.toLocaleString() ?? 0}
                                            </strong>{" "}
                                            subvenciones encontradas
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest">Ordenar por:</span>
                                    <div className="flex bg-surface-muted p-1 rounded-lg">
                                        {[
                                            { id: "relevancia", label: "Relevancia" },
                                            { id: "plazo",      label: "Plazo"      },
                                            { id: "cuantia",    label: "Cuantía"    },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSortBy(opt.id)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    sortBy === opt.id
                                                        ? "bg-white shadow-sm text-primary"
                                                        : "text-foreground-muted hover:text-foreground"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tarjetas */}
                            {loading ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="h-52 bg-surface border border-border rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : displayList.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {displayList.map((c) => (
                                        <ConvocatoriaCard
                                            key={c.id}
                                            convocatoria={c}
                                            autenticado={autenticado}
                                            showMatch={autenticado && c.matchScore != null}
                                            onAccesoRequerido={() => setModalAcceso(true)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <Search className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                                    <p className="font-medium text-foreground mb-2">No encontramos resultados</p>
                                    <p className="text-sm text-foreground-muted mb-6">
                                        Prueba con otros términos o elimina algunos filtros
                                    </p>
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sm text-primary hover:underline font-medium"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            )}

                            {/* Paginación */}
                            {resultados && resultados.totalPages > 1 && !loading && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <button
                                        onClick={() => goToPage(resultados.page - 1)}
                                        disabled={resultados.page === 0}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-foreground-muted hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: Math.min(resultados.totalPages, 7) }, (_, i) => {
                                        const total = resultados.totalPages;
                                        const cur   = resultados.page;
                                        let p: number;
                                        if      (total <= 7)       p = i;
                                        else if (cur   <= 3)       p = i;
                                        else if (cur   >= total-4) p = total - 7 + i;
                                        else                        p = cur - 3 + i;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => goToPage(p)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                                                    p === cur
                                                        ? "bg-primary text-white"
                                                        : "bg-surface border border-border text-foreground-muted hover:bg-surface-muted"
                                                }`}
                                            >
                                                {p + 1}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => goToPage(resultados.page + 1)}
                                        disabled={resultados.page >= resultados.totalPages - 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-foreground-muted hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA para no autenticados ─────────────────────────────────── */}
            {!autenticado && (
                <section className="px-4 pb-16">
                    <div className="max-w-3xl mx-auto bg-primary-light border border-primary/20 rounded-3xl p-10 text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-3">
                            Obtén recomendaciones personalizadas
                        </h2>
                        <p className="text-foreground-muted mb-6 text-sm leading-relaxed max-w-lg mx-auto">
                            Crea tu cuenta gratis y completa tu perfil para que nuestra IA encuentre las
                            subvenciones más relevantes para ti y tus proyectos.
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <a
                                href="/registro"
                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                Crear cuenta gratis
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <a
                                href="/login"
                                className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:bg-surface-muted transition-colors"
                            >
                                Iniciar sesión
                            </a>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}