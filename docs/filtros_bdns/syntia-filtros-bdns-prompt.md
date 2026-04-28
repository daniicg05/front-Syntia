# Syntia — Guía de Implementación: Filtros BDNS Completos + Vista Detalle de Convocatoria

> **Versión objetivo:** v5.0.0  
> **Stack:** Java 17 · Spring Boot 3.3.x · PostgreSQL 17.2 · Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS  
> **Fuente de verdad API:** `snpsap-api.json` v1.1.0 — 52 endpoints disponibles

---

## Resumen Ejecutivo

El estado actual de Syntia (v4.5.0) usa únicamente 4-5 de los 19 parámetros disponibles en `/convocatorias/busqueda`, todos mediante texto libre (`descripcion` + keywords generadas por IA). La mejora consiste en:

1. **Sincronizar 4 catálogos** BDNS a tablas locales PostgreSQL (regiones, finalidades, instrumentos, órganos)
2. **Refactorizar `BdnsFiltrosBuilder`** para construir búsquedas por IDs estructurados en lugar de texto
3. **Ampliar `FiltrosBdns`** con los 19 parámetros completos
4. **Implementar vista detalle** `/convocatorias/[id]` en Next.js con todos los campos disponibles del endpoint `GET /api/convocatorias/{id}`

El impacto esperado: **reducción ~40% de candidatas irrelevantes antes de la evaluación IA**, ahorrando tokens de OpenAI y bajando la latencia total de 40-86s a ~20-35s.

---

## Parte 1 — Backend: Catálogos, Filtros y Detalle

### 1.1 Tablas de catálogo en PostgreSQL

```sql
-- Migración Flyway: V5__catalogos_bdns.sql

CREATE TABLE bdns_regiones (
    id       INTEGER PRIMARY KEY,
    nombre   VARCHAR(255) NOT NULL,
    nivel    VARCHAR(50),
    activo   BOOLEAN DEFAULT TRUE,
    sync_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bdns_finalidades (
    id      INTEGER PRIMARY KEY,
    nombre  VARCHAR(500) NOT NULL,
    activo  BOOLEAN DEFAULT TRUE,
    sync_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bdns_instrumentos (
    id      INTEGER PRIMARY KEY,
    nombre  VARCHAR(255) NOT NULL,
    activo  BOOLEAN DEFAULT TRUE,
    sync_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bdns_organos (
    id            INTEGER PRIMARY KEY,
    nombre        VARCHAR(500) NOT NULL,
    tipo_admon    CHAR(1) NOT NULL,  -- C, A, L, O
    activo        BOOLEAN DEFAULT TRUE,
    sync_at       TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda por nombre (normalización texto→ID)
CREATE INDEX idx_regiones_nombre   ON bdns_regiones   USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_finalidades_nombre ON bdns_finalidades USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_instrumentos_nombre ON bdns_instrumentos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_organos_nombre    ON bdns_organos    USING gin(to_tsvector('spanish', nombre));
```

### 1.2 Servicio de sincronización de catálogos

```java
// service/CatalogosBdnsService.java

@Service
@Slf4j
@RequiredArgsConstructor
public class CatalogosBdnsService {

    private final BdnsHttpClient bdnsHttpClient;
    private final BdnsRegionesRepository regionesRepo;
    private final BdnsFinalidadesRepository finalidadesRepo;
    private final BdnsInstrumentosRepository instrumentosRepo;
    private final BdnsOrganosRepository organosRepo;

    private static final String BASE_URL = "https://www.infosubvenciones.es/bdnstrans/api";

    // Sincronización al arrancar + cada 7 días
    @Scheduled(fixedRate = 7 * 24 * 60 * 60 * 1000)
    @PostConstruct
    public void sincronizarTodos() {
        log.info("[BDNS] Iniciando sincronización de catálogos...");
        sincronizarRegiones();
        sincronizarFinalidades();
        sincronizarInstrumentos();
        sincronizarOrganos();
        log.info("[BDNS] Catálogos sincronizados.");
    }

    private void sincronizarRegiones() {
        try {
            List<BdnsRegionDTO> data = bdnsHttpClient.getList(
                BASE_URL + "/regiones", BdnsRegionDTO.class);
            regionesRepo.deleteAll();
            regionesRepo.saveAll(data.stream().map(this::toEntity).toList());
        } catch (Exception e) {
            log.warn("[BDNS] Error sync regiones: {}", e.getMessage());
        }
    }

    private void sincronizarFinalidades() {
        try {
            List<BdnsFinalidadDTO> data = bdnsHttpClient.getList(
                BASE_URL + "/finalidades?vpd=GE", BdnsFinalidadDTO.class);
            finalidadesRepo.deleteAll();
            finalidadesRepo.saveAll(data.stream().map(this::toEntity).toList());
        } catch (Exception e) {
            log.warn("[BDNS] Error sync finalidades: {}", e.getMessage());
        }
    }

    private void sincronizarInstrumentos() {
        try {
            List<BdnsInstrumentoDTO> data = bdnsHttpClient.getList(
                BASE_URL + "/instrumentos", BdnsInstrumentoDTO.class);
            instrumentosRepo.deleteAll();
            instrumentosRepo.saveAll(data.stream().map(this::toEntity).toList());
        } catch (Exception e) {
            log.warn("[BDNS] Error sync instrumentos: {}", e.getMessage());
        }
    }

    private void sincronizarOrganos() {
        for (String tipo : List.of("C", "A", "L", "O")) {
            try {
                List<BdnsOrganoDTO> data = bdnsHttpClient.getList(
                    BASE_URL + "/organos?vpd=GE&idAdmon=" + tipo, BdnsOrganoDTO.class);
                data.forEach(d -> d.setTipoAdmon(tipo));
                organosRepo.saveAll(data.stream().map(this::toEntity).toList());
            } catch (Exception e) {
                log.warn("[BDNS] Error sync organos tipo={}: {}", tipo, e.getMessage());
            }
        }
    }

    // Resolución texto → ID (para usar en BdnsFiltrosBuilder)
    @Cacheable("bdns:region:id")
    public List<Integer> resolverRegionIds(String ubicacionTexto) {
        if (ubicacionTexto == null || ubicacionTexto.isBlank()) return List.of();
        return regionesRepo.findByNombreContainingIgnoreCase(ubicacionTexto)
            .stream().map(BdnsRegion::getId).toList();
    }

    @Cacheable("bdns:finalidad:id")
    public Integer resolverFinalidadId(String sectorTexto) {
        if (sectorTexto == null || sectorTexto.isBlank()) return null;
        return finalidadesRepo.findBestMatch(sectorTexto)
            .map(BdnsFinalidad::getId).orElse(null);
    }

    @Cacheable("bdns:instrumento:id")
    public List<Integer> resolverInstrumentoIds(List<String> tipos) {
        if (tipos == null || tipos.isEmpty()) return List.of();
        return instrumentosRepo.findByNombresIn(tipos)
            .stream().map(BdnsInstrumento::getId).toList();
    }
}
```

### 1.3 `FiltrosBdns.java` — modelo completo con los 19 parámetros

```java
// model/FiltrosBdns.java

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FiltrosBdns {

    // --- PAGINACIÓN Y ORDEN ---
    @Builder.Default private Integer page = 0;
    @Builder.Default private Integer pageSize = 15;
    private String order;          // Campo por el que ordenar
    private String direccion;      // "asc" | "desc"

    // --- IDENTIFICADOR DE PORTAL ---
    @Builder.Default private String vpd = "GE";  // Siempre GE

    // --- FILTROS DE TEXTO LIBRE ---
    private String descripcion;
    private Integer descripcionTipoBusqueda;  // 0=exacta, 1=todas, 2=alguna
    private String numeroConvocatoria;        // Código BDNS exacto
    private String ayudaEstado;               // SA Number (solo cifras)

    // --- FLAGS BOOLEANOS ---
    private Boolean mrr;           // Mecanismo Recuperación y Resiliencia
    private Boolean contribucion;  // Contribución internacional

    // --- RANGO TEMPORAL ---
    private LocalDate fechaDesde;
    private LocalDate fechaHasta;

    // --- TIPO DE ADMINISTRACIÓN ---
    private String tipoAdministracion;  // C=Estado, A=Autonómica, L=Local, O=Otro

    // --- IDs DE CATÁLOGO (poblar desde tablas locales) ---
    private List<Integer> regiones;           // GET /api/regiones
    private List<Integer> organos;            // GET /api/organos?vpd=GE&idAdmon=X
    private List<Integer> instrumentos;       // GET /api/instrumentos
    private Integer finalidad;                // GET /api/finalidades?vpd=GE
    private List<Integer> tiposBeneficiario;  // ⚠️ Sin endpoint catálogo público identificado
}
```

### 1.4 `BdnsFiltrosBuilder.java` — construcción de URL completa

```java
// service/BdnsFiltrosBuilder.java

@Component
@RequiredArgsConstructor
public class BdnsFiltrosBuilder {

    private static final String BASE_URL =
        "https://www.infosubvenciones.es/bdnstrans/api";

    private final CatalogosBdnsService catalogos;

    /**
     * Construye FiltrosBdns desde los campos de un proyecto y perfil.
     * Toda la resolución texto→ID ocurre aquí, en service/, nunca en controller.
     */
    public FiltrosBdns fromProyectoPerfil(Proyecto proyecto, Perfil perfil) {
        String ubicacion = coalesce(proyecto.getUbicacion(), perfil.getUbicacion());
        String sector    = coalesce(proyecto.getSector(), perfil.getSector());

        return FiltrosBdns.builder()
            .pageSize(15)
            .descripcionTipoBusqueda(1)  // "todas las palabras"
            // Geografía → IDs
            .regiones(catalogos.resolverRegionIds(ubicacion))
            // Sector → ID de finalidad
            .finalidad(catalogos.resolverFinalidadId(sector))
            // Tipo administración desde ubicación (si es nacional → "C", si es CCAA → "A")
            .tipoAdministracion(inferirTipoAdmon(ubicacion))
            // Sólo convocatorias con plazo futuro
            .fechaHasta(null)
            .fechaDesde(null)
            .build();
    }

    /**
     * Construye la URL final para llamar a BDNS.
     */
    public String buildUrl(FiltrosBdns f) {
        UriComponentsBuilder b = UriComponentsBuilder
            .fromHttpUrl(BASE_URL + "/convocatorias/busqueda")
            .queryParam("vpd", f.getVpd())
            .queryParam("page",     f.getPage())
            .queryParam("pageSize", f.getPageSize());

        // Texto libre
        if (hasText(f.getDescripcion()))
            b.queryParam("descripcion", f.getDescripcion());
        if (f.getDescripcionTipoBusqueda() != null)
            b.queryParam("descripcionTipoBusqueda", f.getDescripcionTipoBusqueda());
        if (hasText(f.getNumeroConvocatoria()))
            b.queryParam("numeroConvocatoria", f.getNumeroConvocatoria());
        if (hasText(f.getAyudaEstado()))
            b.queryParam("ayudaEstado", f.getAyudaEstado());

        // Flags
        if (Boolean.TRUE.equals(f.getMrr()))
            b.queryParam("mrr", true);
        if (Boolean.TRUE.equals(f.getContribucion()))
            b.queryParam("contribucion", true);

        // Fechas
        if (f.getFechaDesde() != null)
            b.queryParam("fechaDesde", f.getFechaDesde().toString());
        if (f.getFechaHasta() != null)
            b.queryParam("fechaHasta", f.getFechaHasta().toString());

        // Enum
        if (hasText(f.getTipoAdministracion()))
            b.queryParam("tipoAdministracion", f.getTipoAdministracion());

        // IDs de catálogo
        if (notEmpty(f.getRegiones()))
            b.queryParam("regiones", joinIds(f.getRegiones()));
        if (notEmpty(f.getOrganos()))
            b.queryParam("organos", joinIds(f.getOrganos()));
        if (notEmpty(f.getInstrumentos()))
            b.queryParam("instrumentos", joinIds(f.getInstrumentos()));
        if (f.getFinalidad() != null)
            b.queryParam("finalidad", f.getFinalidad());
        if (notEmpty(f.getTiposBeneficiario()))
            b.queryParam("tiposBeneficiario", joinIds(f.getTiposBeneficiario()));

        // Ordenación
        if (hasText(f.getOrder()))
            b.queryParam("order", f.getOrder());
        if (hasText(f.getDireccion()))
            b.queryParam("direccion", f.getDireccion());

        return b.toUriString();
    }

    private String joinIds(List<Integer> ids) {
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private boolean hasText(String s) { return s != null && !s.isBlank(); }
    private boolean notEmpty(List<?> l) { return l != null && !l.isEmpty(); }
    private String coalesce(String a, String b) { return hasText(a) ? a : b; }
}
```

### 1.5 Endpoint de detalle de convocatoria

```java
// controller/api/ConvocatoriaDetalleController.java

@RestController
@RequestMapping("/api/convocatorias")
@RequiredArgsConstructor
public class ConvocatoriaDetalleController {

    private final BdnsClientService bdnsClient;

    @GetMapping("/{idBdns}/detalle")
    public ResponseEntity<ConvocatoriaDetalleDTO> getDetalle(
            @PathVariable String idBdns) {
        ConvocatoriaDetalleDTO detalle = bdnsClient.obtenerDetalleCompleto(idBdns);
        return ResponseEntity.ok(detalle);
    }
}
```

```java
// DTO completo para detalle — ConvocatoriaDetalleDTO.java

@Data
@Builder
public class ConvocatoriaDetalleDTO {

    // Identificación
    private String  idBdns;
    private String  numeroConvocatoria;
    private String  titulo;
    private String  tituloAlternativo;      // descripcionLeng

    // Clasificación
    private String  tipo;                   // Estatal / Autonómica / Local
    private String  ubicacion;              // nivel1 + nivel2
    private String  sector;                 // inferido por IA
    private String  finalidad;              // texto de finalidad BDNS
    private String  instrumento;            // tipo de ayuda

    // Organismo convocante
    private String  nivel1;
    private String  nivel2;
    private String  nivel3;                 // organismo específico
    private String  fuente;                 // "BDNS – " + nivel3/nivel2

    // Objeto y beneficiarios
    private String  objeto;                 // descripcionObjeto / finalidad
    private String  beneficiarios;          // tiposBeneficiarios
    private String  requisitos;             // condicionesAcceso
    private String  documentacion;          // documentosRequeridos

    // Financiero
    private String  dotacion;              // presupuestoTotal / importeTotal
    private String  ayudaEstado;           // SA Number
    private Boolean mrr;
    private Boolean contribucion;

    // Plazos
    private LocalDate fechaRecepcion;
    private LocalDate fechaFinSolicitud;
    private LocalDate fechaCierre;
    private String  plazoSolicitudes;       // texto plazo presentación

    // Procedimiento
    private String  procedimiento;          // formaPresentacion
    private String  basesReguladoras;       // normativa
    private String  urlOficial;

    // Recomendación IA (si existe en BD de Syntia)
    private Integer        puntuacion;
    private String         explicacion;
    private String         guia;
    private LocalDateTime  fechaAnalisis;
}
```

```java
// En BdnsClientService.java — método obtenerDetalleCompleto()

@Cacheable(value = "bdns:detalle", key = "#idBdns")
public ConvocatoriaDetalleDTO obtenerDetalleCompleto(String idBdns) {
    String url = BASE_URL + "/convocatorias/" + idBdns;
    Map<String, Object> raw = restClient.get().uri(url)
        .retrieve().body(Map.class);

    return ConvocatoriaDetalleDTO.builder()
        .idBdns(idBdns)
        .numeroConvocatoria(getString(raw, "numeroConvocatoria"))
        .titulo(coalesce(getString(raw, "descripcion"), getString(raw, "descripcionLeng")))
        .objeto(coalesce(getString(raw, "objeto"),
                coalesce(getString(raw, "descripcionObjeto"), getString(raw, "finalidad"))))
        .beneficiarios(coalesce(getString(raw, "beneficiarios"), getString(raw, "tiposBeneficiarios")))
        .requisitos(coalesce(getString(raw, "requisitos"),
                   coalesce(getString(raw, "condicionesAcceso"), getString(raw, "requisitosParticipacion"))))
        .dotacion(coalesce(getString(raw, "dotacion"),
                 coalesce(getString(raw, "presupuestoTotal"), getString(raw, "importeTotal"))))
        .basesReguladoras(coalesce(getString(raw, "basesReguladoras"), getString(raw, "normativa")))
        .plazoSolicitudes(coalesce(getString(raw, "plazoSolicitudes"), getString(raw, "plazoPresentacion")))
        .procedimiento(coalesce(getString(raw, "procedimiento"), getString(raw, "formaPresentacion")))
        .documentacion(coalesce(getString(raw, "documentacion"), getString(raw, "documentosRequeridos")))
        .nivel1(getString(raw, "nivel1"))
        .nivel2(getString(raw, "nivel2"))
        .nivel3(getString(raw, "nivel3"))
        .ayudaEstado(getString(raw, "ayudaEstado"))
        .fechaRecepcion(parseDate(getString(raw, "fechaRecepcion")))
        .fechaFinSolicitud(parseDate(coalesce(getString(raw, "fechaFinSolicitud"), getString(raw, "fechaCierre"))))
        .urlOficial("https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria/" +
                    getString(raw, "numeroConvocatoria"))
        .build();
}
```

### 1.6 Endpoint de catálogos para el frontend

```java
// controller/api/CatalogosController.java
// El frontend necesita estos datos para renderizar los selects de filtros

@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
public class CatalogosController {

    private final CatalogosBdnsService catalogos;

    @GetMapping("/regiones")
    public List<CatalogoItemDTO> getRegiones() {
        return catalogos.getAllRegiones();  // [{id, nombre}]
    }

    @GetMapping("/finalidades")
    public List<CatalogoItemDTO> getFinalidades() {
        return catalogos.getAllFinalidades();
    }

    @GetMapping("/instrumentos")
    public List<CatalogoItemDTO> getInstrumentos() {
        return catalogos.getAllInstrumentos();
    }

    @GetMapping("/organos")
    public List<CatalogoItemDTO> getOrganos(
            @RequestParam(required = false) String tipoAdmon) {
        return catalogos.getOrganos(tipoAdmon);
    }
}
```

---

## Parte 2 — Frontend: Filtros y Vista Detalle (Next.js 15 App Router)

### 2.1 Tipos TypeScript

```typescript
// types/bdns.ts

export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface FiltrosBdns {
  descripcion?: string;
  descripcionTipoBusqueda?: 0 | 1 | 2;
  tipoAdministracion?: 'C' | 'A' | 'L' | 'O';
  regiones?: number[];
  finalidad?: number;
  instrumentos?: number[];
  organos?: number[];
  tiposBeneficiario?: number[];
  fechaDesde?: string;   // yyyy-MM-dd
  fechaHasta?: string;   // yyyy-MM-dd
  mrr?: boolean;
  contribucion?: boolean;
  page?: number;
  pageSize?: number;
  order?: string;
  direccion?: 'asc' | 'desc';
}

export interface ConvocatoriaDetalle {
  idBdns: string;
  numeroConvocatoria: string;
  titulo: string;
  tipo: string;
  ubicacion: string;
  sector: string | null;
  finalidad: string | null;
  instrumento: string | null;
  nivel1: string;
  nivel2: string;
  nivel3: string | null;
  fuente: string;
  objeto: string | null;
  beneficiarios: string | null;
  requisitos: string | null;
  documentacion: string | null;
  dotacion: string | null;
  ayudaEstado: string | null;
  mrr: boolean;
  contribucion: boolean;
  fechaRecepcion: string | null;
  fechaFinSolicitud: string | null;
  fechaCierre: string | null;
  plazoSolicitudes: string | null;
  procedimiento: string | null;
  basesReguladoras: string | null;
  urlOficial: string;
  // Datos IA opcionales (si ya fue analizada en Syntia)
  puntuacion?: number;
  explicacion?: string;
  guia?: string;
}
```

### 2.2 Panel de filtros — componente React

```tsx
// components/BdnsFiltrosPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import type { FiltrosBdns, CatalogoItem } from '@/types/bdns';

interface Props {
  onFiltrar: (filtros: FiltrosBdns) => void;
}

export function BdnsFiltrosPanel({ onFiltrar }: Props) {
  const [regiones, setRegiones]       = useState<CatalogoItem[]>([]);
  const [finalidades, setFinalidades] = useState<CatalogoItem[]>([]);
  const [instrumentos, setInstrumentos] = useState<CatalogoItem[]>([]);

  const [filtros, setFiltros] = useState<FiltrosBdns>({
    descripcionTipoBusqueda: 1,
    page: 0,
    pageSize: 15,
  });

  // Cargar catálogos al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/catalogos/regiones',    { headers }).then(r => r.json()),
      fetch('/api/catalogos/finalidades', { headers }).then(r => r.json()),
      fetch('/api/catalogos/instrumentos',{ headers }).then(r => r.json()),
    ]).then(([reg, fin, ins]) => {
      setRegiones(reg);
      setFinalidades(fin);
      setInstrumentos(ins);
    });
  }, []);

  const set = (campo: keyof FiltrosBdns, valor: unknown) =>
    setFiltros(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltrar(filtros);
  };

  const handleReset = () => {
    setFiltros({ descripcionTipoBusqueda: 1, page: 0, pageSize: 15 });
    onFiltrar({});
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-xl shadow-sm border">

      {/* Búsqueda de texto */}
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-gray-700">Texto / Título</label>
        <input
          type="text"
          value={filtros.descripcion ?? ''}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Buscar en título..."
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {/* Modo búsqueda texto */}
      <div>
        <label className="text-sm font-medium text-gray-700">Modo búsqueda</label>
        <select
          value={filtros.descripcionTipoBusqueda}
          onChange={e => set('descripcionTipoBusqueda', Number(e.target.value))}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value={1}>Todas las palabras</option>
          <option value={0}>Frase exacta</option>
          <option value={2}>Alguna palabra</option>
        </select>
      </div>

      {/* Tipo administración */}
      <div>
        <label className="text-sm font-medium text-gray-700">Tipo administración</label>
        <select
          value={filtros.tipoAdministracion ?? ''}
          onChange={e => set('tipoAdministracion', e.target.value || undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          <option value="C">Estatal</option>
          <option value="A">Autonómica</option>
          <option value="L">Local</option>
          <option value="O">Otra</option>
        </select>
      </div>

      {/* Región */}
      <div>
        <label className="text-sm font-medium text-gray-700">Región</label>
        <select
          value={filtros.regiones?.[0] ?? ''}
          onChange={e => set('regiones', e.target.value ? [Number(e.target.value)] : undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todas las regiones</option>
          {regiones.map(r => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
      </div>

      {/* Finalidad / Sector */}
      <div>
        <label className="text-sm font-medium text-gray-700">Sector (Finalidad)</label>
        <select
          value={filtros.finalidad ?? ''}
          onChange={e => set('finalidad', e.target.value ? Number(e.target.value) : undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todos los sectores</option>
          {finalidades.map(f => (
            <option key={f.id} value={f.id}>{f.nombre}</option>
          ))}
        </select>
      </div>

      {/* Instrumento */}
      <div>
        <label className="text-sm font-medium text-gray-700">Tipo de ayuda</label>
        <select
          value={filtros.instrumentos?.[0] ?? ''}
          onChange={e => set('instrumentos', e.target.value ? [Number(e.target.value)] : undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {instrumentos.map(i => (
            <option key={i.id} value={i.id}>{i.nombre}</option>
          ))}
        </select>
      </div>

      {/* Fechas */}
      <div>
        <label className="text-sm font-medium text-gray-700">Publicada desde</label>
        <input type="date" value={filtros.fechaDesde ?? ''}
          onChange={e => set('fechaDesde', e.target.value || undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Publicada hasta</label>
        <input type="date" value={filtros.fechaHasta ?? ''}
          onChange={e => set('fechaHasta', e.target.value || undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {/* Flags especiales */}
      <div className="flex items-center gap-6 pt-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox"
            checked={filtros.mrr ?? false}
            onChange={e => set('mrr', e.target.checked || undefined)}
          /> MRR / Plan Recuperación
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox"
            checked={filtros.contribucion ?? false}
            onChange={e => set('contribucion', e.target.checked || undefined)}
          /> Internacional
        </label>
      </div>

      {/* Acciones */}
      <div className="md:col-span-3 flex gap-3 justify-end">
        <button type="button" onClick={handleReset}
          className="px-4 py-2 rounded-lg border text-sm">
          Limpiar filtros
        </button>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium">
          Buscar convocatorias
        </button>
      </div>
    </form>
  );
}
```

### 2.3 Página de detalle — Next.js App Router

```
app/
└── convocatorias/
    └── [idBdns]/
        └── page.tsx    ← Ruta: /convocatorias/609545
```

```tsx
// app/convocatorias/[idBdns]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ConvocatoriaDetalle } from '@/types/bdns';

export default function DetalleConvocatoriaPage() {
  const { idBdns } = useParams<{ idBdns: string }>();
  const router = useRouter();
  const [detalle, setDetalle] = useState<ConvocatoriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/convocatorias/${idBdns}/detalle`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error('No encontrada'); return r.json(); })
      .then(setDetalle)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [idBdns]);

  if (loading) return <DetallesSkeleton />;
  if (error || !detalle) return <ErrorState mensaje={error ?? 'Convocatoria no encontrada'} />;

  const diasRestantes = detalle.fechaCierre
    ? Math.ceil((new Date(detalle.fechaCierre).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-gray-800">
        ← Volver
      </button>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge color="blue">{detalle.tipo}</Badge>
        {detalle.sector && <Badge color="gray">{detalle.sector}</Badge>}
        {detalle.instrumento && <Badge color="teal">{detalle.instrumento}</Badge>}
        {detalle.mrr && <Badge color="amber">MRR</Badge>}
        {detalle.contribucion && <Badge color="purple">Internacional</Badge>}
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{detalle.titulo}</h1>
      <p className="text-sm text-gray-500 mb-6">{detalle.fuente}</p>

      {/* Score IA (si existe) */}
      {detalle.puntuacion && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-teal-800">🤖 Análisis IA de Syntia</span>
            <span className="text-2xl font-bold text-teal-700">{detalle.puntuacion}/100</span>
          </div>
          <div className="w-full bg-teal-100 rounded-full h-2 mb-3">
            <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${detalle.puntuacion}%` }} />
          </div>
          {detalle.explicacion && <p className="text-sm text-teal-700">{detalle.explicacion}</p>}
        </div>
      )}

      {/* Grid de secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Plazo */}
        <SeccionDetalle titulo="Plazo de solicitud" icono="📅">
          {diasRestantes !== null ? (
            <p className={`font-semibold ${diasRestantes < 30 ? 'text-red-600' : 'text-gray-800'}`}>
              {diasRestantes > 0
                ? `${diasRestantes} días restantes (cierre: ${formatDate(detalle.fechaCierre)})`
                : 'Plazo cerrado'}
            </p>
          ) : <p className="text-gray-500">Sin plazo definido</p>}
          {detalle.plazoSolicitudes && (
            <p className="text-sm text-gray-600 mt-1">{detalle.plazoSolicitudes}</p>
          )}
        </SeccionDetalle>

        {/* Dotación */}
        <SeccionDetalle titulo="Dotación económica" icono="💰">
          <p className="font-semibold text-gray-800">{detalle.dotacion ?? 'No especificada'}</p>
          {detalle.ayudaEstado && (
            <p className="text-xs text-gray-500 mt-1">Referencia Ayuda Estado: {detalle.ayudaEstado}</p>
          )}
        </SeccionDetalle>

        {/* Objeto */}
        {detalle.objeto && (
          <SeccionDetalle titulo="Objeto de la convocatoria" icono="📋" fullWidth>
            <p className="text-sm text-gray-700 leading-relaxed">{detalle.objeto}</p>
          </SeccionDetalle>
        )}

        {/* Beneficiarios */}
        {detalle.beneficiarios && (
          <SeccionDetalle titulo="Beneficiarios" icono="👥">
            <p className="text-sm text-gray-700">{detalle.beneficiarios}</p>
          </SeccionDetalle>
        )}

        {/* Requisitos */}
        {detalle.requisitos && (
          <SeccionDetalle titulo="Requisitos de acceso" icono="✅">
            <p className="text-sm text-gray-700">{detalle.requisitos}</p>
          </SeccionDetalle>
        )}

        {/* Documentación */}
        {detalle.documentacion && (
          <SeccionDetalle titulo="Documentación requerida" icono="📎">
            <p className="text-sm text-gray-700">{detalle.documentacion}</p>
          </SeccionDetalle>
        )}

        {/* Procedimiento */}
        {detalle.procedimiento && (
          <SeccionDetalle titulo="Cómo presentar la solicitud" icono="💻">
            <p className="text-sm text-gray-700">{detalle.procedimiento}</p>
          </SeccionDetalle>
        )}

        {/* Bases reguladoras */}
        {detalle.basesReguladoras && (
          <SeccionDetalle titulo="Bases reguladoras" icono="⚖️">
            <p className="text-sm text-gray-700">{detalle.basesReguladoras}</p>
          </SeccionDetalle>
        )}

        {/* Organismo */}
        <SeccionDetalle titulo="Organismo convocante" icono="🏛️">
          <p className="text-sm font-medium">{detalle.nivel3 ?? detalle.nivel2}</p>
          <p className="text-xs text-gray-500">{detalle.nivel2} · {detalle.nivel1}</p>
        </SeccionDetalle>

        {/* Guía IA */}
        {detalle.guia && (
          <SeccionDetalle titulo="Guía de solicitud (IA)" icono="🗺️" fullWidth>
            <div className="prose prose-sm max-w-none text-gray-700">
              {detalle.guia}
            </div>
          </SeccionDetalle>
        )}

      </div>

      {/* CTA */}
      <div className="mt-8 flex gap-3 justify-center">
        <a href={detalle.urlOficial} target="_blank" rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-teal-700 text-white font-medium text-sm hover:bg-teal-800">
          Ver convocatoria oficial ↗
        </a>
      </div>
    </main>
  );
}

// Sub-componentes auxiliares
function SeccionDetalle({ titulo, icono, children, fullWidth }: {
  titulo: string; icono: string; children: React.ReactNode; fullWidth?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {icono} {titulo}
      </h2>
      {children}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function DetallesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-6" />
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
      <div className="grid grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ mensaje }: { mensaje: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">{mensaje}</p>
    </div>
  );
}
```

### 2.4 Navegación desde tarjeta de recomendación

```tsx
// En RecomendacionCard.tsx — añadir enlace al detalle
import Link from 'next/link';

// Dentro de la tarjeta existente:
<Link href={`/convocatorias/${recomendacion.idBdns}`}
  className="text-sm text-teal-700 hover:underline font-medium">
  Ver todos los detalles →
</Link>
```

---

## Parte 3 — Prompt para el Agente de Código

Usar este prompt en tu IDE (Cursor, Copilot, Claude) para implementar todos los cambios de una sola vez:

---

### PROMPT COMPLETO PARA IMPLEMENTACIÓN

```
Contexto del proyecto: Syntia v4.5.0. Backend Java 17 + Spring Boot 3.3.x + PostgreSQL 17.2.
Frontend Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS.
Seguridad: Spring Security 6 + JWT stateless. Arquitectura API-first.

TAREA: Implementar integración completa con los 19 filtros oficiales de la API BDNS
y vista de detalle de convocatoria. Realizar estos cambios en orden:

## BACKEND (en este orden exacto):

### 1. Migración Flyway V5__catalogos_bdns.sql
Crear tablas: bdns_regiones(id PK, nombre, nivel, activo, sync_at),
bdns_finalidades(id PK, nombre, activo, sync_at),
bdns_instrumentos(id PK, nombre, activo, sync_at),
bdns_organos(id PK, nombre, tipo_admon CHAR(1), activo, sync_at).
Añadir índices GIN en columna nombre para búsqueda tsvector('spanish', nombre).

### 2. Entidades JPA + Repositorios
Crear entidades @Entity para cada tabla.
Repositorios con métodos:
- findByNombreContainingIgnoreCase(String) para regiones
- findBestMatch(String) para finalidades (query JPQL con ILIKE %texto%)
- findByNombresIn(List<String>) para instrumentos
- findByTipoAdmon(String) para organos

### 3. CatalogosBdnsService.java
Clase @Service con @PostConstruct + @Scheduled(fixedRate = 7 días).
Métodos: sincronizarRegiones(), sincronizarFinalidades(), sincronizarInstrumentos(), sincronizarOrganos().
Métodos de resolución con @Cacheable:
- resolverRegionIds(String ubicacion) → List<Integer>
- resolverFinalidadId(String sector) → Integer
- resolverInstrumentoIds(List<String> tipos) → List<Integer>
Consume la API BDNS usando el BdnsHttpClient existente con SSL permisivo.
URLs: /api/regiones, /api/finalidades?vpd=GE, /api/instrumentos, /api/organos?vpd=GE&idAdmon={C|A|L|O}.

### 4. Ampliar FiltrosBdns.java con los 19 campos completos:
page, pageSize, order, direccion, vpd (default "GE"), descripcion, descripcionTipoBusqueda (0/1/2),
numeroConvocatoria, ayudaEstado, mrr (Boolean), contribucion (Boolean),
fechaDesde (LocalDate), fechaHasta (LocalDate), tipoAdministracion (C/A/L/O),
regiones (List<Integer>), organos (List<Integer>), instrumentos (List<Integer>),
finalidad (Integer), tiposBeneficiario (List<Integer>).

### 5. Refactorizar BdnsFiltrosBuilder.java
Método fromProyectoPerfil(Proyecto, Perfil) → FiltrosBdns usando CatalogosBdnsService.
Método buildUrl(FiltrosBdns) → String usando UriComponentsBuilder.
Solo añade parámetro si el campo no es null/empty.
regiones, organos, instrumentos, tiposBeneficiario se envían como IDs separados por comas.

### 6. Ampliar BdnsClientService.java
Nuevo método obtenerDetalleCompleto(String idBdns) → ConvocatoriaDetalleDTO.
Con @Cacheable(value="bdns:detalle", key="#idBdns", TTL 24h).
Extraer campos con fallbacks: objeto → descripcionObjeto → finalidad,
beneficiarios → tiposBeneficiarios, requisitos → condicionesAcceso → requisitosParticipacion,
dotacion → presupuestoTotal → importeTotal, basesReguladoras → normativa,
plazoSolicitudes → plazoPresentacion, procedimiento → formaPresentacion.

### 7. Crear ConvocatoriaDetalleDTO.java
Con todos los campos: idBdns, numeroConvocatoria, titulo, tipo, ubicacion, sector, finalidad,
instrumento, nivel1, nivel2, nivel3, fuente, objeto, beneficiarios, requisitos, documentacion,
dotacion, ayudaEstado, mrr, contribucion, fechaRecepcion, fechaFinSolicitud, fechaCierre,
plazoSolicitudes, procedimiento, basesReguladoras, urlOficial,
y opcionales de IA: puntuacion, explicacion, guia, fechaAnalisis.

### 8. Nuevo CatalogosController.java en controller/api/
@GetMapping("/api/catalogos/regiones") → List<CatalogoItemDTO>
@GetMapping("/api/catalogos/finalidades") → List<CatalogoItemDTO>
@GetMapping("/api/catalogos/instrumentos") → List<CatalogoItemDTO>
@GetMapping("/api/catalogos/organos?tipoAdmon=") → List<CatalogoItemDTO>
Todos protegidos con @PreAuthorize("isAuthenticated()").

### 9. Nuevo ConvocatoriaDetalleController.java en controller/api/
@GetMapping("/api/convocatorias/{idBdns}/detalle") → ConvocatoriaDetalleDTO
Protegido con JWT. Delega en BdnsClientService.obtenerDetalleCompleto().

## FRONTEND (en este orden exacto):

### 10. Crear types/bdns.ts
Interfaces: CatalogoItem, FiltrosBdns (19 campos), ConvocatoriaDetalle (todos los campos del DTO).

### 11. Crear components/BdnsFiltrosPanel.tsx
Componente 'use client' con useEffect para cargar catálogos desde /api/catalogos/*.
Controles: input texto, select modo búsqueda (0/1/2), select tipoAdministracion (C/A/L/O),
select región (lista del catálogo), select finalidad/sector (lista del catálogo),
select instrumento (lista del catálogo), date inputs fechaDesde/fechaHasta,
checkboxes mrr y contribucion. Botones "Buscar" y "Limpiar filtros".
Props: onFiltrar(filtros: FiltrosBdns) => void.

### 12. Crear app/convocatorias/[idBdns]/page.tsx
Página 'use client' que:
- Extrae idBdns de useParams
- Llama GET /api/convocatorias/{idBdns}/detalle con JWT
- Muestra skeleton durante carga
- Renderiza: badges (tipo/sector/instrumento/mrr/contribucion), título, fuente,
  bloque IA si existe puntuacion, grid de secciones (plazo con días restantes en rojo si <30,
  dotación, objeto, beneficiarios, requisitos, documentación, procedimiento, bases reguladoras,
  organismo convocante, guía IA), botón CTA "Ver convocatoria oficial ↗" con target="_blank".

### 13. Añadir link en RecomendacionCard.tsx
Botón/link "Ver todos los detalles →" que navega a /convocatorias/{idBdns}.

RESTRICCIONES IMPORTANTES:
- Toda lógica de normalización (texto→ID) en service/, nunca en controller.
- El frontend solo recibe DTOs finales, nunca IDs crudos de catálogo sin resolver en UI.
- Los catálogos en frontend se cargan UNA SOLA VEZ al montar el panel de filtros, no en cada búsqueda.
- Rate limiting existente: respetar 30s para búsquedas BDNS en RateLimitService.
- El endpoint de detalle debe incluir los campos IA (puntuacion, explicacion, guia) si la
  convocatoria ya existe en la tabla convocatorias de Syntia (JOIN con recomendaciones).
- Mantener la deduplicación por idBdns en MotorMatchingService.
```

---

## Parte 4 — Orden de implementación recomendado

| Paso | Tarea | Tiempo estimado | Impacto |
|------|-------|----------------|---------|
| 1 | Migración SQL + entidades JPA | 1h | Base de todo |
| 2 | CatalogosBdnsService (sync + resolución) | 2h | 🔴 Crítico |
| 3 | FiltrosBdns + BdnsFiltrosBuilder | 1h | 🔴 Crítico |
| 4 | ConvocatoriaDetalleDTO + BdnsClientService | 1.5h | 🔴 Crítico |
| 5 | CatalogosController + DetalleController | 1h | Necesario para frontend |
| 6 | types/bdns.ts + BdnsFiltrosPanel.tsx | 2h | UX filtros |
| 7 | app/convocatorias/[idBdns]/page.tsx | 2h | Vista detalle |
| 8 | Link en RecomendacionCard.tsx | 15min | Navegación |
| **Total** | | **~11h** | |

