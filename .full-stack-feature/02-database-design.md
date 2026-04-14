# Database & Data Contract Design: React UI/UX Redesign

> This is primarily a UI/UX redesign — NO new database tables are introduced.
> This document covers the existing data model, complete API contracts, and
> gap analysis identifying what the backend must add/fix to support the redesign.

---

## Summary

The agent explored all 85 Java backend source files and 50 TypeScript/TSX frontend files.
Full detail is in `docs/data-contract-redesign-v5.md` (backend repo).

---

## Existing Entities

| Entity | Table | Key Fields |
|--------|-------|-----------|
| `Usuario` | `usuarios` | id, email, password_hash (bcrypt), rol (ADMIN/USUARIO), plan (GRATUITO/PREMIUM), creadoEn |
| `Perfil` | `perfiles` | usuario_id (FK), sector, ubicacion, empresa, provincia, telefono, tipoEntidad, objetivos, necesidadesFinanciacion, descripcionLibre |
| `Proyecto` | `proyectos` | id, usuario_id (FK), nombre, sector, ubicacion, descripcion — **NO creadoEn column** |
| `Convocatoria` | `convocatorias` | id, titulo, tipo, sector, ubicacion, organismo, fechaCierre, fechaPublicacion, presupuesto, abierto, fuente, descripcion, textoCompleto |
| `Recomendacion` | `recomendaciones` | id, proyecto_id (FK), convocatoria_id (FK), puntuacion, explicacion, guia, guiaEnriquecida, usadaIa, generadaEn |
| `SyncState` | `sync_state` | eje (unique), estado, ultimaPaginaOk, registrosNuevos, etc. |
| `SyncLog` | `sync_log` | ejecucionId, eje, pagina, registros, errores, ts |
| `HistorialCorreo` | `historial_correo` | usuario_id (FK), anterior, nuevo, fecha, actor |

---

## Critical Bugs Found

| # | Issue | Severity |
|---|-------|----------|
| B1 | Dashboard: backend returns `List<{proyecto, recomendaciones}>` but frontend does `Object.entries(data.topRecomendaciones)` expecting a named map — produces index keys `"0"`, `"1"` not project names | **Critical** |
| B2 | `GET /api/admin/usuarios` returns raw `Usuario[]` including `password` bcrypt hash | **Critical (Security)** |
| B3 | `PerfilDTO` has no `email` or `nombre` — frontend patches from JWT, `nombre` field always empty | **High** |

---

## Backend Changes Required for Redesign

### Priority 1 — Blocking (must fix before UI build)

1. **Fix dashboard response**: Keep `List<{proyecto, recomendaciones}>` shape; fix frontend type/destructuring to consume it correctly
2. **`@JsonIgnore` on `Usuario.password`**: Prevents bcrypt hash from leaking in admin API
3. **Add `creadoEn` to `Proyecto` entity + `ProyectoDTO`**: Proyecto list card renders creation date — entity has no timestamp column
4. **Add `tipo` to `ConvocatoriaPublicaDTO`**: Used by recommendation cards, missing from public DTO

### Priority 2 — Important for UX

5. **Add `organismo`, `presupuesto`, `fechaPublicacion` to `RecomendacionDTO`**: Available on `Convocatoria` entity, enriches recommendation cards
6. **Create `GET /api/usuario/perfil/completo`**: Returns perfil + `{email, rol, plan, creadoEn}` — eliminates JWT-parsing workaround
7. **Add `nombre` field to `Perfil` entity + `PerfilDTO`**: No full-name concept exists; redesigned profile page requires it
8. **Wrap `GET /api/usuario/convocatorias/recomendadas` in page response**: Change from `List<>` to `{content, totalElements, totalPages, page, size}`

### Priority 3 — Enhancement

9. **Filter params on `GET /api/admin/convocatorias`**: `q`, `sector`, `abierto`, `organismo`, `sort`
10. **`GET /api/admin/stats`**: Richer stats with `totalConvocatoriasAbiertas` + plan breakdown
11. **Expose `plan` in admin user list**
12. **`abierto` filter on public buscar** (`?abierto=true`)

---

## Canonical TypeScript Types (for redesign)

All types are fully specified in `docs/data-contract-redesign-v5.md` § 6.
These should be created in `src/lib/types/`:

| File | Types |
|------|-------|
| `auth.ts` | `JwtPayload`, `LoginResponse` |
| `perfil.ts` | `PerfilDTO`, `PerfilCompletoDTO` |
| `proyecto.ts` | `ProyectoDTO` |
| `recomendacion.ts` | `RecomendacionDTO` |
| `convocatoria.ts` | `ConvocatoriaPublicaDTO`, `ConvocatoriasPageResponse`, `ConvocatoriaAdminDTO` |
| `dashboard.ts` | `DashboardData` |
| `admin.ts` | `AdminDashboardStats`, `AdminUsuarioListItem`, `AdminUsuarioDetalle` |
| `bdns.ts` | `ImportacionBdnsEstadoDTO`, `ResumenEjecucionDTO`, `SyncStateDTO`, `CoberturaDTO` |
| `guia.ts` | `GuiaSubvencionDTO` |