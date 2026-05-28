import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes, RenderMode, PrerenderFallback } from '@angular/ssr';
import { appConfig } from './app.config';

const CATEGORY_SLUGS = [
  'restaurantes', 'ropa', 'cine', 'farmacias', 'belleza',
  'tecnologia', 'deportes', 'cafeterias', 'viajes',
  'hogar', 'carros', 'supermercados', 'mascotas',
];

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes([
        { path: '', renderMode: RenderMode.Prerender },
        { path: 'mapa', renderMode: RenderMode.Prerender },
        {
          path: 'categorias/:slug',
          renderMode: RenderMode.Prerender,
          fallback: PrerenderFallback.Client,
          async getPrerenderParams() {
            return CATEGORY_SLUGS.map(slug => ({ slug }));
          },
        },
        { path: 'promociones/:ciudadSlug/:promoSlug', renderMode: RenderMode.Client },
        { path: 'admin', renderMode: RenderMode.Client },
        { path: '**', renderMode: RenderMode.Client },
      ])
    ),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
