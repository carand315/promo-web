import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface DashboardKpis {
  totalPromos: number;
  promoActivas: number;
  promoAVencer: number;
  descuentoPromedio: number;
  nuevasEsteMes: number;
  nuevasMesAnterior: number;
}

export interface CategoriaStatDashboard {
  categoriaId: number;
  categoriaNombre: string;
  categoriaIcono: string;
  categoriaColor: string;
  totalPromos: number;
}

export interface CiudadStatDashboard {
  ciudadId: number;
  ciudadNombre: string;
  totalPromos: number;
}

export interface EstadoPromosDashboard {
  activas: number;
  porVencer: number;
  vencidas: number;
  total: number;
}

export interface DiasDashboard {
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
}

export interface DescuentoCategoriaDashboard {
  categoriaNombre: string;
  categoriaColor: string;
  descuentoPromedio: number;
  totalPromos: number;
}

export interface DashboardResumen {
  kpis: DashboardKpis;
  promosPorCategoria: CategoriaStatDashboard[];
  topCiudades: CiudadStatDashboard[];
  estadoPromos: EstadoPromosDashboard;
  promosPorDia: DiasDashboard;
  descuentoPorCategoria: DescuentoCategoriaDashboard[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(this.apiUrl);
  }
}
