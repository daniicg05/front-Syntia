# Frontend Implementation: React UI/UX Redesign

> Branch: `feat/redesign-frontend` (no commits)

## Files Created

### Design System
- `src/styles/tokens.ts` — JS token constants (colors HSL, shadows, radii, typography, spacing, durations, easings)
- `src/app/globals.css` — complete CSS variable system `:root` + `.dark` + `@theme inline` (teal palette, zero green)

### Animation
- `src/lib/motion.ts` — 15 named Framer Motion variants + `reduceMotionVariants()` utility
- `src/hooks/useMotionVariants.ts` — `useReducedMotion()` integration hook

### TypeScript Types
- `src/lib/types/auth.ts` — `JwtPayload`, `LoginResponse`
- `src/lib/types/perfil.ts` — `PerfilDTO`, `PerfilCompletoDTO`
- `src/lib/types/proyecto.ts` — `ProyectoDTO` (with `creadoEn`)
- `src/lib/types/recomendacion.ts` — `RecomendacionDTO` (with Phase 2 optional fields)
- `src/lib/types/convocatoria.ts` — `ConvocatoriaPublicaDTO`, `ConvocatoriasPageResponse`, `ConvocatoriaAdminDTO`
- `src/lib/types/dashboard.ts` — `DashboardData` (correct array shape)
- `src/lib/types/admin.ts` — `AdminDashboardStats`, `AdminUsuarioListItem`, `AdminUsuarioDetalle`
- `src/lib/types/bdns.ts` — `ImportacionBdnsEstadoDTO`, `ResumenEjecucionDTO`, `SyncStateDTO`, `CoberturaDTO`
- `src/lib/types/guia.ts` — `GuiaSubvencionDTO`

### New Components
- `src/components/ui/Modal.tsx` — reusable animated modal (AnimatePresence + springScale, focus trap, Escape key)
- `src/components/ui/ErrorState.tsx` — animated error state with optional retry

## Files Modified

### Core Layout
- `src/app/layout.tsx` — `Fraunces` → `Manrope`, `themeColor` updated to `#f7f9fb`
- `src/app/template.tsx` — replaced with `AnimatePresence` + `pageTransition` (now the correct page transition host)

### UI Components (updated by background agent)
- `src/components/ui/Button.tsx` — wrapped in `motion.button`, `whileTap`, `whileHover` for primary
- `src/components/ui/Badge.tsx` — added success/error/warning/plan/score variants
- `src/components/ui/Skeleton.tsx` — Framer Motion shimmer replacing CSS animation

### Bug Fixes
- `src/app/dashboard/page.tsx` — **B1 fixed**: `topRecomendaciones` type changed from `Record<string, RecomendacionDTO[]>` to `Array<{proyecto, recomendaciones}>`, render uses `.map()` not `Object.entries()`

### Green Removal (zero green remaining)
| File | Change |
|------|--------|
| `src/app/globals.css` | All `--primary`, `--accent-green` vars → teal palette |
| `src/app/layout.tsx` | `themeColor` updated |
| `src/components/ConvocatoriaCard.tsx` | MatchBadge, sector badge, "Abierta" badge → `text-success`/`bg-success-light` |
| `src/components/ui/Toast.tsx` | Success icon + background → `text-success`/`bg-success-light` |
| `src/app/home/page.tsx` | Sector Agrícola card → success tokens |

## Verification

```bash
# Run to confirm zero green remaining:
grep -rn "text-green\|bg-green\|border-green\|#16a34a" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Result: 0 matches.
