# Backend Implementation: React UI/UX Redesign — Phase 1

> Branch: `feat/redesign-backend` (no commits)
> Phase 1 complete. Phase 2 pending (during UI build).

## Phase 1 — Completed

### B2: `@JsonIgnore` on `Usuario.password`
- **File:** `model/Usuario.java`
- Added `@JsonIgnore` + import. Prevents bcrypt hash leaking via `GET /api/admin/usuarios`.

### B3: `Proyecto.creadoEn` timestamp
- **File:** `model/Proyecto.java` — added `creadoEn LocalDateTime` + `@PrePersist`, `columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"`
- **File:** `model/dto/ProyectoDTO.java` — added `creadoEn LocalDateTime`
- **File:** `service/ProyectoService.java` — added `dto.setCreadoEn(proyecto.getCreadoEn())`

### B4: `tipo` field in `ConvocatoriaPublicaDTO`
- **File:** `model/dto/ConvocatoriaPublicaDTO.java` — added `String tipo`
- **File:** `controller/api/ConvocatoriaPublicaController.java` — added `.tipo(c.getTipo())` in builder
- **File:** `service/MatchService.java` — added `.tipo(c.getTipo())` in match DTO builder

### B1: Dashboard shape mismatch
- Frontend-only fix (see frontend impl). Backend shape was already correct.

## Phase 2 — Pending

See `03-architecture.md §4.2` for exact file changes:
- `RecomendacionDTO`: add `organismo`, `presupuesto`, `fechaPublicacion`
- `PerfilController`: add `GET /api/usuario/perfil/completo`
- `Perfil` + `PerfilDTO`: add nullable `nombre` field
- `/api/usuario/convocatorias/recomendadas`: wrap in page response
