import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Ciudad } from '../models/promocion.model';

@Injectable({ providedIn: 'root' })
export class CiudadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ciudades`;

  getAll(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(this.apiUrl);
  }
}
