# Requirements: React UI/UX redesign with Framer Motion and backend alignment

## Problem Statement

The current Syntia web application suffers from **both visual inconsistency and poor UX flows**.
Users (professionals seeking public grants/convocatorias) encounter:
- Inconsistent colors, spacing, and component styles that feel unpolished and don't match the Stitch brand identity.
- Navigation and key-action flows that are confusing or require too many steps.
Both dimensions must be addressed together in this redesign.

## Acceptance Criteria

- [ ] Zero green instances remain in the codebase (backgrounds, borders, badges, buttons, states, focus rings)
- [ ] Brand colors applied consistently: logo primary color + Stitch blue accent across all components
- [ ] Framer Motion animations live: page transitions (AnimatePresence), micro-interactions (buttons, inputs, cards), loading skeletons
- [ ] All missing backend endpoints required by the new UI are identified and implemented (Phase 1) or planned (Phase 2)
- [ ] Design tokens defined in `src/styles/tokens.ts` with source comments (// extracted from logo, // extracted from docs/diseño stitch/)
- [ ] `src/lib/motion.ts` created with shared named animation variants (fadeIn, slideUp, slideIn, staggerChildren, springScale)
- [ ] WCAG AA contrast maintained on all text/background combinations
- [ ] Admin panel, ETL UI, and shared layout/navbar aligned with new design system

## Scope

### In Scope
- Full visual redesign of all existing pages and components
- Design token system (colors, spacing, radii, shadows, typography)
- Framer Motion integration (page transitions, micro-interactions, loading states)
- Shared layout components: Navbar, Sidebar, Footer
- User-facing pages: Dashboard, Proyectos, Recomendaciones, Perfil
- Admin panel pages
- ETL/BDNS import UI touches
- Backend gap analysis and Phase 1 endpoint implementation
- Tailwind v4 configuration aligned with new tokens

### Out of Scope
- New app features or routes (redesign only)
- Native mobile app
- Auth flows (login, register, password reset pages)
- Backend logic refactoring — only add missing endpoints

## Technical Constraints

- Must stay on **Next.js App Router** structure (no Pages Router migration)
- **No CSS-in-JS** — Tailwind CSS / CSS modules only; no styled-components or emotion
- **JWT auth untouched** — existing `syntia_token` cookie + Spring Security JWT stays as-is
- **Spring Boot REST only** — no GraphQL, no new runtimes on the backend

## Technology Stack

- **Frontend**: Next.js 16.2.0 + React 19.2.4 + TypeScript
- **Styling**: Tailwind CSS v4 + CSS modules (no CSS-in-JS)
- **Animation**: Framer Motion v11.18.2 (already installed)
- **Forms**: react-hook-form v7 + zod v4
- **HTTP client**: Axios v1
- **Icons**: lucide-react
- **Backend**: Spring Boot (Java) + Spring Security + JWT
- **Database**: MySQL/PostgreSQL via Spring Data JPA
- **Auth**: JWT stateless, cookie `syntia_token`, claims: `sub` (email) + `rol`

## Dependencies

- Admin panel and ETL BDNS import UI require design alignment touches
- Shared layout (navbar, sidebar) must be updated first — it is a dependency for all pages
- Auth pages are excluded from redesign but shared layout components (used in auth pages) may be touched
- Backend `RecomendacionController`, `ProyectoController`, `PerfilController`, `AdminController` may need new endpoints

## Configuration

- Stack: Next.js + Spring Boot (auto-detected)
- API Style: REST
- Complexity: complex