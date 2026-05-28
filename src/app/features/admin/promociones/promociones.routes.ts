import { Routes } from '@angular/router';

export const promocionesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/promociones-list/promociones-list.component').then(
        (m) => m.PromocionesListComponent
      ),
    data: {
      title: 'Planes',
      subtitle: 'Gestión de planes y ofertas',
    },
  },
];
