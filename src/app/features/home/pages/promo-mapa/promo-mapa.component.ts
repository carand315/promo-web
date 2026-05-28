import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SeoService } from '@core/services/seo.service';
import type * as L from 'leaflet';
import { SelectModule } from 'primeng/select';
import { Promocion } from '../../../admin/promociones/models/promocion.model';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PromoCardCompactComponent } from '../../components/promo-card-compact/promo-card-compact.component';
import { PromoMapViewComponent } from '../../components/promo-map-view/promo-map-view.component';
import { HomeStore } from '../../home.store';
import { ciudadToSlug, promoSlug } from '../../utils/slug.utils';
import { FooterComponent } from '@core/components/footer/footer.component';

type Tab = 'lista' | 'mapa';

@Component({
  selector: 'app-promo-mapa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    SelectModule,
    NavbarComponent,
    PromoMapViewComponent,
    PromoCardCompactComponent,
    FooterComponent,
  ],
  templateUrl: './promo-mapa.component.html',
})
export class PromoMapaComponent implements OnInit {
  store  = inject(HomeStore);
  private router = inject(Router);
  private seo = inject(SeoService);

  // ── Estado local UI ─────────────────────────────────────────────────────────
  activeTab      = signal<Tab>('lista');
  searchText     = signal('');
  filterCatId    = signal<number | null>(null);
  userLocation   = signal<L.LatLngTuple | null>(null);
  geoError       = signal<string | null>(null);
  geoLoading     = signal(false);
  promosEnVista  = signal<number[] | null>(null); // null = sin filtro de bounds
  fitAllTrigger  = signal(0); // incrementar para hacer fitBounds en el mapa

  // Referencia al componente del mapa para llamar panToPromo()
  mapView = viewChild<PromoMapViewComponent>('mapView');

  // ── Computed ─────────────────────────────────────────────────────────────────

  categoriaOptions = computed(() => [
    { label: 'Todas las categorías', value: null },
    ...this.store.categorias().map(c => ({ label: c.nombre, value: c.id })),
  ]);

  /** Todas las promos con markers filtradas por texto/categoría.
   *  Se pasa al mapa — el mapa SIEMPRE muestra todos, sin filtro de bounds. */
  promosParaMapa = computed(() => {
    const text  = this.searchText().toLowerCase();
    const catId = this.filterCatId();
    return this.store.promosDeCiudad().filter(p => {
      if (!p.markers) return false;
      try { if (!JSON.parse(p.markers).length) return false; } catch { return false; }
      if (text && !p.titulo.toLowerCase().includes(text) && !p.marca.toLowerCase().includes(text)) return false;
      if (catId !== null && p.categoriaId !== catId) return false;
      return true;
    });
  });

  /** Para el listado: aplica además el filtro de bounds del mapa. */
  promosFiltradas = computed(() => {
    const todas      = this.promosParaMapa();
    const visibleIds = this.promosEnVista();
    if (visibleIds === null) return todas;
    return todas.filter(p => visibleIds.includes(p.id));
  });

  selectedId = computed(() => this.store.selectedPromoId());

  constructor() {
    // Cada vez que el tab activo pasa a 'mapa', el contenedor deja de estar
    // oculto y Leaflet necesita recalcular el tamaño del canvas.
    effect(() => {
      if (this.activeTab() === 'mapa') {
        setTimeout(() => this.mapView()?.invalidateSize(), 50);
      }
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!this.store.categorias().length) {
      this.store.loadData();
    }
    this.seo.setPage({
      title: 'Mapa de planes',
      description: 'Explora las planes y descuentos disponibles cerca de tu ubicación en el mapa interactivo.',
    });
  }

  // ── Acciones ─────────────────────────────────────────────────────────────────

  /** Clic en card del listado → selecciona + hace pan en el mapa */
  onCardClick(promo: Promocion): void {
    this.store.selectPromo(promo.id);
    this.activeTab.set('mapa');
    // 150ms: deja que el effect llame invalidateSize(50ms) antes de hacer pan
    setTimeout(() => this.mapView()?.panToPromo(promo.id), 150);
  }

  /** Clic en marker del mapa → selecciona + scroll al card */
  onMarkerClick(promoId: number): void {
    this.store.selectPromo(promoId);
    this.activeTab.set('lista');
    setTimeout(() => {
      document.getElementById(`promo-card-${promoId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 50);
  }

  /** Navega al detalle de la promo */
  verDetalle(promo: Promocion): void {
    const ciudad = this.store.ciudades().find(c => c.id === promo.ciudadIds?.[0]);
    const cs = ciudad ? ciudadToSlug(ciudad) : 'colombia';
    this.router.navigate(['/promociones', cs, promoSlug(promo)]);
  }

  /** "Promos cerca de mí" — Geolocation API */
  buscarCercaDeMi(): void {
    if (!navigator.geolocation) {
      this.geoError.set('Tu navegador no soporta geolocalización.');
      return;
    }
    this.geoLoading.set(true);
    this.geoError.set(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLocation.set([pos.coords.latitude, pos.coords.longitude]);
        this.activeTab.set('mapa');
        this.geoLoading.set(false);
      },
      () => {
        this.geoError.set('No se pudo obtener tu ubicación.');
        this.geoLoading.set(false);
      }
    );
  }

  clearSelection(): void {
    this.store.selectPromo(null);
  }

  verTodos(): void {
    this.promosEnVista.set(null);
    // En móvil el mapa puede estar oculto; mostrarlo antes de hacer fitBounds.
    if (this.activeTab() !== 'mapa') {
      this.activeTab.set('mapa');
    }
    // fitAllTrigger dispara el effect dentro del mapa que llama fitAll().
    // Se incrementa después de un tick para que el mapa ya esté visible
    // y Leaflet pueda calcular los bounds correctamente.
    setTimeout(() => this.fitAllTrigger.update(v => v + 1), 100);
  }
}
