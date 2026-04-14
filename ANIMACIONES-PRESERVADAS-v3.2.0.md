# Preservación de Animaciones v3.2.0 — Guía de Uso

## 📋 Resumen

Se han **preservado y migrado** todas las animaciones de la versión **v3.2.0** (Stepper Visual + Timeline Guía de Solicitud) al nuevo sistema **Framer Motion** del frontend. Ninguna animación se perdió.

---

## 🎬 Animaciones Preservadas

### 1. **fadeInPaso** (50ms escalonada)
Aparición progresiva de cada paso con 50ms de delay entre uno y otro.

```typescript
// src/lib/motion.ts
export const fadeInPaso: Variants = {
  hidden:  { opacity: 0, y: 4 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.05, duration: 0.3, ease: "easeOut" },
  }),
  exit:    { opacity: 0, y: -4, transition: { duration: 0.2 } },
};
```

**Uso:**
```tsx
<motion.div
  variants={fadeInPaso}
  custom={0}  // 0 = 0ms, 1 = 50ms, 2 = 100ms, ...
  initial="hidden"
  animate="visible"
/>
```

---

### 2. **stepperFlow** (contenedor horizontal)
Stepper con 8 nodos conectados (🏛️ Portal → 📄 Requisitos → ... → ⚠️ Advertencias).

```typescript
export const stepperFlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};
```

**Uso:**
```tsx
<motion.div variants={stepperFlow} initial="hidden" animate="visible">
  {pasos.map((paso, idx) => (
    <motion.div key={paso.id} variants={stepperStep}>
      {paso.icon}
    </motion.div>
  ))}
</motion.div>
```

---

### 3. **stepperStep** (item en stepper)
Nodo individual con scale y entrada suave.

```typescript
export const stepperStep: Variants = {
  hidden:  { opacity: 0, scale: 0.9, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", ... } },
};
```

---

### 4. **guiaTimeline** (contenedor vertical)
Timeline con 8 pasos animados secuencialmente.

```typescript
export const guiaTimeline: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};
```

---

### 5. **guiaPaso** (item en timeline)
Paso individual con entrada desde la izquierda.

```typescript
export const guiaPaso: Variants = {
  hidden:  { opacity: 0, x: -12, y: 4 },
  visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.35, ... } },
};
```

---

## 🎨 Estilos CSS Preservados

Archivo: `src/styles/stepper-guia.css`

Clases incluidas:

| Clase | Propósito |
|-------|-----------|
| `.stepper-flow` | Contenedor horizontal |
| `.stepper-step` | Nodo del stepper |
| `.stepper-icon` | Icono circular del nodo |
| `.stepper-label` | Etiqueta bajo el nodo |
| `.stepper-connector` | Línea conectora entre nodos |
| `.guia-timeline` | Contenedor vertical |
| `.guia-paso` | Item individual de timeline |
| `.guia-paso-icon` | Icono del paso |
| `.guia-paso-content` | Contenido (título + texto) |
| `.guia-paso-title` | Título del paso |
| `.guia-paso-text` | Descripción del paso |

**8 Esquemas de Color** (uno por paso):

```css
/* PASO 1: Verde oscuro (#005f40) */
.guia-paso[data-step="1"] { --paso-color: #005f40; }

/* PASO 2: Azul marino (#003d66) */
.guia-paso[data-step="2"] { --paso-color: #003d66; }

/* PASO 3: Teal (#00695c) */
.guia-paso[data-step="3"] { --paso-color: #00695c; }

/* PASO 4: Azul medio (#1565c0) */
.guia-paso[data-step="4"] { --paso-color: #1565c0; }

/* PASO 5: Púrpura (#6a1b9a) */
.guia-paso[data-step="5"] { --paso-color: #6a1b9a; }

/* PASO 6: Naranja (#e65100) */
.guia-paso[data-step="6"] { --paso-color: #e65100; }

/* PASO 7: Oro (#b8860b) */
.guia-paso[data-step="7"] { --paso-color: #b8860b; }

/* PASO 8: Rojo (#c62828) */
.guia-paso[data-step="8"] { --paso-color: #c62828; }
```

---

## 🔧 Componente React Reutilizable

Archivo: `src/components/StepperGuia.tsx`

### Uso Básico

```tsx
import { StepperGuia, PASOS_GUIA_DEFECTO } from "@/components/StepperGuia";

// Stepper horizontal
<StepperGuia pasos={PASOS_GUIA_DEFECTO} variant="stepper" />

// Timeline vertical
<StepperGuia pasos={PASOS_GUIA_DEFECTO} variant="timeline" />
```

### Uso Personalizado

```tsx
const misPasos = [
  {
    numero: 1,
    icon: "📄",
    titulo: "REQUISITOS",
    contenido: "Cumple requisitos...",
    estado: "completed",
  },
  // ... 7 pasos más
];

<StepperGuia pasos={misPasos} variant="timeline" />
```

### Propiedades

```typescript
interface GuiaStep {
  numero: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;    // 1-8
  icon: string;                              // emoji ej: "📄"
  titulo: string;                            // Ej: "REQUISITOS LEGALES"
  contenido: string;                         // Descripción del paso
  estado?: "completed" | "active" | "pending";
}

interface StepperGuiaProps {
  pasos: GuiaStep[];
  variant?: "stepper" | "timeline";
}
```

---

## 📱 Ejemplo Completo

```tsx
import { ModalGuiaCompleta } from "@/components/StepperGuia";

export default function PaginaRecomendaciones() {
  const [mostrarGuia, setMostrarGuia] = React.useState(false);

  return (
    <>
      <button onClick={() => setMostrarGuia(true)}>
        📋 Ver Guía Completa
      </button>

      {mostrarGuia && <ModalGuiaCompleta />}
    </>
  );
}
```

---

## 🚀 Integración con Páginas Existentes

### En `src/app/proyectos/[id]/recomendaciones/page.tsx`

```tsx
import { StepperGuia, PASOS_GUIA_DEFECTO } from "@/components/StepperGuia";

export default function RecomendacionesPage() {
  return (
    <div>
      {/* Tarjetas de recomendaciones */}
      <TarjetaRecomendacion 
        rec={rec}
        onVerGuia={() => {
          // Abre modal con StepperGuia
        }}
      />
    </div>
  );
}
```

---

## ♿ Accesibilidad

Ambos archivos respetan **WCAG AA** y `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .guia-paso {
    animation: none;
  }
}
```

---

## 📊 Comparativa v3.2.0 → v4.7.0+

| Característica | v3.2.0 | v4.7.0+ |
|---|---|---|
| **Motor de animación** | CSS puro + vanilla JS | Framer Motion |
| **fadeInPaso** | `@keyframes` CSS | `fadeInPaso` Variants |
| **Stepper** | HTML manual + CSS | `StepperGuia` component |
| **Timeline** | HTML manual + CSS | `StepperGuia` component |
| **Estados** | classes | `data-step` + CSS vars |
| **Responsive** | Media queries CSS | Tailwind + CSS grid |
| **A11y** | prefers-reduced-motion | prefers-reduced-motion |
| **Reutilizable** | No (HTML estático) | Sí (React component) |

---

## ✅ Checklist de Migración

- [x] Animaciones v3.2.0 importadas a `src/lib/motion.ts`
- [x] Estilos CSS preservados en `src/styles/stepper-guia.css`
- [x] Componente React reutilizable (`StepperGuia.tsx`)
- [x] 8 pasos de guía predefinidos
- [x] 8 esquemas de color diferenciados
- [x] Respeto a `prefers-reduced-motion`
- [x] Responsive mobile
- [x] Documentación completa

---

## 🔗 Referencias

- **Archivo Framer Motion:** `src/lib/motion.ts`
- **Estilos CSS:** `src/styles/stepper-guia.css`
- **Componente React:** `src/components/StepperGuia.tsx`
- **Changelog v3.2.0:** `docs/05-changelog.md` (líneas ~430-473)

---

**Nota:** Todas las animaciones están **100% preservadas** y migradas al nuevo sistema Framer Motion. No se perdió ninguna funcionalidad.

