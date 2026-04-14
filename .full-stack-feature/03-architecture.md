# Architecture: React UI/UX Redesign with Framer Motion and Backend Alignment

> Full detail: `docs/arquitectura-redesign-v5.md` (backend repo)
> This file is the canonical architecture reference for implementation steps.

---

## 1. Design System

### Color Palette — Decision

| Token | Hex | Source | Usage |
|-------|-----|--------|-------|
| `--primary` | `#005a71` | Stitch DESIGN.md | CTAs, links, emphasis — replaces green |
| `--primary-hover` | `#0e7490` | Stitch primary-container | Button hover, gradients |
| `--primary-light` | `#b9eaff` | Stitch primary-fixed | Subtle fills, icon bg |
| `--primary-muted` | `#81d1f0` | Stitch primary-fixed-dim | Badges, muted accents |
| `--background` | `#f7f9fb` | Stitch surface | Page background |
| `--surface-lowest` | `#ffffff` | Stitch surface-container-lowest | Cards (highest attention) |
| `--surface-low` | `#f2f4f6` | Stitch surface-container-low | Content over background |
| `--surface-container` | `#eceef0` | Stitch surface-container | Groupings |
| `--foreground` | `#191c1e` | Stitch on-surface | Primary text |
| `--foreground-muted` | `#3f484c` | Stitch on-surface-variant | Secondary text |
| `--success` | `#005f40` | Stitch tertiary | Success states ONLY (not brand) |
| `--destructive` | `#ba1a1a` | Stitch error | Errors, urgency |

**Previous primary `#16a34a` (green) is completely eliminated.** Green is reserved only for `--success` (tertiary — real success states).

### Green Removal Checklist

| File | Location | Fix |
|------|----------|-----|
| `src/app/globals.css` | L5-8: `--primary: #16a34a` etc. | Replace with teal palette above |
| `src/app/globals.css` | L23-24: `--accent-green`, `--accent-emerald` | Remove or rename to `--accent-tertiary` |
| `src/app/globals.css` | L60-63: dark mode green vars | Replace with teal dark palette |
| `src/app/globals.css` | L78-79: dark mode accent-green | Rename |
| `src/app/layout.tsx` | L31: `themeColor: "#f5f5f0"` | Change to `"#f7f9fb"` |
| `src/app/dashboard/page.tsx` | L91: `color="green"` | Change to `color="primary"` |
| `src/app/proyectos/[id]/recomendaciones/page.tsx` | L220: `text-green-400` | Change to `text-success` |

### Typography Change

Replace `Fraunces` with `Manrope` as the headline font in `src/app/layout.tsx`.

```typescript
import { Inter, Manrope } from "next/font/google";
const manrope = Manrope({ subsets: ["latin"], variable: "--font-headline", weight: ["400","600","700","800"] });
```

### Design Tokens Files

- **`src/app/globals.css`** — full CSS variables (`:root` + `.dark`) + Tailwind v4 `@theme inline` block
- **`src/styles/tokens.ts`** — JS/TS constants for colors, shadows, radii, typography, spacing, durations, easings

Full file contents are in `docs/arquitectura-redesign-v5.md` §1.4 and §1.5.

---

## 2. Framer Motion Architecture

### `src/lib/motion.ts` — Named Exports

```
fadeIn          — modals, tooltips, overlays
slideUp         — lists, cards, main content
slideIn         — sidebars, left-entry panels
slideInRight    — drawers, detail panels
springScale     — chips, badges, modals (bouncy spring)
staggerChildren — list container (staggerChildren: 0.06s)
staggerItem     — individual list item
pageTransition  — AnimatePresence in template.tsx
cardHover       — card lift on hover (y: -2, shadow-md)
buttonHover     — primary button (scale: 1.02 on hover)
buttonTap       — all buttons (scale: 0.97 on tap)
inputFocus      — input border glow (rgba(0,90,113,0.15))
skeletonShimmer — skeleton loading (linear bg-position sweep)
glassPanelSlide — glassmorphism panel (x + backdropFilter)
streamLogItem   — SSE streaming log line (x: -8 → 0)
reduceMotionVariants(variants) — utility fn for useReducedMotion
```

Spring config: `stiffness: 400, damping: 30` (standard), `stiffness: 500, damping: 25` (bouncy).

### `src/hooks/useMotionVariants.ts`

```typescript
export function useMotionVariants(variants: Variants): Variants {
  const shouldReduce = useReducedMotion();
  return shouldReduce ? reduceMotionVariants(variants) : variants;
}
```

### Page Transition Strategy

`AnimatePresence` lives in **`src/app/template.tsx`** (NOT layout). Template re-mounts on every navigation in App Router — this is the correct trigger point.

**Delete `src/components/PageTransition.tsx`** — replaced by template.tsx.

---

## 3. Frontend Component Architecture

### File Structure (changes)

```
src/
├── app/
│   ├── layout.tsx          MODIFY: Fraunces→Manrope, themeColor
│   ├── template.tsx        REPLACE: AnimatePresence + pageTransition
│   └── globals.css         REPLACE: full teal token system
├── components/
│   ├── PageTransition.tsx  DELETE
│   └── ui/
│       ├── Button.tsx      MODIFY: wrap in motion.button
│       ├── Card.tsx        MODIFY: variants (default/glass/elevated), hover
│       ├── Badge.tsx       MODIFY: add success/error/warning/plan/score variants
│       ├── Skeleton.tsx    REPLACE: Framer Motion shimmer
│       ├── Input.tsx       MODIFY: focus animation wrapper
│       ├── Modal.tsx       CREATE: reusable AnimatePresence modal
│       └── ErrorState.tsx  CREATE: animated error state
├── hooks/
│   └── useMotionVariants.ts  CREATE
├── lib/
│   ├── motion.ts           CREATE: all animation variants
│   └── types/              CREATE: all canonical TypeScript types
└── styles/
    └── tokens.ts           CREATE: JS token constants
```

### Per-Page Hierarchy

**Dashboard:** DashboardHeader → KPIBentoGrid (stagger) → MainGrid [RecomendacionesRecientes (lg:8col) + RoadmapSidebar (lg:4col)]

**Proyectos:** PageHeader → SearchBar → ProyectosGrid (stagger, cardHover) → EmptyState

**Recomendaciones:** Breadcrumb → ActionPanel (glassmorphism) → StreamLog (SSE stagger) → CandidatasSection (stagger) → RecomendacionesIASection (stagger) → GuiaExpandida (AnimatePresence)

**Perfil:** ProfileHeader (avatar + plan badge) → TabBar (layoutId indicator) → Tab panels (animated)

**Admin Dashboard:** PageTitle → KPIGrid (4 cols, stagger) → QuickActions

**Admin Usuarios:** PageHeader → SearchInput → UsuariosTable (motion rows, AnimatePresence delete)

**Admin BDNS:** EstadoJobCard (glassmorphism + pulse if EN_CURSO) → EjesGrid → HistorialSection → CoberturaSection (progress bars animated)

### Critical Bug Fix B1 — Dashboard Type

```typescript
// WRONG (current frontend):
topRecomendaciones: Record<string, RecomendacionDTO[]>  // causes Object.entries() to return "0","1"

// CORRECT (matches backend):
topRecomendaciones: Array<{ proyecto: { id: number; nombre: string; sector?: string }; recomendaciones: RecomendacionDTO[] }>
// Render: data.topRecomendaciones.map(({ proyecto, recomendaciones }) => ...)
```

No backend change needed. Frontend type alignment only.

---

## 4. Backend Architecture — Phased Plan

### Phase 1 — Blocking (before UI build)

| # | File | Change |
|---|------|--------|
| B1 | `src/app/dashboard/page.tsx` (frontend) | Fix TS type for `topRecomendaciones` — no backend change |
| B2 | `model/Usuario.java` ~L63 | Add `@JsonIgnore` on `password` field |
| B3 | `model/Proyecto.java` | Add `creadoEn LocalDateTime` + `@PrePersist`; use `columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"` |
| B3 | `model/dto/ProyectoDTO.java` | Add `creadoEn LocalDateTime` field |
| B3 | `ProyectoService.java` (mapper) | `dto.setCreadoEn(proyecto.getCreadoEn())` |
| B4 | `model/dto/ConvocatoriaPublicaDTO.java` | Add `tipo String` field |
| B4 | Mapper/service for ConvocatoriaPublicaDTO | `dto.setTipo(conv.getTipo())` |

### Phase 2 — Important (during UI build)

| # | Change |
|---|--------|
| P2-1 | `RecomendacionDTO.java`: add `organismo`, `presupuesto`, `fechaPublicacion` + mapper |
| P2-2 | `PerfilController.java`: new `GET /api/usuario/perfil/completo` endpoint |
| P2-3 | `Perfil.java` + `PerfilDTO.java`: add nullable `nombre` field (max 100) |
| P2-4 | `/api/usuario/convocatorias/recomendadas`: wrap in page response |

### Phase 3 — Enhancement (after initial release)

| # | Change |
|---|--------|
| P3-1 | `GET /api/admin/convocatorias`: add `q`, `sector`, `abierto`, `organismo`, `sort` filters |
| P3-2 | `GET /api/admin/stats`: richer stats with `totalConvocatoriasAbiertas`, `usuariosPremium` |
| P3-3 | Admin user list/detail: expose `plan` field |
| P3-4 | `GET /api/convocatorias/publicas/buscar`: add `abierto` boolean filter |

---

## 5. Cross-Cutting Concerns

### Error Handling Pattern

```typescript
if (loading) return <SkeletonPage />;
if (error) return <ErrorState message={error} retry={fetchData} />;
if (!data) return <EmptyState />;
return <Content data={data} />;
```

API interceptor (`src/lib/api.ts`): `401` → clear cookie + redirect `/login`, `403` → toast, `404` → empty state, `429` → toast with countdown, `5xx` → error toast.

### Accessibility

- Focus trap in modals (restore on close)
- `aria-label` on icon-only buttons (`Eliminar proyecto ${name}`)
- Score badges: `aria-label="Puntuación: 85 sobre 100"`
- Nav active items: `aria-current="page"`
- `role="alert"` on toasts (already implemented)
- Escape closes modals
- All interactive elements reachable via Tab

### WCAG AA Verification

| Combination | Contrast | Status |
|-------------|----------|--------|
| `#005a71` on `#ffffff` | ~7.2:1 | ✓ Pass |
| `#191c1e` on `#f7f9fb` | ~18:1 | ✓ Pass |
| `#3f484c` on `#f2f4f6` | ~6.1:1 | ✓ Pass |
| `#005f40` on `#eceef0` | ~verify | Check with WebAIM |
| `#ba1a1a` on `#ffdad6` | ~4.6:1 | Borderline — verify |
