# Angular Component Patterns

Patrones para crear componentes Angular 21 modernos con signals, OnPush y accesibilidad.

---

## Estructura base

```typescript
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './component.html',
})
export class MyComponent { }
```

- **NO** escribir `standalone: true` — es el default en Angular 21
- Siempre `ChangeDetectionStrategy.OnPush`
- Paths de template/styles relativos al archivo `.ts`

---

## Signal Inputs

```typescript
// Requerido
name = input.required<string>();

// Opcional con default
count = input(0);

// Opcional sin default
label = input<string>();

// Con alias
size = input('medium', { alias: 'buttonSize' });

// Con transform
disabled = input(false, { transform: booleanAttribute });
```

---

## Signal Outputs

```typescript
clicked = output<void>();
selected = output<Item>();
valueChange = output<number>({ alias: 'change' });

// Emitir
this.clicked.emit();
this.selected.emit(item);
```

---

## Host Bindings (via objeto `host`)

Nunca usar `@HostBinding` ni `@HostListener`.

```typescript
@Component({
  host: {
    // Atributos estáticos
    'role': 'button',
    // Clases dinámicas
    '[class.active]': 'isActive()',
    // CSS custom properties
    '[style.--btn-color]': 'color()',
    // ARIA
    '[attr.aria-disabled]': 'disabled()',
    // Eventos
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onClick($event)',
  }
})
```

---

## Content Projection

```html
<!-- Definición -->
<ng-content select="[card-header]" />
<ng-content />
<ng-content select="[card-footer]" />
```

```html
<!-- Uso -->
<app-card>
  <h2 card-header>Título</h2>
  <p>Contenido</p>
</app-card>
```

---

## Control Flow nativo

```html
<!-- Condicionales -->
@if (isLoading()) {
  <p-progressSpinner />
} @else if (hasError()) {
  <p>Error al cargar</p>
} @else {
  <div>Contenido</div>
}

<!-- Listas — siempre con track -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>Sin resultados</p>
}

<!-- Switch -->
@switch (status()) {
  @case ('active') { <span>Activo</span> }
  @case ('inactive') { <span>Inactivo</span> }
  @default { <span>Desconocido</span> }
}
```

---

## Estado con Signals

```typescript
// Estado local
count = signal(0);

// Estado derivado
double = computed(() => this.count() * 2);

// Actualizar — nunca mutate()
this.count.set(5);
this.count.update(v => v + 1);
```

---

## Lifecycle Hooks

- `afterNextRender()` — una vez tras el primer render (SSR-safe), reemplaza `ngAfterViewInit` para DOM manipulation
- `afterRender()` — tras cada render
- `ngOnInit` / `ngOnDestroy` — ciclo de vida tradicional cuando aplique

---

## Imágenes optimizadas

```typescript
imports: [NgOptimizedImage]
```

```html
<img ngSrc="/assets/hero.jpg" width="800" height="600" priority />
```

No usar con imágenes base64.

---

## Accesibilidad (obligatorio — WCAG AA)

Todo componente interactivo debe:
- Pasar checks de AXE
- Tener atributos ARIA apropiados
- Soportar navegación por teclado (Tab, Enter, Space)
- Mantener focus visible

```typescript
// Ejemplo: toggle accesible
host: {
  'role': 'switch',
  '[attr.aria-checked]': 'checked()',
  '[attr.aria-label]': 'label()',
  'tabindex': '0',
  '(click)': 'toggle()',
  '(keydown.enter)': 'toggle()',
  '(keydown.space)': 'toggle(); $event.preventDefault()',
}
```
