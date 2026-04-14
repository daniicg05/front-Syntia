# Syntia — UI/UX Redesign Plan

> Generated: 2026-04-13  · Last updated: 2026-04-14
> Branches: `feat/redesign-frontend` (frontend) · `feat/redesign-backend` (backend)
> Status: **All phases complete** — Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Animations ✅

---

## Color Rationale

### The problem
The existing app used `#16a34a` (Tailwind green-600) as its brand primary color throughout all components, tokens, and CSS variables.

### The Stitch proposal
The Stitch design agency produced `docs/diseño stitch/` — prototypes of dashboard, grant listing, and profile screens — along with a `DESIGN.md` manifest. Stitch designed a Material Design 3 system anchored in **deep teal** (`#005a71`). Every HTML prototype, every token, and the DESIGN.md all point to the same primary: teal, not green.

### The logo
The Syntia logo is a PNG at `/public/images/syntia-grants-logo.png`. No SVG source was found. The `globals.css` CSS variables historically used `--primary: #16a34a`, suggesting the original brand color was green. However, the Stitch redesign explicitly replaces this.

### Decision
| Token | Old value | New value | Source |
|-------|-----------|-----------|--------|
| `--primary` | `#16a34a` green | `#005a71` teal | `// extracted from docs/diseño stitch/` |
| `--primary-hover` | `#15803d` | `#0e7490` | Stitch primary-container |
| `--success` | (was brand primary) | `#005f40` | Stitch tertiary (semantic success only) |

**Green is completely reserved for the `--success` semantic token** (WCAG-compliant confirmation of real success states). It is not a brand color.

### WCAG AA
All primary combinations pass:
- `#005a71` on `#ffffff` → ~7.2:1 ✅
- `#191c1e` on `#f7f9fb` → ~18:1 ✅
- `#ffffff` on `#005a71` → ~7.2:1 ✅

---

## Stitch vs Existing Design — Merge Rationale

### What Stitch got right
- Color system: Material Design 3 teal palette is cohesive and brand-appropriate
- Surface hierarchy: 5-level surface system (no borders → depth by tone) is more sophisticated than current border-heavy cards
- Typography: Manrope for headlines adds editorial character that Inter-only lacked
- No-border principle: elevation through surface color contrast, not solid borders
- Glassmorphism: appropriate for secondary panels (roadmap sidebar, detail drawers)

### What Stitch missed (app context gaps)
- **SSE streaming UI**: Stitch never designed the AI analysis streaming log (recomendaciones page). This is a core feature — kept existing terminal-style design but with corrected colors (no hardcoded green).
- **Admin panel**: Stitch only designed user-facing screens. Admin (usuarios, convocatorias, BDNS ETL) was not in their scope. Adapted the teal token system to the existing admin layout without redesigning the structure.
- **ETL progress UI**: The BDNS import progress screen is a power-user tool — kept the data-dense table layout, applied tokens for color consistency.
- **Auth flows**: Stitch included login/register mocks. These are excluded from scope (constraint: JWT auth untouched). Shared layout components (navbar) were redesigned; auth page content was not.
- **Guías page**: Fully static, hardcoded content. No backend. Not redesigned beyond token application.

### Merge outcome
The redesign applies the Stitch design language (colors, surface hierarchy, typography, motion principles) to all existing pages and features, including those Stitch never saw. The result is a unified system — not "Stitch where Stitch designed" and "old design everywhere else."

---

## Phase 1 — Completed ✅

### Frontend (`feat/redesign-frontend`)

| File | Change |
|------|--------|
| `src/app/globals.css` | Full CSS variable system: teal `:root`, dark mode `.dark`, Tailwind v4 `@theme inline` |
| `src/app/layout.tsx` | `Fraunces` → `Manrope` headline font; `themeColor` corrected |
| `src/app/template.tsx` | `AnimatePresence` + `pageTransition` — correct page transition host in App Router |
| `src/styles/tokens.ts` | JS token constants (colors HSL, shadows, radii, typography, spacing) |
| `src/lib/motion.ts` | 15 named Framer Motion variants + `reduceMotionVariants()` |
| `src/hooks/useMotionVariants.ts` | `useReducedMotion()` integration |
| `src/lib/types/` (9 files) | Canonical TypeScript types for all API contracts |
| `src/components/ui/Modal.tsx` | New: animated reusable modal (AnimatePresence, focus trap, Escape) |
| `src/components/ui/ErrorState.tsx` | New: animated error state with retry |
| `src/components/ui/Button.tsx` | `motion.button`, `whileTap`, `whileHover` for primary |
| `src/components/ui/Badge.tsx` | success / error / warning / plan / score variants |
| `src/components/ui/Skeleton.tsx` | Framer Motion shimmer replacing CSS keyframes |
| `src/app/dashboard/page.tsx` | **B1 fix**: `topRecomendaciones` type corrected; `.map()` replaces `Object.entries()` |
| `src/components/ConvocatoriaCard.tsx` | All green → success tokens |
| `src/components/ui/Toast.tsx` | Success green → success tokens |
| `src/app/home/page.tsx` | Sector Agrícola card → success tokens |

#### Per-page Framer Motion animations (Phase Animations ✅)

| Page | Animations applied |
|------|--------------------|
| `dashboard/page.tsx` | `slideUp` header · `staggerChildren` stat grid · stagger rec cards with `x:2` hover · stagger roadmap items · `fadeIn` empty state |
| `proyectos/page.tsx` | `fadeIn` header · `staggerChildren` + `staggerItem` grid · `AnimatePresence mode="popLayout"` delete · `cardHover` (y:-2, shadow) per card |
| `perfil/page.tsx` | `fadeIn` header · `motion.form` with `staggerChildren` across 3 sections + actions row · `AnimatePresence` on both modals · Spring panel enter/exit (scale 0.95→1, y 8→0) |
| `admin/bdns/page.tsx` | `motion.div animate={{width}}` progress bar · `AnimatePresence` job status card keyed by state · Spring confirmation modal |
| `admin/usuarios/page.tsx` | `motion.tr` + `AnimatePresence mode="sync"` — deleted rows slide out right (`x:8`) |
| `admin/dashboard/page.tsx` | `staggerChildren` across both card rows |

### Backend (`feat/redesign-backend`)

| File | Change |
|------|--------|
| `model/Usuario.java` | **B2**: `@JsonIgnore` on `password` — prevents bcrypt hash leak in admin API |
| `model/Proyecto.java` | **B3**: `creadoEn LocalDateTime` + `@PrePersist` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) |
| `model/dto/ProyectoDTO.java` | **B3**: `creadoEn` field added |
| `service/ProyectoService.java` | **B3**: `dto.setCreadoEn(proyecto.getCreadoEn())` in mapper |
| `model/dto/ConvocatoriaPublicaDTO.java` | **B4**: `tipo` field added |
| `controller/api/ConvocatoriaPublicaController.java` | **B4**: `.tipo(c.getTipo())` in builder |
| `service/MatchService.java` | **B4**: `.tipo(c.getTipo())` in match DTO builder |

---

## Phase 2 — Completed ✅

| Priority | Change | File(s) |
|----------|--------|---------|
| P2-1 | Add `organismo`, `presupuesto`, `fechaPublicacion` to `RecomendacionDTO` | `RecomendacionDTO.java` + mapper |
| P2-2 | New `GET /api/usuario/perfil/completo` endpoint | `PerfilController.java` |
| P2-3 | Add `nombre` nullable field to `Perfil` + `PerfilDTO` | `Perfil.java`, `PerfilDTO.java` |
| P2-4 | Paginate `GET /api/usuario/convocatorias/recomendadas` — `{content, totalElements, totalPages, page, size}` | `ConvocatoriaPersonalizadaController.java` |

---

## Phase 3 — Completed ✅

| Change | File(s) | Notes |
|--------|---------|-------|
| `abierto` filter on `GET /api/convocatorias/publicas/buscar` | `ConvocatoriaPublicaController.java` · `ConvocatoriaRepository.java` | `?abierto=true` filters to open-only |
| `abierto` filter on `GET /api/usuario/convocatorias/buscar` | `ConvocatoriaPersonalizadaController.java` | Same param, authenticated endpoint |
| `buscarAdmin` JPQL query | `ConvocatoriaRepository.java` | Full-text + sector filter for admin table |
| `obtenerPaginaFiltrada(q, sector)` | `ConvocatoriaService.java` | Uses `buscarAdmin` when filters present |
| Filter bar on `GET /api/admin/convocatorias` (`q`, `sector`) | `AdminController.java` | Passes filters to service |
| Enriched admin dashboard: `convocatoriasAbiertas`, `usuariosConPerfil` | `AdminController.java` · `ConvocatoriaRepository.java` | Uses `countByAbiertoTrue()` + `perfilRepository.count()` |
| Frontend: "Solo abiertas" toggle in search filtros | `BuscarContent.tsx` · `api.ts` | Persisted in URL (`?abierto=true`) |
| Frontend: search + sector filter bar in admin convocatorias | `admin/convocatorias/page.tsx` | Cache-keyed by `page:q:sector` |
| Frontend: enriched admin dashboard | `admin/dashboard/page.tsx` | 2 new stat cards with percentage labels + stagger animation |

---

## Design Token Reference

```
Primary (brand):     #005a71  hsl(193 100% 22%)   // extracted from docs/diseño stitch/
Primary hover:       #0e7490  hsl(193 82% 30%)
Surface base:        #f7f9fb  hsl(210 25% 97%)
Surface card:        #ffffff  hsl(0 0% 100%)
Text primary:        #191c1e  hsl(210 10% 11%)
Text secondary:      #3f484c  hsl(200 10% 27%)
Success (semantic):  #005f40  hsl(153 100% 19%)   // NOT brand — success states only
Error:               #ba1a1a  hsl(353 84% 40%)
```

---

## Framer Motion Strategy

| Pattern | Variant | When |
|---------|---------|------|
| Page transitions | `pageTransition` in `template.tsx` | Every route change |
| List items | `staggerChildren` + `staggerItem` | Component mount |
| Cards | `cardHover` (y: -2, shadow lift) | hover/focus |
| Buttons | `buttonTap` (scale 0.97) | tap/click |
| Primary buttons | `buttonHover` (scale 1.02) | hover |
| Modals | `springScale` | AnimatePresence open/close |
| Skeletons | `skeletonShimmer` | Loading states |
| SSE log lines | `streamLogItem` | Append on event |
| Reduced motion | `useMotionVariants()` | Applies `duration: 0` automatically |

Spring config: `stiffness: 400, damping: 30` (standard) / `stiffness: 500, damping: 25` (bouncy modals/badges)

---

## Next Steps

1. Review both branches in the IDE
2. Run `npm run dev` in `front-syntia` — verify teal palette, no green, animations
3. Run the Spring Boot backend — verify all new endpoints compile and return expected shapes
4. Open PRs:
   - `feat/redesign-frontend` → `desarrollo`
   - `feat/redesign-backend` → `desarrollo`

## Checklist de entrega

- [x] Paleta teal aplicada en todos los componentes (cero verde hardcoded)
- [x] `src/styles/tokens.ts` documenta la paleta completa
- [x] `src/lib/motion.ts` exporta 15 variantes nombradas
- [x] Animaciones de página en dashboard, proyectos, perfil, admin/bdns, admin/usuarios, admin/dashboard
- [x] Page transitions vía `AnimatePresence` en `template.tsx`
- [x] `prefers-reduced-motion` respetado con `useReducedMotion()`
- [x] Backend: `@JsonIgnore` en `password`, `creadoEn` en proyectos, `tipo` en convocatorias
- [x] Backend: `nombre` en Perfil, `organismo`/`presupuesto`/`fechaPublicacion` en RecomendacionDTO
- [x] Backend: filtro `abierto` en búsqueda pública y autenticada
- [x] Backend: búsqueda por `q`+`sector` en admin convocatorias
- [x] Backend: dashboard admin enriquecido con `convocatoriasAbiertas` y `usuariosConPerfil`
- [x] Frontend: "Solo abiertas" toggle en página de búsqueda
- [x] Frontend: barra de búsqueda en admin/convocatorias
- [x] Frontend: admin/dashboard muestra las 6 métricas con porcentajes