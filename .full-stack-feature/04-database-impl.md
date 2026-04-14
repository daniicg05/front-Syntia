# Database Implementation: React UI/UX Redesign — Backend Phase 1

> Branch: `feat/redesign-backend` (no commits)
> All changes are surgical edits to existing files only.

---

## Files Modified

### Fix B2 — `@JsonIgnore` on `Usuario.password` (Security)

**`src/main/java/com/syntia/ai/model/Usuario.java`**
- Added import `com.fasterxml.jackson.annotation.JsonIgnore`
- Added `@JsonIgnore` above the `password` field

**Why:** `GET /api/admin/usuarios` was serializing the bcrypt hash alongside user data. This is a critical security leak.

---

### Fix B3 — `creadoEn` timestamp on `Proyecto`

**`src/main/java/com/syntia/ai/model/Proyecto.java`**
- Added `java.time.LocalDateTime` import
- Added field: `@Column(name = "creado_en", updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")`
- Added `@PrePersist` callback `onCreate()` that sets `creadoEn` if null (safe for existing rows — DB default fills them)

**`src/main/java/com/syntia/ai/model/dto/ProyectoDTO.java`**
- Added `private LocalDateTime creadoEn;`

**`src/main/java/com/syntia/ai/service/ProyectoService.java`**
- In `toDTO()`: added `dto.setCreadoEn(proyecto.getCreadoEn());`

**Why:** Frontend `proyectos/page.tsx` renders `proyecto.fechaCreacion` but the entity had no timestamp column — the card silently hid the date. The `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` column definition ensures existing rows get a value on next DDL update.

---

### Fix B4 — `tipo` field in `ConvocatoriaPublicaDTO`

**`src/main/java/com/syntia/ai/model/dto/ConvocatoriaPublicaDTO.java`**
- Added `private String tipo;` field

**`src/main/java/com/syntia/ai/controller/api/ConvocatoriaPublicaController.java`**
- In `toPublicDTO()` builder: added `.tipo(c.getTipo())`

**`src/main/java/com/syntia/ai/service/MatchService.java`**
- In `toMatchDTO()` builder: added `.tipo(c.getTipo())`

**Why:** Recommendation cards display a `tipo` badge. The field existed on `Convocatoria` entity but was missing from the public DTO and match DTO — both now include it.

---

## Bug B1 — Dashboard type shape

**No backend change needed.** The backend already returns the correct shape:
`List<{ proyecto: {...}, recomendaciones: [...] }>`.
The frontend had the wrong TypeScript type (`Record<string, RecomendacionDTO[]>`).
This is fixed in the frontend implementation (Step 6).

---

## Phase 2 Backend Changes (pending — during UI build)

These are NOT yet implemented. To be done in a follow-up:
- `GET /api/usuario/perfil/completo` — new endpoint
- `Perfil.nombre` — add field + migration
- `RecomendacionDTO` — add `organismo`, `presupuesto`, `fechaPublicacion`
- `/api/usuario/convocatorias/recomendadas` — paginate response
