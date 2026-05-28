import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  input,
  viewChild,
} from '@angular/core';
import type * as LType from 'leaflet';
import { Promocion } from '../../../admin/promociones/models/promocion.model';
import { promoSlug } from '../../utils/slug.utils';

interface MarkerData {
  lat: number;
  lng: number;
  label?: string;
}

const CIUDAD_CENTER: Record<string, [number, number]> = {
  bogot: [4.711, -74.0721],
  medell: [6.2518, -75.5636],
  cali: [3.4516, -76.532],
  barranquilla: [10.9685, -74.7813],
  cartagena: [10.391, -75.4794],
  bucaramanga: [7.1254, -73.1198],
  manizales: [5.0689, -75.5174],
};

function getCiudadCenter(nombre: string): [number, number] {
  const key = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '');
  for (const [k, coords] of Object.entries(CIUDAD_CENTER)) {
    if (key.startsWith(k) || key.includes(k)) return coords;
  }
  return [4.711, -74.0721]; // Colombia center fallback
}

function parseMarkers(markers: string): MarkerData[] {
  try {
    return JSON.parse(markers) ?? [];
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-promo-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-map-marker text-[#E8372C]"></i>
          <span class="font-semibold text-gray-700 text-sm">Mapa de Planes</span>
        </div>
        <span class="text-xs text-gray-400">{{ ubicaciones() }} ubicaciones</span>
      </div>
      <div #mapContainer class="flex-1 min-h-0"></div>
    </div>
  `,
})
export class PromoMapComponent implements OnDestroy {
  promociones = input.required<Promocion[]>();
  ciudadNombre = input('');

  private mapContainer = viewChild.required<ElementRef>('mapContainer');
  private map: LType.Map | null = null;
  private markersLayer: LType.FeatureGroup | null = null;
  private L: typeof LType | null = null;

  // Total de ubicaciones visibles
  protected ubicaciones = (): number => {
    return this.promociones().reduce((acc, p) => {
      return acc + parseMarkers(p.markers).length;
    }, 0);
  };

  constructor() {
    afterNextRender(async () => {
      const mod = await import('leaflet');
      this.L = (mod as any).default ?? mod;
      this.markersLayer = this.L!.featureGroup();
      this.initMap();
      this.updateMarkers(this.promociones());
    });

    effect(() => {
      const promos = this.promociones();
      if (this.map) {
        this.updateMarkers(promos);
      }
    });

    effect(() => {
      const ciudad = this.ciudadNombre();
      if (this.map && ciudad) {
        const center = getCiudadCenter(ciudad);
        this.map.setView(center, 12);
      }
    });
  }

  private injectPopupStyles(): void {
    const ID = 'dh-marker-styles';
    if (document.getElementById(ID)) return;
    const style = document.createElement('style');
    style.id = ID;
    style.textContent = `
      .dh-promo-popup .leaflet-popup-content-wrapper {
        padding: 0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
        border: none;
      }
      .dh-promo-popup .leaflet-popup-content {
        margin: 0;
        width: 220px !important;
      }
      .dh-promo-popup .leaflet-popup-tip-container {
        margin-top: -1px;
      }
    `;
    document.head.appendChild(style);
  }

  private initMap(): void {
    const L = this.L!;
    this.injectPopupStyles();
    const ciudad = this.ciudadNombre();
    const center = ciudad ? getCiudadCenter(ciudad) : [4.711, -74.0721] as [number, number];

    this.map = L.map(this.mapContainer().nativeElement).setView(center, 12);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(this.map);

    this.markersLayer!.addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private updateMarkers(promociones: Promocion[]): void {
    const L = this.L;
    if (!L || !this.markersLayer) return;

    this.markersLayer.clearLayers();

    for (const promo of promociones) {
      const pts = parseMarkers(promo.markers);
      for (const pt of pts) {
        const innerContent = promo.descuento > 0
          ? `<text x="14" y="14" text-anchor="middle" dominant-baseline="central"
                  fill="white" font-weight="800" font-size="8"
                  font-family="'Bricolage Grotesque','Inter',system-ui,sans-serif"
              >${promo.descuento}%</text>`
          : `<text x="14" y="15" text-anchor="middle" dominant-baseline="central"
                  fill="white" font-size="10"
              >★</text>`;

        const icon = L.divIcon({
          html: `
            <div style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.32))">
              <svg width="48" height="62" viewBox="0 0 28 36" overflow="visible" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
                      fill="#E8372C" stroke="white" stroke-width="1.75"/>
                ${innerContent}
              </svg>
            </div>`,
          className: '',
          iconSize: [48, 62],
          iconAnchor: [24, 62],
          popupAnchor: [0, -64],
        });

        const detalleUrl = `/promociones/colombia/${promoSlug(promo)}`;
        const popupHtml = `
          <div style="font-family:'Inter',system-ui,sans-serif;">
            ${promo.imagenUrl
              ? `<img src="${promo.imagenUrl}" alt="${promo.titulo}"
                      style="width:220px;height:120px;object-fit:cover;display:block;"
                      onerror="this.style.display='none'"/>`
              : ''}
            <div style="padding:10px 12px 12px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:13px;color:#111;line-height:1.3;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:196px;">
                ${promo.titulo}
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:#777;">${promo.marca}</p>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                ${promo.descuento > 0
                  ? `<span style="background:#E8372C;color:white;font-weight:800;font-size:11px;
                                  padding:2px 9px;border-radius:20px;display:inline-block;">
                       ${promo.descuento}% OFF
                     </span>`
                  : `<span style="background:#6B7280;color:white;font-weight:700;font-size:11px;
                                  padding:2px 9px;border-radius:20px;display:inline-block;">
                       ★ Buen Plan
                     </span>`}
                <a href="${detalleUrl}" target="_blank" rel="noopener"
                   style="background:#111;color:white;font-weight:700;font-size:11px;
                          padding:4px 10px;border-radius:20px;text-decoration:none;
                          white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">
                  Ver Plan ↗
                </a>
              </div>
            </div>
          </div>`;

        L.marker([pt.lat, pt.lng], { icon })
          .bindPopup(popupHtml, { className: 'dh-promo-popup', maxWidth: 220 })
          .addTo(this.markersLayer!);
      }
    }

    // Ajustar bounds si hay markers
    const bounds = this.markersLayer.getBounds();
    if (bounds.isValid()) {
      this.map?.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }
}
