import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@environments/environment';

/**
 * Previene que los navegadores móviles (especialmente Safari iOS) cacheen
 * las respuestas GET de la API y muestren datos desactualizados.
 */
export const noCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET' && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
  }
  return next(req);
};
