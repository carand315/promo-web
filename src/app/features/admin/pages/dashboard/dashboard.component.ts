import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../../../environments/environment';
import {
  DashboardService,
  DashboardResumen,
  EstadoPromosDashboard,
  DiasDashboard,
} from '../../services/dashboard.service';

export interface PromoVisitaReporte {
  promoId: number;
  titulo: string;
  marca: string;
  imagenUrl: string | null;
  totalVisitas: number;
  visitasUltimos7Dias: number;
}

interface StatCard {
  title: string;
  value: string;
  trend: string;
  trendType: 'positive' | 'warning' | 'info' | 'neutral';
  iconBg: string;
  iconColor: string;
  icon: string;           // Material Symbols name
  accentColor: string;    // inline color for the accent bar
}

interface DiaSemana {
  label: string;
  promos: number;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);

  // ── Estado ──────────────────────────────────────────────────────────────────
  loading = signal(true);
  resumen = signal<DashboardResumen | null>(null);

  topPromos = signal<PromoVisitaReporte[]>([]);
  loadingVisitas = signal(true);

  // ── KPI Cards ────────────────────────────────────────────────────────────────
  statCards = computed<StatCard[]>(() => {
    const r = this.resumen();
    if (!r) return this.placeholderCards();

    const k = r.kpis;

    // Tendencia: % de variación en nuevas promos mes actual vs anterior
    const tendenciaTotal = this.calcTendenciaMes(k.nuevasEsteMes, k.nuevasMesAnterior);

    return [
      {
        title:       'Planes totales',
        value:       String(k.totalPromos),
        trend:       tendenciaTotal.texto,
        trendType:   tendenciaTotal.tipo,
        iconBg:      'bg-red-50',
        iconColor:   'text-red-400',
        icon:        'local_offer',
        accentColor: '#f87171',
      },
      {
        title:       'Activas',
        value:       String(k.promoActivas),
        trend:       k.promoActivas > 0 ? `${k.promoActivas} en curso` : 'Sin planes activos',
        trendType:   k.promoActivas > 0 ? 'positive' : 'neutral',
        iconBg:      'bg-green-50',
        iconColor:   'text-green-500',
        icon:        'check_circle',
        accentColor: '#4ade80',
      },
      {
        title:       'Vencen pronto (7 días)',
        value:       String(k.promoAVencer),
        trend:       k.promoAVencer > 0 ? 'Requiere atención' : 'Sin vencimientos próximos',
        trendType:   k.promoAVencer > 0 ? 'warning' : 'positive',
        iconBg:      'bg-orange-50',
        iconColor:   'text-orange-400',
        icon:        'timer',
        accentColor: '#fb923c',
      },
      {
        title:       'Descuento promedio',
        value:       `${Math.round(k.descuentoPromedio)}%`,
        trend:       tendenciaTotal.texto,
        trendType:   'info',
        iconBg:      'bg-blue-50',
        iconColor:   'text-blue-400',
        icon:        'percent',
        accentColor: '#60a5fa',
      },
    ];
  });

  // ── Computed para categorías ─────────────────────────────────────────────────
  promosPorCategoria = computed(() => this.resumen()?.promosPorCategoria ?? []);

  maxCategoria = computed(() =>
    Math.max(1, ...this.promosPorCategoria().map(c => c.totalPromos))
  );

  // ── Computed para ciudades ───────────────────────────────────────────────────
  topCiudades = computed(() => this.resumen()?.topCiudades ?? []);

  // ── Computed para donut ──────────────────────────────────────────────────────
  estadoPromos = computed(() => this.resumen()?.estadoPromos ?? { activas: 0, porVencer: 0, vencidas: 0, total: 0 });

  donutSegments = computed(() => {
    const e = this.estadoPromos();
    const total = e.total || 1;
    const activasPct   = (e.activas   / total) * 100;
    const porVencerPct = (e.porVencer / total) * 100;
    const vencidasPct  = (e.vencidas  / total) * 100;
    return {
      activasArr:   `${activasPct.toFixed(1)} ${(100 - activasPct).toFixed(1)}`,
      porVencerArr: `${porVencerPct.toFixed(1)} ${(100 - porVencerPct).toFixed(1)}`,
      vencidasArr:  `${vencidasPct.toFixed(1)} ${(100 - vencidasPct).toFixed(1)}`,
      porVencerOffset: `-${activasPct.toFixed(1)}`,
      vencidasOffset:  `-${(activasPct + porVencerPct).toFixed(1)}`,
      activasPct:   Math.round(activasPct),
      porVencerPct: Math.round(porVencerPct),
      vencidasPct:  Math.round(vencidasPct),
    };
  });

  // ── Computed para días semana ────────────────────────────────────────────────
  diasSemana = computed<DiaSemana[]>(() => {
    const d = this.resumen()?.promosPorDia;
    if (!d) return [];
    return [
      { label: 'LUN', promos: d.lunes },
      { label: 'MAR', promos: d.martes },
      { label: 'MIÉ', promos: d.miercoles },
      { label: 'JUE', promos: d.jueves },
      { label: 'VIE', promos: d.viernes },
      { label: 'SÁB', promos: d.sabado },
      { label: 'DOM', promos: d.domingo },
    ];
  });

  maxPromosDia = computed(() =>
    Math.max(1, ...this.diasSemana().map(d => d.promos))
  );

  // ── Computed para descuento por categoría ────────────────────────────────────
  descuentoPorCategoria = computed(() => this.resumen()?.descuentoPorCategoria ?? []);

  // Expuesto para uso en template
  protected readonly Math = Math;

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.dashboardService.getResumen()
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        this.resumen.set(data);
        this.loading.set(false);
      });

    this.http
      .get<PromoVisitaReporte[]>(`${environment.apiUrl}/visitas/reporte?top=5`)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.topPromos.set(data);
        this.loadingVisitas.set(false);
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  barWidth(count: number, max: number): string {
    return `${(count / Math.max(1, max)) * 100}%`;
  }

  barHeight(count: number): string {
    return `${(count / this.maxPromosDia()) * 100}%`;
  }

  maxVisitas(): number {
    const promos = this.topPromos();
    return promos.length ? Math.max(...promos.map(p => p.totalVisitas)) : 1;
  }

  tendencia(p: PromoVisitaReporte): 'up' | 'stable' {
    if (!p.totalVisitas) return 'stable';
    return p.visitasUltimos7Dias / p.totalVisitas >= 0.3 ? 'up' : 'stable';
  }

  private calcTendenciaMes(
    esteMes: number,
    mesAnterior: number
  ): { texto: string; tipo: 'positive' | 'warning' | 'info' | 'neutral' } {
    if (mesAnterior === 0) {
      return esteMes > 0
        ? { texto: `+${esteMes} este mes`, tipo: 'positive' }
        : { texto: 'Sin cambios', tipo: 'neutral' };
    }
    const pct = Math.round(((esteMes - mesAnterior) / mesAnterior) * 100);
    if (pct > 0)  return { texto: `+${pct}% este mes`, tipo: 'positive' };
    if (pct < 0)  return { texto: `${pct}% este mes`, tipo: 'warning' };
    return { texto: 'Sin variación', tipo: 'neutral' };
  }

  private placeholderCards(): StatCard[] {
    return [
      { title: 'Promociones totales', value: '—', trend: '', trendType: 'neutral', iconBg: 'bg-red-50', iconColor: 'text-red-400', icon: 'local_offer', accentColor: '#f87171' },
      { title: 'Activas',             value: '—', trend: '', trendType: 'neutral', iconBg: 'bg-green-50', iconColor: 'text-green-500', icon: 'check_circle', accentColor: '#4ade80' },
      { title: 'Vencen pronto',       value: '—', trend: '', trendType: 'neutral', iconBg: 'bg-orange-50', iconColor: 'text-orange-400', icon: 'timer', accentColor: '#fb923c' },
      { title: 'Descuento promedio',  value: '—', trend: '', trendType: 'neutral', iconBg: 'bg-blue-50', iconColor: 'text-blue-400', icon: 'percent', accentColor: '#60a5fa' },
    ];
  }
}
