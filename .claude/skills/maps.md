# Mapas — Leaflet + OpenStreetMap

Patrones para mapas interactivos con Leaflet en Angular 21.

---

## Instalación

```bash
npm install leaflet
npm install --save-dev @types/leaflet
```

```typescript
// angular.json — styles
"styles": ["node_modules/leaflet/dist/leaflet.css", "src/styles.css"]
```

---

## Componente base

```typescript
import {
  Component, ChangeDetectionStrategy,
  ElementRef, viewChild,
  OnDestroy, afterNextRender,
  input,
} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #mapContainer class="w-full h-full min-h-[400px]"></div>`,
})
export class MapComponent implements OnDestroy {
  center = input<[number, number]>([-34.6037, -58.3816]); // Buenos Aires
  zoom = input(13);

  private mapContainer = viewChild.required<ElementRef>('mapContainer');
  private map: L.Map | null = null;

  constructor() {
    // Inicializar siempre en afterNextRender — nunca en ngOnInit
    afterNextRender(() => {
      this.initMap();
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer().nativeElement).setView(
      this.center(),
      this.zoom()
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);
  }

  ngOnDestroy(): void {
    // Destruir siempre para evitar memory leaks
    this.map?.remove();
    this.map = null;
  }
}
```

---

## Marcadores

```typescript
addMarker(lat: number, lng: number, label?: string): L.Marker {
  const marker = L.marker([lat, lng]);

  if (label) {
    marker.bindPopup(label);
  }

  marker.addTo(this.map!);
  return marker;
}

// Ícono personalizado
const icon = L.icon({
  iconUrl: '/assets/icons/marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

L.marker([lat, lng], { icon }).addTo(this.map!);
```

---

## Múltiples marcadores con layer group

```typescript
private markersLayer = L.layerGroup();

initMap(): void {
  // ...
  this.markersLayer.addTo(this.map!);
}

setMarkers(locations: Location[]): void {
  this.markersLayer.clearLayers();

  locations.forEach(loc => {
    L.marker([loc.lat, loc.lng])
      .bindPopup(`<b>${loc.name}</b>`)
      .addTo(this.markersLayer);
  });
}

// Ajustar zoom para mostrar todos los marcadores
fitBounds(): void {
  const bounds = this.markersLayer.getBounds();
  if (bounds.isValid()) {
    this.map!.fitBounds(bounds, { padding: [20, 20] });
  }
}
```

---

## Eventos del mapa

```typescript
import { output } from '@angular/core';

locationSelected = output<{ lat: number; lng: number }>();

private initMap(): void {
  // ...
  this.map!.on('click', (e: L.LeafletMouseEvent) => {
    this.locationSelected.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
}
```

---

## Polígonos y áreas

```typescript
const polygon = L.polygon([
  [51.509, -0.08],
  [51.503, -0.06],
  [51.51, -0.047],
], {
  color: 'blue',
  fillColor: '#30f',
  fillOpacity: 0.3,
}).addTo(this.map!);

polygon.bindPopup('Área seleccionada');
```

---

## Selector de ubicación (clic en mapa)

```typescript
private selectedMarker: L.Marker | null = null;

private initMap(): void {
  // ...
  this.map!.on('click', (e: L.LeafletMouseEvent) => {
    // Remover marcador anterior
    this.selectedMarker?.remove();

    // Colocar nuevo marcador
    this.selectedMarker = L.marker(e.latlng).addTo(this.map!);

    this.locationSelected.emit({
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    });
  });
}
```

---

## Actualizar mapa cuando cambia input (con effect)

```typescript
constructor() {
  afterNextRender(() => {
    this.initMap();
  });

  effect(() => {
    const c = this.center();
    if (this.map) {
      this.map.setView(c, this.zoom());
    }
  });
}
```

---

## Reglas críticas

- Inicializar **siempre** en `afterNextRender()` — nunca en `ngOnInit` (el DOM no está listo)
- Llamar `this.map.remove()` en `ngOnDestroy` para evitar memory leaks
- Tiles de OpenStreetMap son gratuitos y no requieren API key
- El contenedor del mapa **debe tener altura definida** (min-h-[400px] o h-full con padre con altura)
- Invalidar tamaño si el mapa está dentro de un dialog: `this.map.invalidateSize()`
