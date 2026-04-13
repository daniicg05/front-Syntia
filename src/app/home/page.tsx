"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { ModalAccesoRequerido } from "@/components/ModalAccesoRequerido";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import { convocatoriasPublicasApi, ConvocatoriaPublica } from "@/lib/api";

const SECTORES = [
    { id: "tecnologia", label: "Tecnología e Innovación", icon: "💻", color: "bg-blue-50 border-blue-100 hover:border-blue-300 text-blue-700", iconBg: "bg-blue-100" },
    { id: "agricola", label: "Sector Agrícola", icon: "🌾", color: "bg-green-50 border-green-100 hover:border-green-300 text-green-700", iconBg: "bg-green-100" },
    { id: "industrial", label: "Sector Industrial", icon: "🏭", color: "bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-700", iconBg: "bg-amber-100" },
    { id: "hosteleria", label: "Hostelería y Turismo", icon: "🏨", color: "bg-orange-50 border-orange-100 hover:border-orange-300 text-orange-700", iconBg: "bg-orange-100" },
    { id: "social", label: "Social y Cultural", icon: "🤝", color: "bg-purple-50 border-purple-100 hover:border-purple-300 text-purple-700", iconBg: "bg-purple-100" },
    { id: "medioambiente", label: "Medio Ambiente", icon: "🌿", color: "bg-emerald-50 border-emerald-100 hover:border-emerald-300 text-emerald-700", iconBg: "bg-emerald-100" },
    { id: "comercio", label: "Comercio y Pymes", icon: "🛒", color: "bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-700", iconBg: "bg-rose-100" },
    { id: "salud", label: "Salud e Investigación", icon: "🔬", color: "bg-cyan-50 border-cyan-100 hover:border-cyan-300 text-cyan-700", iconBg: "bg-cyan-100" },
];

export default function HomePage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [modalAcceso, setModalAcceso] = useState(false);
    const [destacadas, setDestacadas] = useState<ConvocatoriaPublica[]>([]);
    const [loadingDestacadas, setLoadingDestacadas] = useState(true);
    const autenticado = isAuthenticated();

    useEffect(() => {
        convocatoriasPublicasApi.destacadas()
            .then((res) => setDestacadas(res.data))
            .catch(() => {})
            .finally(() => setLoadingDestacadas(false));
    }, []);

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        router.push(`/buscar?q=${encodeURIComponent(q)}`);
    }

    function handleSectorClick(sectorId: string) {
        router.push(`/buscar?sector=${sectorId}`);
    }

    // Phase 3: llamar setModalAcceso(true) cuando el usuario no-auth pulse sobre una convocatoria

    return (
        <div className="flex flex-col">
            {modalAcceso && (
                <ModalAccesoRequerido onClose={() => setModalAcceso(false)} />
            )}

            {/* Hero con buscador */}
            <section className="px-4 pt-16 pb-12 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
                        Descubre subvenciones{" "}
                        <span className="text-primary">para tu proyecto</span>
                    </h1>
                    <p className="text-lg text-foreground-muted mb-10 max-w-xl mx-auto leading-relaxed">
                        Busca entre miles de convocatorias públicas o explora por sector.
                        {!autenticado && " Crea una cuenta para acceder a recomendaciones personalizadas."}
                    </p>

                    {/* Barra de búsqueda */}
                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
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

            {/* Bloques por sector */}
            <section className="px-4 pb-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-semibold text-foreground mb-1">Explorar por sector</h2>
                        <p className="text-sm text-foreground-muted">
                            Selecciona un sector para ver convocatorias relacionadas
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {SECTORES.map((sector) => (
                            <button
                                key={sector.id}
                                onClick={() => handleSectorClick(sector.id)}
                                className={`group flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${sector.color}`}
                            >
                                <span className={`text-xl mb-2 w-9 h-9 flex items-center justify-center rounded-xl ${sector.iconBg}`}>
                                    {sector.icon}
                                </span>
                                <p className="font-semibold text-xs">{sector.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Convocatorias destacadas */}
            <section className="px-4 pb-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">
                                {autenticado ? "Convocatorias recientes" : "Convocatorias disponibles"}
                            </h2>
                        </div>
                        <button
                            onClick={() => router.push("/buscar")}
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            Ver todas →
                        </button>
                    </div>

                    {loadingDestacadas ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-52 bg-surface border border-border rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : destacadas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {destacadas.map((c) => (
                                <ConvocatoriaCard
                                    key={c.id}
                                    convocatoria={c}
                                    autenticado={autenticado}
                                    onAccesoRequerido={() => setModalAcceso(true)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-foreground-muted">
                            <p className="text-sm">No hay convocatorias disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA para no autenticados */}
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
