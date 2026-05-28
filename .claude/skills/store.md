# NgRx Signal Store — Estado Global

Patrones para estado global con NgRx Signal Store en Angular 21.

---

## Cuándo usar NgRx Signal Store

- Estado compartido entre múltiples componentes no relacionados en el árbol
- Estado que debe persistir al navegar entre rutas
- Lógica compleja de estado con múltiples acciones

Para estado local de un componente, usar `signal()` directamente.

---

## Estructura base

```typescript
// features/products/products.store.ts
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap } from 'rxjs';

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  selectedId: null,
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ products, selectedId }) => ({
    selectedProduct: computed(() =>
      products().find(p => p.id === selectedId()) ?? null
    ),
    totalCount: computed(() => products().length),
  })),

  withMethods((store, productsService = inject(ProductsService)) => ({
    loadAll: rxMethod<void>(
      pipe(
        switchMap(() => {
          patchState(store, { loading: true, error: null });
          return productsService.getAll().pipe(
            tapResponse({
              next: products => patchState(store, { products, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          );
        })
      )
    ),

    selectProduct(id: number): void {
      patchState(store, { selectedId: id });
    },

    clearSelection(): void {
      patchState(store, { selectedId: null });
    },
  }))
);
```

---

## Uso en componentes

```typescript
@Component({
  selector: 'app-products-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class ProductsListComponent implements OnInit {
  private store = inject(ProductsStore);

  // Exponer señales del store al template
  products = this.store.products;
  loading = this.store.loading;
  error = this.store.error;
  total = this.store.totalCount;

  ngOnInit(): void {
    this.store.loadAll();
  }

  select(id: number): void {
    this.store.selectProduct(id);
  }
}
```

---

## patchState — actualizar estado

```typescript
// Siempre usar patchState, nunca mutar directamente
patchState(store, { loading: true });
patchState(store, { products: newProducts, loading: false });
patchState(store, state => ({ products: [...state.products(), newItem] }));
```

---

## withFeature — stores por feature (scope de ruta)

```typescript
// En las rutas, proveer el store con scope de ruta si no debe ser global
export const routes: Routes = [{
  path: 'products',
  providers: [ProductsStore],  // sin providedIn: 'root'
  loadComponent: () => import('./pages/products-list/products-list.component')
    .then(m => m.ProductsListComponent),
}];
```

---

## Signals en componentes (estado local)

```typescript
import { signal, computed, effect } from '@angular/core';

@Component({ ... })
export class MyComponent {
  // Estado local
  count = signal(0);
  search = signal('');

  // Derivado
  doubleCount = computed(() => this.count() * 2);
  hasSearch = computed(() => this.search().length > 0);

  // Actualizar
  increment(): void {
    this.count.update(v => v + 1);  // nunca mutate()
  }

  reset(): void {
    this.count.set(0);
  }
}
```

---

## linkedSignal — estado dependiente con reset

```typescript
// Se resetea automáticamente cuando cambia la fuente
options = signal(['A', 'B', 'C']);
selected = linkedSignal(() => this.options()[0]);
// Si options cambia, selected vuelve al primer elemento
```

---

## effect — efectos secundarios

```typescript
constructor() {
  // Debe ejecutarse en contexto de inyección
  effect(() => {
    console.log('Search changed:', this.search());
  });

  // Con cleanup
  effect((onCleanup) => {
    const timer = setInterval(() => this.tick(), 1000);
    onCleanup(() => clearInterval(timer));
  });
}
```

---

## RxJS ↔ Signals interop

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable → Signal
users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });

// Signal → Observable (para pipes RxJS)
search$ = toObservable(this.search);
results$ = this.search$.pipe(
  debounceTime(300),
  switchMap(q => this.service.search(q))
);
```
