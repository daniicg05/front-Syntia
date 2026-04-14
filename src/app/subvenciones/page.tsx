"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Euro,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

type Subsidy = {
  id: number;
  title: string;
  description: string;
  amount: number;
  location: string;
  deadline: string;
  sector: string;
  type: string;
  status: "abierta" | "cerrada";
  companyType: "micro" | "pyme" | "gran_empresa";
};

const subsidies: Subsidy[] = [
  {
    id: 1,
    title: "Digitaliza tu pyme 2026",
    description: "Financiacion para implantacion de soluciones cloud, ciberseguridad y automatizacion.",
    amount: 50000,
    location: "Madrid",
    deadline: "2026-06-01",
    sector: "Tecnologia",
    type: "Subvencion directa",
    status: "abierta",
    companyType: "pyme",
  },
  {
    id: 2,
    title: "Impulso industria verde",
    description: "Ayudas para reducir consumo energetico y emisiones en procesos industriales.",
    amount: 120000,
    location: "Cataluna",
    deadline: "2026-07-10",
    sector: "Industria",
    type: "Linea competitiva",
    status: "abierta",
    companyType: "gran_empresa",
  },
  {
    id: 3,
    title: "Comercio local conectado",
    description: "Programa para modernizacion de comercios y canales de venta digital.",
    amount: 30000,
    location: "Comunidad Valenciana",
    deadline: "2026-05-28",
    sector: "Comercio",
    type: "Bono",
    status: "abierta",
    companyType: "micro",
  },
  {
    id: 4,
    title: "Turismo inteligente sostenible",
    description: "Apoyo a destinos y empresas turisticas con foco en eficiencia y datos.",
    amount: 85000,
    location: "Andalucia",
    deadline: "2026-08-12",
    sector: "Turismo",
    type: "Subvencion directa",
    status: "cerrada",
    companyType: "pyme",
  },
  {
    id: 5,
    title: "Agro innovacion y riego eficiente",
    description: "Financiacion para tecnificacion de explotaciones agrarias y ahorro de agua.",
    amount: 64000,
    location: "Castilla-La Mancha",
    deadline: "2026-09-02",
    sector: "Agro",
    type: "Linea competitiva",
    status: "abierta",
    companyType: "pyme",
  },
  {
    id: 6,
    title: "I+D aplicada en salud",
    description: "Subvenciones para proyectos de investigacion clinica y validacion tecnologica.",
    amount: 200000,
    location: "Pais Vasco",
    deadline: "2026-10-18",
    sector: "Salud",
    type: "Subvencion directa",
    status: "abierta",
    companyType: "gran_empresa",
  },
  {
    id: 7,
    title: "Economia circular para pymes",
    description: "Ayudas para rediseño de procesos, reutilizacion de materiales y trazabilidad.",
    amount: 45000,
    location: "Galicia",
    deadline: "2026-06-20",
    sector: "Medio ambiente",
    type: "Bono",
    status: "cerrada",
    companyType: "pyme",
  },
  {
    id: 8,
    title: "Escalado internacional de startups",
    description: "Programa de apoyo a expansion comercial y apertura de mercados internacionales.",
    amount: 95000,
    location: "Navarra",
    deadline: "2026-11-05",
    sector: "Tecnologia",
    type: "Linea competitiva",
    status: "abierta",
    companyType: "micro",
  },
];

const stats = [
  { label: "Subvenciones", value: "2.431" },
  { label: "Presupuesto total", value: "2.4B EUR" },
  { label: "Activas", value: "1.287" },
  { label: "Nuevas esta semana", value: "94" },
];

const sectors = ["Todos", "Tecnologia", "Industria", "Comercio", "Turismo", "Agro", "Salud", "Medio ambiente"];
const regions = ["Todas", "Madrid", "Cataluna", "Comunidad Valenciana", "Andalucia", "Galicia", "Navarra", "Pais Vasco"];
const aidTypes = ["Todos", "Subvencion directa", "Linea competitiva", "Bono"];

function formatEuros(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.20),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.22),transparent_35%),linear-gradient(120deg,#ffffff_0%,#eef2ff_45%,#f5f3ff_100%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 backdrop-blur px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles className="w-3.5 h-3.5" />
          Busqueda inteligente de ayudas
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight max-w-4xl">
          Encuentra subvenciones para tu empresa
        </h1>
        <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-2xl">
          Descubre oportunidades publicas con una experiencia clara y centrada en convertir cada resultado
          en accion.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="flex-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 h-12 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              placeholder="Ej. digitalizacion pyme, eficiencia energetica..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>
          <button className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] inline-flex items-center justify-center gap-2">
            Buscar subvenciones
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="border-b border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

type FiltersBarProps = {
  search: string;
  onSearch: (value: string) => void;
  sector: string;
  onSector: (value: string) => void;
  region: string;
  onRegion: (value: string) => void;
  aidType: string;
  onAidType: (value: string) => void;
};

function FiltersBar({
  search,
  onSearch,
  sector,
  onSector,
  region,
  onRegion,
  aidType,
  onAidType,
}: FiltersBarProps) {
  return (
    <section className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 h-11 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por palabra clave..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <select
          value={sector}
          onChange={(e) => onSector(e.target.value)}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 h-11 bg-white text-sm text-slate-700 outline-none"
        >
          {sectors.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select
          value={region}
          onChange={(e) => onRegion(e.target.value)}
          className="md:col-span-3 rounded-xl border border-slate-200 px-3 h-11 bg-white text-sm text-slate-700 outline-none"
        >
          {regions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select
          value={aidType}
          onChange={(e) => onAidType(e.target.value)}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 h-11 bg-white text-sm text-slate-700 outline-none"
        >
          {aidTypes.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    </section>
  );
}

function SubsidyCard({ item }: { item: Subsidy }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {item.sector}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            item.status === "abierta" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {item.status}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-900 leading-snug">{item.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{item.description}</p>

      <div className="mt-4 flex items-center gap-2 text-blue-700 font-bold text-xl">
        <Euro className="w-5 h-5" />
        {formatEuros(item.amount)}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        <p className="inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {item.location}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {item.deadline}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-indigo-50 text-indigo-700">
          {item.type}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-violet-50 text-violet-700">
          {item.companyType.replace("_", " ")}
        </span>
      </div>

      <button className="mt-5 w-full h-10 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-2">
        Ver mas
        <ArrowRight className="w-4 h-4" />
      </button>
    </article>
  );
}

function SubsidyList({ items, isLoading }: { items: Subsidy[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={`skeleton-${i}`} className="h-56 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-900 font-semibold">No hay resultados con esos filtros</p>
        <p className="mt-2 text-sm text-slate-500">Prueba con otro sector, ubicacion o tipo de ayuda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <SubsidyCard key={item.id} item={item} />
      ))}
    </div>
  );
}

type SidebarFiltersProps = {
  selectedSectors: string[];
  toggleSector: (value: string) => void;
  selectedCompanyTypes: string[];
  toggleCompanyType: (value: string) => void;
  selectedStatuses: string[];
  toggleStatus: (value: string) => void;
  amount: number;
  onAmount: (value: number) => void;
};

function SidebarFilters({
  selectedSectors,
  toggleSector,
  selectedCompanyTypes,
  toggleCompanyType,
  selectedStatuses,
  toggleStatus,
  amount,
  onAmount,
}: SidebarFiltersProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24">
      <h3 className="text-sm font-semibold text-slate-900 inline-flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Filtros avanzados
      </h3>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sector</p>
          <div className="mt-2 space-y-2">
            {sectors.filter((s) => s !== "Todos").map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedSectors.includes(option)}
                  onChange={() => toggleSector(option)}
                  className="rounded border-slate-300"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo de empresa</p>
          <div className="mt-2 space-y-2">
            {["micro", "pyme", "gran_empresa"].map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedCompanyTypes.includes(option)}
                  onChange={() => toggleCompanyType(option)}
                  className="rounded border-slate-300"
                />
                {option.replace("_", " ")}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</p>
          <div className="mt-2 space-y-2">
            {["abierta", "cerrada"].map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(option)}
                  onChange={() => toggleStatus(option)}
                  className="rounded border-slate-300"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Importe maximo</p>
          <input
            type="range"
            min={10000}
            max={250000}
            step={5000}
            value={amount}
            onChange={(e) => onAmount(Number(e.target.value))}
            className="mt-3 w-full accent-violet-600"
          />
          <p className="mt-2 text-sm font-medium text-slate-700">Hasta {formatEuros(amount)}</p>
        </div>
      </div>
    </aside>
  );
}

function Pagination() {
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginacion de subvenciones">
      {["1", "2", "3", "4", "5"].map((page) => (
        <button
          key={page}
          className={`w-10 h-10 rounded-xl border text-sm font-semibold transition-colors ${
            page === "1"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}
    </nav>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Define tus criterios",
      description: "Selecciona sector, comunidad y tipo de ayuda en segundos.",
      icon: SlidersHorizontal,
    },
    {
      title: "Compara oportunidades",
      description: "Revisa importes, plazos y requisitos con tarjetas claras y accionables.",
      icon: Building2,
    },
    {
      title: "Pasa a la accion",
      description: "Prioriza las mejores opciones y empieza tu proceso de solicitud.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="mt-16 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f5f3ff_45%,#ffffff_100%)] p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Como funciona</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white">
              <step.icon className="w-5 h-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">Paso {index + 1}</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SubvencionesPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("Todos");
  const [region, setRegion] = useState("Todas");
  const [aidType, setAidType] = useState("Todos");

  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [maxAmount, setMaxAmount] = useState(250000);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const isLoading = false;

  const toggleValue = (list: string[], value: string, setter: (value: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const filteredSubsidies = useMemo(() => {
    return subsidies.filter((item) => {
      const matchesSearch =
        search.trim().length === 0 ||
        `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase());
      const matchesSector = sector === "Todos" || item.sector === sector;
      const matchesRegion = region === "Todas" || item.location === region;
      const matchesType = aidType === "Todos" || item.type === aidType;

      const matchesSidebarSector = selectedSectors.length === 0 || selectedSectors.includes(item.sector);
      const matchesCompany = selectedCompanyTypes.length === 0 || selectedCompanyTypes.includes(item.companyType);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      const matchesAmount = item.amount <= maxAmount;

      return (
        matchesSearch &&
        matchesSector &&
        matchesRegion &&
        matchesType &&
        matchesSidebarSector &&
        matchesCompany &&
        matchesStatus &&
        matchesAmount
      );
    });
  }, [aidType, maxAmount, region, search, sector, selectedCompanyTypes, selectedSectors, selectedStatuses]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_35%)]">
      <HeroSection />
      <StatsSection />
      <FiltersBar
        search={search}
        onSearch={setSearch}
        sector={sector}
        onSector={setSector}
        region={region}
        onRegion={setRegion}
        aidType={aidType}
        onAidType={setAidType}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setShowMobileSidebar((prev) => !prev)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            <Filter className="w-4 h-4" />
            {showMobileSidebar ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <SubsidyList items={filteredSubsidies} isLoading={isLoading} />
            <Pagination />
          </div>

          <div className={`lg:col-span-4 ${showMobileSidebar ? "block" : "hidden"} lg:block`}>
            <SidebarFilters
              selectedSectors={selectedSectors}
              toggleSector={(value) => toggleValue(selectedSectors, value, setSelectedSectors)}
              selectedCompanyTypes={selectedCompanyTypes}
              toggleCompanyType={(value) =>
                toggleValue(selectedCompanyTypes, value, setSelectedCompanyTypes)
              }
              selectedStatuses={selectedStatuses}
              toggleStatus={(value) => toggleValue(selectedStatuses, value, setSelectedStatuses)}
              amount={maxAmount}
              onAmount={setMaxAmount}
            />
          </div>
        </div>

        <HowItWorks />
      </section>
    </main>
  );
}
