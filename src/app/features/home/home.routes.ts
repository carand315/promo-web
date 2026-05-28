import { Routes } from '@angular/router';

export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'categorias/:slug',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'mapa',
    loadComponent: () =>
      import('./pages/promo-mapa/promo-mapa.component').then(
        (m) => m.PromoMapaComponent
      ),
  },
  {
    path: 'promociones/:ciudadSlug/:promoSlug',
    loadComponent: () =>
      import('./pages/promo-detalle/promo-detalle.component').then(
        (m) => m.PromoDetalleComponent
      ),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
  {
    path: 'terminos-y-condiciones',
    loadComponent: () =>
      import('./pages/terminos/terminos.component').then(
        (m) => m.TerminosComponent
      ),
  },
];
