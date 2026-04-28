"use client";

import { useState, FormEvent, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, SlidersHorizontal, ChevronLeft, ChevronRight, X, ChevronDown, MapPin, Globe } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { convocatoriasPublicasApi, convocatoriasUsuarioApi, ConvocatoriaPublica, BusquedaPublicaResponse, RegionNodo } from "@/lib/api";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { ModalAccesoRequerido } from "@/components/ModalAccesoRequerido";
import { easeDecelerate, easeAccelerate } from "@/lib/motion";

type RegionOption = { id: number | null; label: string; groupLabel?: string };

const stripCodigo = (d: string) => d.replace(/^[A-Z0-9]+ - /, "").trim();

const SECTORES_FILTRO = [
    { value: "",             label: "Todos",            icon: "🔍" },
    { value: "tecnologia",   label: "Tecnología",       icon: "💻" },
    { value: "agricola",     label: "Agrícola",         icon: "🌾" },
    { value: "industrial",   label: "Industrial",       icon: "🏭" },
    { value: "hosteleria",   label: "Hostelería",       icon: "🏨" },
    { value: "social",       label: "Social",           icon: "🤝" },
    { value: "medioambiente",label: "Medioambiente",    icon: "🌿" },
    { value: "comercio",     label: "Comercio",         icon: "🛒" },
    { value: "salud",        label: "Salud",            icon: "🏥" },
    { value: "educacion",    label: "Educación",        icon: "📚" },
];

const panelVariants = {
    hidden:  { opacity: 0, y: -8, scale: 0.98 },
    visible: { opacity: 1, y: 0,  scale: 1,    transition: easeDecelerate },
    exit:    { opacity: 0, y: -6, scale: 0.99, transition: easeAccelerate },
};

const dropdownVariants = {
    hidden:  { opacity: 0, y: -6, scale: 0.98 },
    visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.18, ease: [0.0, 0.0, 0.2, 1.0] } },
    exit:    { opacity: 0, y: -4,              transition: { duration: 0.12, ease: [0.4, 0.0, 1.0, 1.0] } },
};

// ── RegionSelect ───────────────────────────────────────────────────────────────

function RegionSelect({ regiones, value, onChange }: {
    regiones: RegionNodo[];
    value: number | null;
    onChange: (value: string) => void;
}) {
    const [open, setOpen]         = useState(false);
    const [search, setSearch]     = useState("");
    const [focusedIdx, setFocusedIdx] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef     = useRef<HTMLInputElement>(null);
    const listRef      = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, []);

    // Auto-foco y reset al abrir
    useEffect(() => {
        if (open) {
            setSearch("");
            setFocusedIdx(-1);
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    // Lista plana de todas las opciones (para teclado y búsqueda)
    const allOptions = useMemo<RegionOption[]>(() => [
        { id: null, label: "Toda España" },
        ...regiones.flatMap((macro) =>
            macro.children.map((ccaa) => ({
                id: ccaa.id,
                label: stripCodigo(ccaa.descripcion),
                groupLabel: stripCodigo(macro.descripcion),
            }))
        ),
    ], [regiones]);

    const filtered = useMemo<RegionOption[]>(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allOptions;
        return allOptions.filter(
            (o) =>
                o.label.toLowerCase().includes(q) ||
                o.groupLabel?.toLowerCase().includes(q)
        );
    }, [search, allOptions]);

    const isSearching = search.trim().length > 0;

    const currentLabel = useMemo(
        () => allOptions.find((o) => o.id === value)?.label ?? null,
        [allOptions, value]
    );

    function select(id: number | null) {
        onChange(id == null ? "" : String(id));
        setOpen(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Escape") { setOpen(false); return; }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && focusedIdx >= 0 && filtered[focusedIdx]) {
            e.preventDefault();
            select(filtered[focusedIdx].id);
        }
    }

    // Scroll al elemento enfocado
    useEffect(() => {
        if (focusedIdx >= 0 && listRef.current) {
            const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${focusedIdx}"]`);
            el?.scrollIntoView({ block: "nearest" });
        }
    }, [focusedIdx]);

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center gap-2 bg-surface border rounded-xl text-sm py-2.5 px-3 transition-all duration-150 ${
                    open
                        ? "border-primary ring-2 ring-primary/15"
                        : "border-border hover:border-primary/40 hover:bg-surface-muted/40"
                }`}
            >
                {currentLabel
                    ? <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    : <Globe className="w-3.5 h-3.5 text-foreground-subtle shrink-0" />
                }
                <span className={`flex-1 text-left truncate ${currentLabel ? "text-foreground font-medium" : "text-foreground-subtle"}`}>
                    {currentLabel ?? "Toda España"}
                </span>
                <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-xl z-50 origin-top flex flex-col"
                        style={{ maxHeight: "288px" }}
                    >
                        {/* Buscador interno */}
                        <div className="p-2 border-b border-border/60 shrink-0">
                            <div className="flex items-center gap-2 bg-surface-muted rounded-lg px-2.5 py-1.5">
                                <Search className="w-3.5 h-3.5 text-foreground-subtle shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setFocusedIdx(0); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Buscar comunidad..."
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle outline-none min-w-0"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearch(""); setFocusedIdx(-1); inputRef.current?.focus(); }}
                                        className="text-foreground-muted hover:text-foreground transition-colors shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lista */}
                        <div ref={listRef} className="overflow-y-auto flex-1 py-1">
                            {filtered.length === 0 ? (
                                <p className="px-3 py-6 text-sm text-center text-foreground-subtle">
                                    Sin resultados para &ldquo;{search}&rdquo;
                                </p>
                            ) : isSearching ? (
                                // Lista plana cuando se busca
                                filtered.map((opt, idx) => {
                                    const isActive = value === opt.id;
                                    const isFocused = focusedIdx === idx;
                                    return (
                                        <button
                                            key={opt.id ?? "all"}
                                            data-idx={idx}
                                            type="button"
                                            onClick={() => select(opt.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                                isFocused
                                                    ? "bg-surface-muted"
                                                    : isActive
                                                    ? "bg-primary-light text-primary"
                                                    : "text-foreground hover:bg-surface-muted"
                                            } ${isActive ? "font-medium" : ""}`}
                                        >
                                            {opt.id == null
                                                ? <Globe className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                                : <MapPin className="w-3 h-3 shrink-0 opacity-40" />
                                            }
                                            <span className="flex-1 text-left">{opt.label}</span>
                                            {opt.groupLabel && (
                                                <span className="text-[10px] text-foreground-subtle shrink-0">
                                                    {opt.groupLabel}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                // Lista agrupada cuando no se busca
                                <>
                                    {(() => {
                                        const opt = filtered[0]; // "Toda España"
                                        const isFocused = focusedIdx === 0;
                                        const isActive = value == null;
                                        return (
                                            <button
                                                data-idx={0}
                                                type="button"
                                                onClick={() => select(null)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                                                    isFocused
                                                        ? "bg-surface-muted"
                                                        : isActive
                                                        ? "bg-primary-light text-primary font-medium"
                                                        : "text-foreground hover:bg-surface-muted"
                                                }`}
                                            >
                                                <Globe className="w-3.5 h-3.5 shrink-0" />
                                                {opt.label}
                                            </button>
                                        );
                                    })()}
                                    <div className="border-t border-border/40 mx-2 my-1" />
                                    {regiones.map((macro) => (
                                        <div key={macro.id}>
                                            <p className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                                                {stripCodigo(macro.descripcion)}
                                            </p>
                                            {macro.children.map((ccaa) => {
                                                const idx = allOptions.findIndex((o) => o.id === ccaa.id);
                                                const isActive = value === ccaa.id;
                                                const isFocused = focusedIdx === idx;
                                                return (
                                                    <button
                                                        key={ccaa.id}
                                                        data-idx={idx}
                                                        type="button"
                                                        onClick={() => select(ccaa.id)}
                                                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                                                            isFocused
                                                                ? "bg-surface-muted"
                                                                : isActive
                                                                ? "bg-primary-light text-primary font-medium"
                                                                : "text-foreground hover:bg-surface-muted"
                                                        }`}
                                                    >
                                                        <MapPin className="w-3 h-3 shrink-0 opacity-40" />
                                                        {stripCodigo(ccaa.descripcion)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── BuscarContent ─────────────────────────────────────────────────────────────

export default function BuscarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const qParam        = searchParams.get("q") ?? "";
    const sectorParam   = searchParams.get("sector") ?? "";
    const pageParam     = parseInt(searchParams.get("page") ?? "0", 10);
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
    const autenticado = isAuthenticated();

    const hayFiltrosActivos = !!(sector || !soloAbiertas || selectedRegionId);

    const buscar = useCallback((q: string, sec: string, page: number, abiertas: boolean, regionId?: number | null) => {
        setLoading(true);
        const params = {
            q:        q   || undefined,
            sector:   sec || undefined,
            abierto:  abiertas ? true : undefined,
            regionId: regionId ?? undefined,
            page,
            size: 20,
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

    function buildParams(q: string, sec: string, page: number, abiertas: boolean, regionId?: number | null) {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (sec) params.set("sector", sec);
        if (page) params.set("page", String(page));
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

    // Label de región activa para el chip
    const regionLabel = selectedRegionId
        ? (() => {
            for (const macro of regiones) {
                for (const ccaa of macro.children) {
                    if (ccaa.id === selectedRegionId) return stripCodigo(ccaa.descripcion);
                }
            }
            return null;
        })()
        : null;

    const sectorLabel = sector
        ? SECTORES_FILTRO.find((s) => s.value === sector)
        : null;

    const tieneResultados = resultados && resultados.content.length > 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {modalAcceso && (
                <ModalAccesoRequerido onClose={() => setModalAcceso(false)} />
            )}

            {/* Barra de búsqueda */}
            <div className="mb-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex-1 flex items-center gap-0 bg-surface border-2 border-border rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors overflow-hidden">
                        <Search className="w-4 h-4 text-foreground-muted ml-3 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Busca convocatorias por nombre, sector, organismo..."
                            className="flex-1 px-3 py-3 bg-transparent text-foreground placeholder:text-foreground-subtle outline-none focus:outline-none focus-visible:outline-none caret-transparent text-sm"
                            style={{ outline: 'none', boxShadow: 'none', caretColor: 'transparent', WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
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
                        className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                            showFiltros || hayFiltrosActivos
                                ? "border-primary bg-primary-light text-primary shadow-sm"
                                : "border-border text-foreground-muted hover:bg-surface-muted hover:border-border"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {hayFiltrosActivos && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                {[sector, !soloAbiertas, selectedRegionId].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </form>

                {/* Chips de filtros activos */}
                <AnimatePresence>
                    {hayFiltrosActivos && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 pt-3">
                                {sectorLabel && (
                                    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full border border-primary/20">
                                        <span>{sectorLabel.icon}</span>
                                        {sectorLabel.label}
                                        <button
                                            type="button"
                                            onClick={() => handleSectorChange("")}
                                            className="ml-0.5 hover:bg-primary/10 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {regionLabel && (
                                    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full border border-primary/20">
                                        <MapPin className="w-3 h-3" />
                                        {regionLabel}
                                        <button
                                            type="button"
                                            onClick={() => handleRegionChange("")}
                                            className="ml-0.5 hover:bg-primary/10 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {!soloAbiertas && (
                                    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                                        Incluye cerradas
                                        <button
                                            type="button"
                                            onClick={handleToggleAbiertas}
                                            className="ml-0.5 hover:bg-amber-100 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => router.push("/buscar")}
                                    className="text-xs text-foreground-subtle hover:text-foreground underline underline-offset-2 transition-colors"
                                >
                                    Limpiar todo
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Panel de filtros avanzados */}
                <AnimatePresence>
                    {showFiltros && (
                        <motion.div
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="mt-3 bg-surface border border-border rounded-2xl overflow-hidden shadow-sm origin-top"
                        >
                            {/* Sector */}
                            <div className="p-5 border-b border-border/60">
                                <p className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-3">
                                    Sector
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {SECTORES_FILTRO.map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => handleSectorChange(s.value)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 ${
                                                sector === s.value
                                                    ? "border-primary bg-primary text-white shadow-sm"
                                                    : "border-border text-foreground-muted bg-surface hover:border-primary/40 hover:text-foreground hover:bg-surface-muted"
                                            }`}
                                        >
                                            <span>{s.icon}</span>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Región */}
                            {regiones.length > 0 && (
                                <div className="p-5 border-b border-border/60">
                                    <p className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-3">
                                        Comunidad autónoma
                                    </p>
                                    <RegionSelect
                                        regiones={regiones}
                                        value={selectedRegionId}
                                        onChange={handleRegionChange}
                                    />
                                </div>
                            )}

                            {/* Toggle cerradas */}
                            <div className="px-5 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Incluir convocatorias cerradas
                                    </p>
                                    <p className="text-xs text-foreground-subtle mt-0.5">
                                        Por defecto solo se muestran las abiertas
                                    </p>
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
                        </motion.div>
                    )}
                </AnimatePresence>
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
