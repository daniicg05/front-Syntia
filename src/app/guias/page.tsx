"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Search, X } from "lucide-react";

interface Guia {
  id: number;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  imagen: string;
  duracion?: string;
  pasos?: number;
  contenido?: string;
}

const GUIAS: Guia[] = [
  {
    id: 1,
    slug: "innovacion-tecnologica",
    titulo: "Subvenciones para Innovación Tecnológica",
    descripcion:
      "Descubre cómo acceder a las principales convocatorias de I+D+i y financiación para proyectos de innovación tecnológica en España.",
    categoria: "Tecnología",
    imagen: "/guides/guia-innovacion.jpg",
    duracion: "10 min",
    pasos: 7,
    contenido:
      "Esta guía te explica paso a paso cómo identificar, preparar y presentar una solicitud de subvención para proyectos de innovación tecnológica. Incluye los principales programas del CDTI, Horizonte Europa y convocatorias autonómicas.",
  },
  {
    id: 2,
    slug: "pymes-financiacion",
    titulo: "Financiación Pública para PYMEs",
    descripcion:
      "Todo lo que necesita tu empresa para acceder a ayudas específicas para pequeñas y medianas empresas, desde el ICO hasta el Fondo Europeo de Desarrollo Regional.",
    categoria: "PYMEs",
    imagen: "/guides/guia-pyme.jpg",
    duracion: "8 min",
    pasos: 6,
    contenido:
      "Las PYMEs tienen acceso a un amplio catálogo de ayudas públicas. En esta guía te mostramos cómo navegar el ecosistema de financiación pública, desde los préstamos ICO hasta las subvenciones directas del FEDER.",
  },
  {
    id: 3,
    slug: "sostenibilidad-medio-ambiente",
    titulo: "Guía de Subvenciones para Sostenibilidad",
    descripcion:
      "Aprende a solicitar subvenciones para proyectos de energía renovable, eficiencia energética y economía circular a nivel nacional y europeo.",
    categoria: "Sostenibilidad",
    imagen: "/guides/guia-sostenibilidad.jpg",
    duracion: "12 min",
    pasos: 8,
    contenido:
      "España cuenta con numerosas convocatorias para proyectos de transición energética y sostenibilidad medioambiental. Esta guía cubre el programa MOVES, ayudas del IDAE y los fondos Next Generation EU para la transformación verde.",
  },
  {
    id: 4,
    slug: "digitalizacion-empresas",
    titulo: "Kit Digital y Digitalización Empresarial",
    descripcion:
      "Cómo acceder al programa Kit Digital y otras ayudas para la transformación digital de tu empresa, desde la solicitud hasta la justificación.",
    categoria: "Digitalización",
    imagen: "/guides/guia-digitalizacion.jpg",
    duracion: "6 min",
    pasos: 5,
    contenido:
      "El programa Kit Digital ofrece bonos digitales de hasta 29.000 euros para digitalizar tu empresa. En esta guía te explicamos los requisitos, agentes digitalizadores disponibles y el proceso completo de solicitud.",
  },
  {
    id: 5,
    slug: "investigacion-desarrollo",
    titulo: "Proyectos de I+D: Guía Completa",
    descripcion:
      "Manual detallado para presentar proyectos de investigación y desarrollo, incluyendo deducciones fiscales, subvenciones del CDTI y programas europeos.",
    categoria: "I+D+i",
    imagen: "/guides/guia-idi.jpg",
    duracion: "15 min",
    pasos: 10,
    contenido:
      "Los proyectos de I+D tienen acceso a las ayudas más cuantiosas del sistema español de innovación. Esta guía abarca desde las deducciones fiscales del artículo 35 del IS hasta los proyectos del CDTI y Horizonte Europa.",
  },
  {
    id: 6,
    slug: "emprendimiento-startups",
    titulo: "Subvenciones para Startups y Emprendedores",
    descripcion:
      "Descubre las ayudas específicas para empresas de nueva creación: préstamos participativos, subvenciones a la creación de empleo y programas de aceleración.",
    categoria: "Emprendimiento",
    imagen: "/guides/guia-emprendimiento.jpg",
    duracion: "9 min",
    pasos: 6,
    contenido:
      "Empezar una empresa en España tiene más apoyo que nunca. Esta guía te detalla los principales programas de apoyo al emprendimiento, desde ENISA hasta los fondos autonómicos, pasando por los programas de internacionalización del ICEX.",
  },
];

const CATEGORIAS = ["Todas", ...Array.from(new Set(GUIAS.map((g) => g.categoria)))];

export default function GuiasPage() {
  const [categoria, setCategoria] = useState("Todas");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Guia | null>(null);

  const filtered = GUIAS.filter(
    (g) =>
      (categoria === "Todas" || g.categoria === categoria) &&
      (search === "" ||
        g.titulo.toLowerCase().includes(search.toLowerCase()) ||
        g.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Guías de subvenciones</h1>
        <p className="text-foreground-muted mt-1">
          Aprende cómo solicitar las principales subvenciones públicas paso a paso
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar guía..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categoria === cat
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-foreground-muted">
          No se encontraron guías con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((guia) => (
            <article
              key={guia.id}
              className="group bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
              onClick={() => setModal(guia)}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-surface-muted">
                <Image
                  src={guia.imagen}
                  alt={guia.titulo}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-block text-xs font-semibold bg-primary text-white px-2.5 py-1 rounded-full">
                    {guia.categoria}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-foreground mb-2 leading-snug line-clamp-2 text-balance">
                  {guia.titulo}
                </h3>
                <p className="text-sm text-foreground-muted leading-relaxed line-clamp-3 mb-4">
                  {guia.descripcion}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-foreground-subtle">
                    {guia.duracion && <span>{guia.duracion} de lectura</span>}
                    {guia.pasos && <span>{guia.pasos} pasos</span>}
                  </div>
                  <button
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    aria-label={`Ver guía: ${guia.titulo}`}
                  >
                    Ver guía
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48">
              <Image
                src={modal.imagen}
                alt={modal.titulo}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
              />
              <button
                onClick={() => setModal(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-surface/90 rounded-full flex items-center justify-center hover:bg-surface transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute top-3 left-3 text-xs font-semibold bg-primary text-white px-2.5 py-1 rounded-full">
                {modal.categoria}
              </span>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">{modal.titulo}</h2>
              <div className="flex items-center gap-3 text-xs text-foreground-subtle mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                {modal.duracion && <span>{modal.duracion} de lectura</span>}
                {modal.pasos && <span>· {modal.pasos} pasos</span>}
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed mb-5">
                {modal.contenido}
              </p>
              <button
                onClick={() => setModal(null)}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-hover transition-colors"
              >
                Próximamente disponible
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
