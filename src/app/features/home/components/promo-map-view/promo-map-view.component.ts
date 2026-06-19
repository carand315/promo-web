import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    effect,
    ElementRef,
    input,
    OnDestroy,
    output,
    viewChild,
} from '@angular/core';
import type * as LType from 'leaflet';
import { MarkerData, Promocion } from '../../../admin/promociones/models/promocion.model';
import { promoSlug } from '../../utils/slug.utils';
import { buildMarkerIcon } from '../../utils/map-icon.utils';

function markerColor(descuento: number): string {
  if (descuento >= 50) return '#e8342c';
  if (descuento >= 30) return '#F97316';
  return '#22C55E';
}

// Colombia: centro aprox. y zoom inicial
const COLOMBIA_CENTER = [4.5709, -74.2973] as LType.LatLngTuple;
const COLOMBIA_ZOOM = 6;

@Component({
  selector: 'app-promo-map-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #mapContainer class="w-full h-full" aria-label="Mapa de promociones" role="application"></div>`,
})
export class PromoMapViewComponent implements OnDestroy {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  promociones     = input<Promocion[]>([]);
  selectedId      = input<number | null>(null);
  userLocation    = input<LType.LatLngTuple | null>(null);
  /** Incrementar para forzar un fitBounds sobre todos los markers actuales. */
  fitAllTrigger   = input(0);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  promoClicked  = output<number>();    // promoId al hacer clic en marker
  boundsChanged = output<number[]>();  // IDs de promos visibles en el viewport actual

  // ── Internals ────────────────────────────────────────────────────────────────
  private mapContainer = viewChild.required<ElementRef>('mapContainer');
  private map:          LType.Map | null = null;
  private clusterGroup: LType.MarkerClusterGroup | null = null;
  private markerMap = new Map<number, LType.Marker[]>();
  private L: typeof LType | null = null;

  constructor() {
    afterNextRender(async () => {
      const mod = await import('leaflet');
      // esbuild envuelve CJS en un namespace ESM; el objeto CJS real
      // (donde markercluster agrega markerClusterGroup) es .default.
      this.L = (mod as any).default ?? mod;
      (window as any)['L'] = this.L;
      await import('leaflet.markercluster');
      this.initMap();
    });

    // Reaccionar a cambios en las promos o selección
    effect(() => {
      const promos = this.promociones();
      const selId  = this.selectedId();
      if (this.map) {
        this.renderMarkers(promos, selId);
      }
    });

    // Reaccionar a cambio de ubicación del usuario
    effect(() => {
      const loc = this.userLocation();
      if (loc && this.map) {
        this.map.setView(loc, 13);
      }
    });

    // Ajustar zoom para ver todos los markers cuando el padre lo solicita
    effect(() => {
      const trigger = this.fitAllTrigger();
      if (trigger > 0 && this.map) {
        this.fitAll();
      }
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.clusterGroup = null;
    this.markerMap.clear();
  }

  // ── API pública ──────────────────────────────────────────────────────────────

  /** Calcula qué promos tienen al menos un marker en los bounds actuales y emite sus IDs.
   *  No emite si el contenedor está oculto (display:none → tamaño 0), para evitar
   *  que un mapa invisible sobreescriba el filtro del listado con un array vacío. */
  private emitVisiblePromos(): void {
    if (!this.map) return;
    const el = this.mapContainer().nativeElement as HTMLElement;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
    const bounds = this.map.getBounds();
    const visibleIds: number[] = [];
    this.markerMap.forEach((markers, promoId) => {
      if (markers.some(m => bounds.contains(m.getLatLng()))) {
        visibleIds.push(promoId);
      }
    });
    this.boundsChanged.emit(visibleIds);
  }

  /** Fuerza a Leaflet a recalcular el tamaño del contenedor.
   *  Llamar siempre que el contenedor pase de hidden a visible. */
  invalidateSize(): void {
    this.map?.invalidateSize();
  }

  /** Ajusta el zoom para que todos los markers actuales quepan en pantalla. */
  fitAll(): void {
    if (!this.map || !this.L || this.markerMap.size === 0) return;
    const allLatLngs: LType.LatLng[] = [];
    this.markerMap.forEach(markers => markers.forEach(m => allLatLngs.push(m.getLatLng())));
    if (!allLatLngs.length) return;
    const bounds = this.L.latLngBounds(allLatLngs);
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }

  /** Centra el mapa sobre todos los markers de una promo y la resalta */
  panToPromo(promoId: number): void {
    const L = this.L;
    const markers = this.markerMap.get(promoId);
    if (!markers?.length || !this.map || !L) return;

    const latlngs = markers.map(m => m.getLatLng());
    if (latlngs.length === 1) {
      this.map.setView(latlngs[0], Math.max(this.map.getZoom(), 14));
    } else {
      this.map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
    }
  }

  // ── Privados ─────────────────────────────────────────────────────────────────

  private injectMarkerStyles(): void {
    const ID = 'dh-marker-styles';
    if (document.getElementById(ID)) return;
    const style = document.createElement('style');
    style.id = ID;
    style.textContent = `
      @keyframes dh-bounce {
        0%, 100% { transform: translateY(0);    }
        45%       { transform: translateY(-10px); }
        65%       { transform: translateY(-6px);  }
      }
      @keyframes dh-pulse {
        0%   { transform: translateX(-50%) scale(1);   opacity: 0.55; }
        100% { transform: translateX(-50%) scale(3.8); opacity: 0;    }
      }
      .dh-pin-bounce {
        animation: dh-bounce 1.4s cubic-bezier(.36,.07,.19,.97) infinite;
        transform-origin: bottom center;
      }
      .dh-pin-pulse {
        position: absolute;
        bottom: -3px;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 10px;
        border-radius: 50%;
        animation: dh-pulse 1.4s ease-out infinite;
      }
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
    this.injectMarkerStyles();
    this.map = L.map(this.mapContainer().nativeElement, {
      center: COLOMBIA_CENTER,
      zoom: COLOMBIA_ZOOM,
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(this.map);

    type LWithCluster = typeof LType & { markerClusterGroup: (opts?: object) => LType.MarkerClusterGroup };
    const Lmc = ((window as any)['L'] as LWithCluster);
    this.clusterGroup = Lmc.markerClusterGroup({
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: LType.MarkerCluster) => {
          const count = cluster.getChildCount();
          const color = count >= 10 ? '#e8342c' : count >= 5 ? '#F97316' : '#22C55E';
          return L.divIcon({
            className: '',
            html: `<div style="
              background:${color};color:white;
              border-radius:50%;
              width:54px;height:54px;
              display:flex;align-items:center;justify-content:center;
              font-family:'Bricolage Grotesque','Inter',system-ui,sans-serif;
              font-weight:800;font-size:16px;
              border:3px solid white;
              box-shadow:0 4px 14px rgba(0,0,0,.28);
            ">${count}</div>`,
            iconSize:   [54, 54],
            iconAnchor: [27, 27],
          });
        },
      });

    this.clusterGroup.addTo(this.map);

    // Emitir bounds cada vez que el usuario termina de mover o hacer zoom
    this.map.on('moveend zoomend', () => this.emitVisiblePromos());

    this.renderMarkers(this.promociones(), this.selectedId());
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private renderMarkers(promos: Promocion[], selectedId: number | null): void {
    const L = this.L;
    if (!this.clusterGroup || !L) return;

    this.clusterGroup.clearLayers();
    this.markerMap.clear();

    promos.forEach(promo => {
      if (!promo.markers) return;
      let coords: MarkerData[];
      try { coords = JSON.parse(promo.markers); } catch { return; }
      if (!coords.length) return;

      const isSelected = promo.id === selectedId;
      const markers: LType.Marker[] = [];

      coords.forEach(({ lat, lng }) => {
        const color = markerColor(promo.descuento);
        const w = isSelected ? 60 : 48;
        const h = isSelected ? 78 : 62;
        const marker = L.marker([lat, lng], {
          icon: buildMarkerIcon(L, promo, { selected: isSelected, color, w, h }),
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
                  ? `<span style="background:${color};color:white;font-weight:800;font-size:11px;
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

        marker.bindPopup(popupHtml, { className: 'dh-promo-popup', maxWidth: 220 });
        marker.on('click', () => this.promoClicked.emit(promo.id));
        markers.push(marker);
        this.clusterGroup!.addLayer(marker);
      });

      this.markerMap.set(promo.id, markers);
    });

    // Emitir planes visibles en el viewport actual después del re-render
    setTimeout(() => this.emitVisiblePromos(), 120);

    // Abrir popup del marcador seleccionado automáticamente tras re-render
    if (selectedId !== null) {
      setTimeout(() => {
        const selMarkers = this.markerMap.get(selectedId);
        if (selMarkers?.[0]) {
          selMarkers[0].openPopup();
        }
      }, 80);
    }
  }
}
