# promo-web — Frontend Angular 21

> **Terminología UI:** El negocio usa "planes" (no "promociones/promos") en todo texto visible al usuario.
> Los nombres de archivos, clases, variables y componentes mantienen "promo/Promo/promocion" internamente,
> pero labels, títulos, placeholders, aria-labels y mensajes deben usar "plan/planes".

## Stack
| Tecnología | Uso |
|---|---|
| Angular 21 | Framework principal |
| PrimeNG | Librería UI principal |
| Tailwind CSS | Estilos complementarios y layout responsive |
| Heroicons | Set de Iconos |
| NgRx Signals | State management global |
| Leaflet + OpenStreetMap | Mapas interactivos |
| TypeScript (strict) | Tipado estricto |

## Estructura del proyecto
```
promo-web/src/app/
├── core/ 
│   ├── interceptors/        ← auth, error handling
│   ├── guards/
│   └── services/            ← servicios singleton globales
├── shared/
│   └── components/          ← componentes reutilizables globales
├── store/                   ← NgRx Signal Store global
│   └── {feature}/
│       └── {feature}.store.ts
└── features/
    └── {feature}/
        ├── pages/
        │   ├── {feature}-list/
        │   └── {feature}-form/
        ├── components/
        ├── {feature}.service.ts
        ├── {feature}.model.ts
        └── {feature}.routes.ts
```

## Comandos
```bash
ng serve              # dev en http://localhost:4200
ng build              # build producción
ng test               # tests unitarios
ng generate component features/{feature}/pages/{nombre} --skip-import
```

## URL del backend
```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:5000'
};
```
---

## Reglas de TypeScript

- Usar strict mode siempre (`strict: true` en tsconfig)
- Preferir inferencia de tipos cuando el tipo es obvio
- Nunca usar `any` — usar `unknown` cuando el tipo es incierto
- Tipar explícitamente los retornos de funciones públicas

# Paths e Imports
- Configurar el tsconfig para manejo de imports
- core    → @core
- shared  → @shared
- store   → @store
---

## Reglas de Angular (críticas)

- Siempre **standalone components** — Angular 21 lo usa por defecto
- **NO** escribir `standalone: true` en el decorador — es el default en v20+
- `changeDetection: ChangeDetectionStrategy.OnPush` en **todos** los componentes
- Usar `input()` y `output()` en lugar de `@Input()` y `@Output()`
- Usar `inject()` en lugar de inyección por constructor
- Lazy loading en todas las rutas de features
- **NO** usar `@HostBinding` ni `@HostListener` — usar el objeto `host:` en el decorador
- Usar `NgOptimizedImage` para todas las imágenes estáticas (no funciona con base64)

---

## Reglas de Templates

- Usar control flow nativo: `@if`, `@for`, `@switch` — nunca `*ngIf`, `*ngFor`, `*ngSwitch`
- Usar `async` pipe para Observables
- **NO** usar `ngClass` — usar binding `[class]`
- **NO** usar `ngStyle` — usar binding `[style]`
- Templates simples — sin lógica compleja inline
- No asumir globals como `new Date()` disponibles en el template
- Rutas de templates/styles relativas al archivo `.ts` del componente

---

## Reglas de Estado

- Signals para estado local del componente
- `computed()` para estado derivado
- NgRx Signal Store para estado global compartido entre componentes
- **NO** usar `mutate()` en signals — usar `update()` o `set()`
- Transformaciones de estado puras y predecibles

---

## Reglas de UI

### PrimeNG
- Librería principal para todos los componentes de interfaz
- Usar componentes PrimeNG antes de crear uno custom
- Componentes frecuentes: `p-table`, `p-dialog`, `p-button`, `p-inputtext`, `p-dropdown`, `p-toast`, `p-confirmdialog`

### Tailwind CSS
- Complemento para layout, spacing, responsive y utilidades
- No duplicar lo que PrimeNG ya maneja (colores de botones, bordes de inputs)
- Usar para: grid layouts, márgenes, paddings, responsive breakpoints
- Priorizar SIEMPRE Tailwind contra Custom CSS Rules
- Usuar la libreria de iconos: Heroicons

### Responsive Design
- Mobile-first siempre
- Breakpoints Tailwind: `sm:` (640px) · `md:` (768px) · `lg:` (1024px) · `xl:` (1280px)
- Tablas PrimeNG: usar `[scrollable]="true"` con scroll horizontal en móvil
- No hardcodear anchos fijos — usar `w-full`, `max-w-*`, `flex`, `grid`

---

## Reglas de Accesibilidad (obligatorias)

- Debe pasar todos los checks de AXE
- Cumplir WCAG AA mínimo: contraste de color, focus management, ARIA
- Todo elemento interactivo con `aria-label` o texto visible
- Imágenes con `alt` descriptivo
- Formularios con `label` asociado a cada input
- Focus visible en todos los elementos interactivos

---

## Reglas de Servicios

- Un servicio por feature, `providedIn: 'root'`
- Responsabilidad única por servicio
- Usar `inject()` — nunca inyección por constructor
- Nunca suscribirse dentro del servicio — retornar `Observable<T>`

---

## Mapas (Leaflet + OpenStreetMap)

- Usar Leaflet para cualquier mapa interactivo
- Tiles de OpenStreetMap (gratuito, sin API key)
- Inicializar el mapa siempre en `ngAfterViewInit` — nunca en `ngOnInit`
- Destruir la instancia en `ngOnDestroy` para evitar memory leaks
- Ver skill completo: @promo-web/.claude/skills/maps.md

---

## Estructura de una feature completa

```
features/{feature}/
├── pages/
│   ├── {feature}-list/
│   │   ├── {feature}-list.component.ts   ← tabla PrimeNG + paginación
│   │   └── {feature}-list.component.html
│   └── {feature}-form/
│       ├── {feature}-form.component.ts   ← formulario reactivo PrimeNG
│       └── {feature}-form.component.html
├── {feature}.service.ts                  ← HttpClient, retorna Observable
├── {feature}.model.ts                    ← interfaces TypeScript
├── {feature}.store.ts                    ← NgRx Signal Store (si estado global)
└── {feature}.routes.ts                   ← lazy loading
```
