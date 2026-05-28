import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/archivos`;

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http
      .post<{ url: string }>(this.apiUrl, formData)
      .pipe(map((res) => res.url));
  }
}
