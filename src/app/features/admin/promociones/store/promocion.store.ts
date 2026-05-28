import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { Promocion, Categoria, Ciudad } from '../models/promocion.model';
import { PromocionService } from '../services/promocion.service';
import { CategoriaService } from '../services/categoria.service';
import { CiudadService } from '../services/ciudad.service';

interface PromocionState {
  promociones: Promocion[];
  categorias: Categoria[];
  ciudades: Ciudad[];
  selectedPromocion: Promocion | null;
  drawerVisible: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: PromocionState = {
  promociones: [],
  categorias: [],
  ciudades: [],
  selectedPromocion: null,
  drawerVisible: false,
  loading: false,
  saving: false,
  error: null,
};

export const PromocionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ promociones, categorias, ciudades }) => ({
    totalPromociones: computed(() => promociones().length),
    categoriasOptions: computed(() =>
      categorias().map((c) => ({ label: c.nombre, value: c.id }))
    ),
    ciudadesOptions: computed(() =>
      ciudades().map((c) => ({ label: `${c.nombre} — ${c.departamento}`, value: c.id }))
    ),
  })),

  withMethods(
    (
      store,
      promocionService = inject(PromocionService),
      categoriaService = inject(CategoriaService),
      ciudadService = inject(CiudadService)
    ) => ({
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            promocionService.getAll().pipe(
              tapResponse({
                next: (promociones) =>
                  patchState(store, { promociones, loading: false }),
                error: (err: Error) =>
                  patchState(store, { error: err.message, loading: false }),
              })
            )
          )
        )
      ),

      loadCategorias: rxMethod<void>(
        pipe(
          switchMap(() =>
            categoriaService.getAll().pipe(
              tapResponse({
                next: (categorias) => patchState(store, { categorias }),
                error: () => {},
              })
            )
          )
        )
      ),

      loadCiudades: rxMethod<void>(
        pipe(
          switchMap(() =>
            ciudadService.getAll().pipe(
              tapResponse({
                next: (ciudades) => patchState(store, { ciudades }),
                error: () => {},
              })
            )
          )
        )
      ),

      openDrawer(promocion: Promocion | null = null): void {
        patchState(store, { selectedPromocion: promocion, drawerVisible: true });
      },

      closeDrawer(): void {
        patchState(store, { selectedPromocion: null, drawerVisible: false });
      },

      setSaving(saving: boolean): void {
        patchState(store, { saving });
      },

      addOrUpdate(promocion: Promocion): void {
        const list = store.promociones();
        const idx = list.findIndex((p) => p.id === promocion.id);
        if (idx >= 0) {
          const updated = [...list];
          updated[idx] = promocion;
          patchState(store, { promociones: updated });
        } else {
          patchState(store, { promociones: [promocion, ...list] });
        }
        patchState(store, { drawerVisible: false, selectedPromocion: null, saving: false });
      },

      remove(id: number): void {
        patchState(store, {
          promociones: store.promociones().filter((p) => p.id !== id),
        });
      },
    })
  )
);
