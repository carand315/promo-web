import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap, forkJoin } from 'rxjs';
import {
  Promocion,
  Categoria,
  Ciudad,
} from '../admin/promociones/models/promocion.model';
import { PromocionService } from '../admin/promociones/services/promocion.service';
import { CategoriaService } from '../admin/promociones/services/categoria.service';
import { CiudadService } from '../admin/promociones/services/ciudad.service';
import { toSlug } from './utils/slug.utils';
import { CategoriaConConteo } from './home.model';

const LS_KEY = 'buenplan_ciudad_seleccionada';

function isActiva(fechaHasta: string | null): boolean {
  if (!fechaHasta) return true;
  return new Date(fechaHasta) >= new Date();
}

function resolveCiudadInicial(ciudades: Ciudad[], isBrowser: boolean): number | null {
  if (isBrowser) {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const id = parseInt(saved, 10);
      if (ciudades.some((c) => c.id === id)) return id;
    }
  }
  return (
    ciudades.find((c) => c.nombre.toLowerCase().startsWith('bogot'))?.id ??
    ciudades[0]?.id ??
    null
  );
}

interface HomeState {
  promociones: Promocion[];
  categorias: Categoria[];
  ciudades: Ciudad[];
  ciudadId: number | null;
  loading: boolean;
  searchText: string;
  categoriaFiltroId: number | null;
  slugFiltroCategoria: string | null;
  descuentoMin: number;
  selectedPromoId: number | null;
  mostrarModalCiudad: boolean;
}

const initialState: HomeState = {
  promociones: [],
  categorias: [],
  ciudades: [],
  ciudadId: null,
  loading: true,
  searchText: '',
  categoriaFiltroId: null,
  slugFiltroCategoria: null,
  descuentoMin: 0,
  selectedPromoId: null,
  mostrarModalCiudad: false,
};

export const HomeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(
    ({
      promociones,
      categorias,
      ciudades,
      ciudadId,
      searchText,
      categoriaFiltroId,
      descuentoMin,
    }) => {
      const ciudadSeleccionada = computed(
        () => ciudades().find((c) => c.id === ciudadId()) ?? null
      );

      // Promos de la ciudad activa + no vencidas
      const promosDeCiudad = computed(() => {
        const cid = ciudadId();
        return promociones().filter(
          (p) =>
            isActiva(p.fechaHasta) &&
            (cid === null || !p.ciudadIds?.length || p.ciudadIds.includes(cid))
        );
      });

      // Promos destacadas para el carrusel
      const promoDestacadas = computed(() =>
        promosDeCiudad().filter((p) => p.destacada)
      );

      // Promos con todos los filtros aplicados (grid + mapa)
      const promosFiltradas = computed(() => {
        const text = searchText().toLowerCase();
        const catId = categoriaFiltroId();
        const minDesc = descuentoMin();

        return promosDeCiudad().filter((p) => {
          if (
            text &&
            !p.titulo.toLowerCase().includes(text) &&
            !p.marca.toLowerCase().includes(text)
          )
            return false;
          if (catId !== null && p.categoriaId !== catId) return false;
          if (p.descuento < minDesc) return false;
          return true;
        });
      });

      // Categorías con conteo de promos activas en la ciudad seleccionada
      const categoriasConConteo = computed<CategoriaConConteo[]>(() => {
        const promos = promosDeCiudad();
        return categorias().map((cat) => ({
          ...cat,
          totalPromociones: promos.filter((p) => p.categoriaId === cat.id).length,
        }));
      });

      // Total de promos en la ciudad (para el ítem "Todas")
      const totalPromosCiudad = computed(() => promosDeCiudad().length);

      // Nombre de la categoría activa (null si "Todas")
      const categoriaActivaNombre = computed<string | null>(() => {
        const id = categoriaFiltroId();
        if (id === null) return null;
        return categorias().find((c) => c.id === id)?.nombre ?? null;
      });

      return {
        ciudadSeleccionada,
        promosDeCiudad,
        promoDestacadas,
        promosFiltradas,
        categoriasConConteo,
        totalPromosCiudad,
        categoriaActivaNombre,
      };
    }
  ),

  withMethods(
    (
      store,
      promocionService = inject(PromocionService),
      categoriaService = inject(CategoriaService),
      ciudadService = inject(CiudadService),
      platformId = inject(PLATFORM_ID)
    ) => ({
      loadData: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            forkJoin({
              promociones: promocionService.getAll(),
              categorias: categoriaService.getAll(),
              ciudades: ciudadService.getAll(),
            }).pipe(
              tapResponse({
                next: ({ promociones, categorias, ciudades }) => {
                  const isBrowser = isPlatformBrowser(platformId);
                  const primeraVisita = isBrowser && !localStorage.getItem(LS_KEY);
                  const ciudadId = resolveCiudadInicial(ciudades, isBrowser);
                  // Resolver slug pendiente (si el componente lo seteó antes de que cargaran las categorías)
                  const slug = store.slugFiltroCategoria();
                  const categoriaFiltroId = slug
                    ? (categorias.find((c) => toSlug(c.nombre) === slug)?.id ?? null)
                    : null;
                  patchState(store, {
                    promociones,
                    categorias,
                    ciudades,
                    ciudadId,
                    categoriaFiltroId,
                    loading: false,
                    mostrarModalCiudad: primeraVisita,
                  });
                },
                error: () => patchState(store, { loading: false }),
              })
            )
          )
        )
      ),

      setCiudad(ciudadId: number | null): void {
        if (ciudadId !== null && isPlatformBrowser(platformId)) {
          localStorage.setItem(LS_KEY, String(ciudadId));
        }
        patchState(store, { ciudadId });
      },

      confirmarCiudadModal(ciudadId: number): void {
        if (isPlatformBrowser(platformId)) {
          localStorage.setItem(LS_KEY, String(ciudadId));
        }
        patchState(store, { ciudadId, mostrarModalCiudad: false });
      },

      cerrarModalCiudad(): void {
        patchState(store, { mostrarModalCiudad: false });
      },

      setSearch(searchText: string): void {
        patchState(store, { searchText });
      },

      setCategoria(categoriaFiltroId: number | null): void {
        patchState(store, { categoriaFiltroId, slugFiltroCategoria: null });
      },

      setCategoriaBySlug(slug: string | null): void {
        if (!slug) {
          patchState(store, { categoriaFiltroId: null, slugFiltroCategoria: null });
          return;
        }
        // Guardar el slug; si las categorías ya están cargadas, resolver id inmediatamente
        const cats = store.categorias();
        const categoriaFiltroId = cats.length
          ? (cats.find((c) => toSlug(c.nombre) === slug)?.id ?? null)
          : null;
        patchState(store, { slugFiltroCategoria: slug, categoriaFiltroId });
      },

      setDescuentoMin(descuentoMin: number): void {
        patchState(store, { descuentoMin });
      },

      selectPromo(id: number | null): void {
        patchState(store, { selectedPromoId: id });
      },
    })
  )
);
