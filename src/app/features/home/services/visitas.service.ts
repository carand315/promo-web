import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppInsightsService } from '../../../core/services/app-insights.service';

interface VisitaMetadata {
  marca: string;
  categoria: string;
  ciudad: string;
}

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private http = inject(HttpClient);
  private appInsights = inject(AppInsightsService);
  private apiUrl = `${environment.apiUrl}/visitas`;

  registrar(promoId: number, metadata: VisitaMetadata): void {
    const sessionId = this.getOrCreateSessionId();

    // Fire-and-forget — los errores de analítica no deben interrumpir la UX
    this.http
      .post(this.apiUrl, { promoId, sessionId })
      .pipe(catchError(() => EMPTY))
      .subscribe();

    // Track en Azure Application Insights
    this.appInsights.trackEvent('promo_detail_view', {
      promoId: promoId.toString(),
      marca: metadata.marca,
      categoria: metadata.categoria,
      ciudad: metadata.ciudad,
    });
  }

  private getOrCreateSessionId(): string {
    const KEY = 'dhp_session_id';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  }
}
