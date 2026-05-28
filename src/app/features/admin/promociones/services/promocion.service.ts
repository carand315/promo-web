import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  Promocion,
  CrearPromocionRequest,
  ActualizarPromocionRequest,
} from '../models/promocion.model';

@Injectable({ providedIn: 'root' })
export class PromocionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/promociones`;

  getAll(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(this.apiUrl);
  }

  getById(id: number): Observable<Promocion> {
    return this.http.get<Promocion>(`${this.apiUrl}/${id}`);
  }

  create(data: CrearPromocionRequest): Observable<Promocion> {
    return this.http.post<Promocion>(this.apiUrl, data);
  }

  update(id: number, data: ActualizarPromocionRequest): Observable<Promocion> {
    return this.http.put<Promocion>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSimilares(id: number, ciudadId: number): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(`${this.apiUrl}/${id}/similares`, {
      params: { ciudadId: ciudadId.toString() },
    });
  }

  sincronizarCiudades(promocionId: number, ciudadIds: number[]): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${promocionId}/ciudades`,
      { ciudadIds }
    );
  }
}
