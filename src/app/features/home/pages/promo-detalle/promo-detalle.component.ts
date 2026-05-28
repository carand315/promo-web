import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  afterNextRender,
  ElementRef,
  viewChild,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, LowerCasePipe, isPlatformBrowser } from '@angular/common';
import type * as LType from 'leaflet';
import { PromocionService } from '../../../admin/promociones/services/promocion.service';
import { HomeStore } from '../../home.store';
import { Promocion, MarkerData, DIAS_SEMANA } from '../../../admin/promociones/models/promocion.model';
import { idFromSlug, promoSlug, ciudadToSlug } from '../../utils/slug.utils';
import { VisitasService } from '../../services/visitas.service';
import { SeoService } from '@core/services/seo.service';
import { LogoComponent } from '@core/components/logo/logo.component';
import { FooterComponent } from '@core/components/footer/footer.component';

@Component({
  selector: 'app-promo-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LowerCasePipe, LogoComponent, FooterComponent],
  templateUrl: './promo-detalle.component.html',
})
export class PromoDetalleComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private promocionService = inject(PromocionService);
  private visitasService = inject(VisitasService);
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  store = inject(HomeStore);

  promo = signal<Promocion | null>(null);
  similares = signal<Promocion[]>([]);
  loading = signal(true);

  readonly diasSemana = DIAS_SEMANA;

  private mapContainer = viewChild<ElementRef>('mapContainer');
  private map: LType.Map | null = null;
  private readonly leaflet = signal<typeof LType | null>(null);

  constructor() {
    afterNextRender(async () => {
      const mod = await import('leaflet');
      this.leaflet.set((mod as any).default ?? mod);
    });

    effect(() => {
      const container = this.mapContainer();
      const p = this.promo();
      const L = this.leaflet();
      if (container && p && !this.map && L) {
        this.initMap(p);
      }
    });
  }

  ngOnInit(): void {
    if (!this.store.categorias().length) {
      this.store.loadData();
    }

    const slug = this.route.snapshot.paramMap.get('promoSlug') ?? '';
    const id = idFromSlug(slug);
    if (isNaN(id)) { this.router.navigate(['/not-found']); return; }

    this.promocionService.getById(id).subscribe({
      next: (promo) => {
        this.promo.set(promo);
        this.loading.set(false);

        const categoriaNombre = this.store.categorias()
          .find(c => c.id === promo.categoriaId)?.nombre ?? '';
        const ciudadNombre = this.store.ciudades()
          .find(c => c.id === promo.ciudadIds?.[0])?.nombre ?? '';

        // SEO + JSON-LD (Fase 1 + 3)
        this.seo.setPromocion(promo, ciudadNombre, categoriaNombre);

        // Registrar visita (fire-and-forget + App Insights)
        this.visitasService.registrar(promo.id, {
          marca: promo.marca,
          categoria: categoriaNombre,
          ciudad: ciudadNombre,
        });

        const ciudadId = promo.ciudadIds?.[0];
        if (ciudadId) {
          this.promocionService.getSimilares(id, ciudadId).subscribe({
            next: (s) => this.similares.set(s),
            error: () => {},
          });
        }
      },
      error: () => this.router.navigate(['/not-found']),
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private initMap(promo: Promocion): void {
    const L = this.leaflet()!;
    const container = this.mapContainer()!;
    const markers: MarkerData[] = promo.markers ? JSON.parse(promo.markers) : [];
    const center: [number, number] = markers.length
      ? [markers[0].lat, markers[0].lng]
      : [4.711, -74.0721];

    this.map = L.map(container.nativeElement).setView(center, 15);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(this.map);

    const innerContent = promo.descuento > 0
      ? `<text x="14" y="14" text-anchor="middle" dominant-baseline="central"
                fill="white" font-weight="800" font-size="8"
                font-family="'Bricolage Grotesque','Inter',system-ui,sans-serif"
            >${promo.descuento}%</text>`
      : `<text x="14" y="15" text-anchor="middle" dominant-baseline="central"
                fill="white" font-size="10"
            >★</text>`;

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.32))">
            <svg width="48" height="62" viewBox="0 0 28 36" overflow="visible" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
                    fill="#E8372C" stroke="white" stroke-width="1.75"/>
              ${innerContent}
            </svg>
          </div>`,
        iconSize: [48, 62],
        iconAnchor: [24, 62],
      });
      L.marker([m.lat, m.lng], { icon }).addTo(this.map!);
    });

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  // ── Computed values ────────────────────────────────────────────────────────

  ciudadNombres = computed(() => {
    const p = this.promo();
    if (!p?.ciudadIds?.length) return [];
    const ciudades = this.store.ciudades();
    return p.ciudadIds.map(id => ciudades.find(c => c.id === id)?.nombre ?? '').filter(n => n);
  });

  ciudadNombre = computed(() => this.ciudadNombres()[0] ?? '');

  categoriaNombre = computed(() => {
    const p = this.promo();
    if (!p) return '';
    return this.store.categorias().find((c) => c.id === p.categoriaId)?.nombre ?? '';
  });

  diasRestantes = computed(() => {
    const p = this.promo();
    if (!p?.fechaHasta) return null;
    const diff = new Date(p.fechaHasta).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  });

  duracionTotal = computed(() => {
    const p = this.promo();
    if (!p?.fechaDesde || !p?.fechaHasta) return null;
    const diff = new Date(p.fechaHasta).getTime() - new Date(p.fechaDesde).getTime();
    return Math.ceil(diff / 86_400_000);
  });

  diasTranscurridos = computed(() => {
    const p = this.promo();
    if (!p?.fechaDesde) return null;
    const diff = Date.now() - new Date(p.fechaDesde).getTime();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  });

  progresoVigencia = computed(() => {
    const total = this.duracionTotal();
    const trans = this.diasTranscurridos();
    if (!total || trans === null) return 0;
    return Math.min(100, Math.round((trans / total) * 100));
  });

  diasPorSemana = computed(() => {
    const p = this.promo();
    if (!p) return 0;
    return DIAS_SEMANA.filter((d) => (p.vigenciaDias & d.bit) !== 0).length;
  });

  estaActiva = computed(() => {
    const p = this.promo();
    if (!p) return false;
    const ahora = Date.now();
    const desde = p.fechaDesde ? new Date(p.fechaDesde).getTime() : 0;
    const hasta = p.fechaHasta ? new Date(p.fechaHasta).getTime() : Infinity;
    return ahora >= desde && ahora <= hasta;
  });

  diasCalendario = computed(() => {
    const p = this.promo();
    const hoy = new Date();
    const dow = hoy.getDay(); // 0=Dom
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dow === 0 ? 6 : dow - 1));

    return DIAS_SEMANA.map((dia, i) => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      return {
        label: dia.label,
        nombre: dia.nombre,
        fecha: fecha.getDate(),
        activo: !!(p && (p.vigenciaDias & dia.bit) !== 0),
        esHoy: fecha.toDateString() === hoy.toDateString(),
      };
    });
  });

  primerMarker = computed<MarkerData | null>(() => {
    const p = this.promo();
    if (!p?.markers) return null;
    try {
      const arr: MarkerData[] = JSON.parse(p.markers);
      return arr[0] ?? null;
    } catch { return null; }
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  abrirComoLlegar(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const m = this.primerMarker();
    if (!m) return;
    window.open(`https://www.google.com/maps?q=${m.lat},${m.lng}`, '_blank');
  }

  abrirWhatsapp(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const numero = this.promo()?.whatsapp;
    if (!numero) return;
    const titulo = this.promo()?.titulo ?? 'su plan';
    const mensaje = `¡Hola! Vi el plan *"${titulo}"* en *Un Buen Plan* y estoy interesado/a. ¿Me podés dar más información?`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
  }

  abrirSitio(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = this.promo()?.urlSitio;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  abrirInstagram(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const usuario = this.promo()?.instagram;
    if (!usuario) return;
    window.open(`https://www.instagram.com/${usuario}`, '_blank', 'noopener,noreferrer');
  }

  abrirWaze(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const m = this.primerMarker();
    if (!m) return;
    window.open(`https://waze.com/ul?ll=${m.lat},${m.lng}&navigate=yes`, '_blank');
  }

  verSimilar(similar: Promocion): void {
    const ciudad = this.store.ciudades().find((c) => c.id === similar.ciudadIds?.[0]);
    const cs = ciudad ? ciudadToSlug(ciudad) : 'colombia';
    this.router.navigate(['/promociones', cs, promoSlug(similar)]);
  }

  volver(): void {
    this.router.navigate(['/']);
  }

  ciudadNombreDe(promo: Promocion): string {
    if (!promo.ciudadIds?.length) return '';
    const ciudades = this.store.ciudades();
    const nombres = promo.ciudadIds
      .map(id => ciudades.find(c => c.id === id)?.nombre ?? '')
      .filter(n => n);
    if (!nombres.length) return '';
    return nombres.length === 1 ? nombres[0] : `${nombres[0]} +${nombres.length - 1}`;
  }
}
