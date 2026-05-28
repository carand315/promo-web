# Angular Services — HTTP & Dependency Injection

Patrones para servicios HttpClient y DI en Angular 21.

---

## Estructura base de un servicio

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/feature`;

  getAll(): Observable<Feature[]> {
    return this.http.get<Feature[]>(this.apiUrl);
  }

  getById(id: number): Observable<Feature> {
    return this.http.get<Feature>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateFeatureDto): Observable<Feature> {
    return this.http.post<Feature>(this.apiUrl, data);
  }

  update(id: number, data: UpdateFeatureDto): Observable<Feature> {
    return this.http.put<Feature>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Reglas:**
- Un servicio por feature, `providedIn: 'root'`
- Usar `inject()` — nunca inyección por constructor
- Nunca suscribirse dentro del servicio — retornar `Observable<T>`
- Tipar explícitamente todos los retornos públicos

---

## HttpClient con parámetros

```typescript
getList(filters: ListFilters): Observable<PagedResult<Feature>> {
  const params = new HttpParams()
    .set('page', filters.page)
    .set('size', filters.size)
    .set('search', filters.search ?? '');

  return this.http.get<PagedResult<Feature>>(this.apiUrl, { params });
}
```

---

## httpResource() — alternativa signal-based (Angular 21)

Para datos reactivos que se refrescan automáticamente al cambiar señales:

```typescript
// En el componente
userId = input.required<number>();

userResource = httpResource(() => `/api/users/${this.userId()}`);

// Estado disponible
userResource.value()     // dato
userResource.isLoading() // boolean
userResource.error()     // error
userResource.status()    // 'idle' | 'loading' | 'resolved' | 'error'
userResource.reload()    // refrescar manualmente
```

```html
@switch (userResource.status()) {
  @case ('loading') { <p-progressSpinner /> }
  @case ('error') { <p>Error al cargar</p> }
  @case ('resolved') { <div>{{ userResource.value()?.name }}</div> }
}
```

> Usar `httpResource()` para lectura reactiva en componentes. Usar `HttpClient` en servicios para operaciones CRUD con lógica compartida.

---

## Interceptors funcionales

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // manejar 401, 403, 500...
      return throwError(() => error);
    })
  );
};
```

```typescript
// app.config.ts
provideHttpClient(
  withInterceptors([authInterceptor, errorInterceptor])
)
```

---

## Dependency Injection — Scopes

| Scope | Cuándo usarlo |
|---|---|
| `providedIn: 'root'` | Singleton global (la mayoría de servicios) |
| `providers` en componente | Estado aislado por instancia de componente |
| `providers` en ruta | Compartido dentro de un árbol de rutas |

---

## Injection Tokens

```typescript
// Para valores de configuración
export const API_URL = new InjectionToken<string>('API_URL');

// Proveer
{ provide: API_URL, useValue: environment.apiUrl }

// Inyectar
private apiUrl = inject(API_URL);
```

---

## Injection options

```typescript
// Opcional — retorna null si no existe
private service = inject(OptionalService, { optional: true });

// Solo en el injector del propio componente
private service = inject(SomeService, { self: true });

// Saltar el injector actual, buscar en padres
private service = inject(SomeService, { skipSelf: true });
```
