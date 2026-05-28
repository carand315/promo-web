import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  signal,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import * as L from 'leaflet';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import {
  Promocion,
  Categoria,
  Ciudad,
  MarkerData,
  DIAS_SEMANA,
  CrearPromocionRequest,
  ActualizarPromocionRequest,
} from '../../models/promocion.model';
import { PromocionService } from '../../services/promocion.service';
import { ArchivoService } from '../../services/archivo.service';

const COLORES_MARCA = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#1F2937',
];

@Component({
  selector: 'app-promocion-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DrawerModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    SliderModule,
    DatePickerModule,
    CheckboxModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  templateUrl: './promocion-form.component.html',
})
export class PromocionFormComponent implements OnInit, OnDestroy {
  promocion = input<Promocion | null>(null);
  categorias = input<Categoria[]>([]);
  ciudades = input<Ciudad[]>([]);

  guardado = output<Promocion>();
  cancelado = output<void>();

  private fb = inject(FormBuilder);
  private promocionService = inject(PromocionService);
  private archivoService = inject(ArchivoService);

  form!: FormGroup;
  uploading = signal(false);
  saving = signal(false);
  coloresMarca = COLORES_MARCA;
  diasSemana = DIAS_SEMANA;

  // Map
  private mapContainer = viewChild<ElementRef>('mapContainer');
  private map: L.Map | null = null;
  private markersLayer = L.layerGroup();
  markers = signal<MarkerData[]>([]);

  visible = signal(true);

  constructor() {
    effect(() => {
      const container = this.mapContainer();
      if (container && !this.map) {
        this.initMap();
      }
    });
  }

  ngOnInit(): void {
    const p = this.promocion();
    const existingMarkers: MarkerData[] = p?.markers
      ? JSON.parse(p.markers)
      : [];

    this.form = this.fb.group({
      titulo: [p?.titulo ?? '', [Validators.required, Validators.maxLength(200)]],
      descripcion: [p?.descripcion ?? '', [Validators.maxLength(1000)]],
      marca: [p?.marca ?? '', [Validators.required, Validators.maxLength(100)]],
      categoriaId: [p?.categoriaId ?? null, [Validators.required]],
      descuento: [p?.descuento ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      destacada: [p?.destacada ?? false],
      colorMarca: [p?.colorMarca ?? COLORES_MARCA[5]],
      imagenUrl: [p?.imagenUrl ?? ''],
      vigenciaDias: [p?.vigenciaDias ?? 127],
      fechaDesde: [p?.fechaDesde ? new Date(p.fechaDesde) : null],
      fechaHasta: [p?.fechaHasta ? new Date(p.fechaHasta) : null],
      whatsapp: [p?.whatsapp ?? '', [Validators.pattern(/^\d{7,15}$/)]],
      urlSitio: [p?.urlSitio ?? '', [Validators.pattern(/^https?:\/\/.+/)]],
      instagram: [p?.instagram ?? '', [Validators.pattern(/^[a-zA-Z0-9._]{1,30}$/)]],
      ciudadIds: [p?.ciudadIds ?? []],
    });

    this.markers.set(existingMarkers);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private initMap(): void {
    const container = this.mapContainer()!;

    this.map = L.map(container.nativeElement).setView([4.711, -74.0721], 6);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // Render existing markers
    this.renderMarkers();

    // Click to add marker
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const newMarker: MarkerData = { lat: e.latlng.lat, lng: e.latlng.lng };
      this.markers.update((prev) => [...prev, newMarker]);
      this.renderMarkers();
    });

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private renderMarkers(): void {
    this.markersLayer.clearLayers();
    this.markers().forEach((m, i) => {
      const marker = L.marker([m.lat, m.lng]);
      marker.bindPopup(`
        <div style="min-width:120px">
          <b>Punto ${i + 1}</b><br/>
          <small>${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</small><br/>
          <button type="button" onclick="window._removeMarker(${i})" style="color:red;font-size:11px;border:none;background:none;cursor:pointer;padding:0">Eliminar</button>
        </div>
      `);
      marker.addTo(this.markersLayer);
    });

    // Expose remove function globally for popup buttons
    (window as unknown as Record<string, unknown>)['_removeMarker'] = (idx: number) => {
      this.markers.update((prev) => prev.filter((_, i) => i !== idx));
      this.renderMarkers();
    };
  }

  limpiarMarcadores(): void {
    this.markers.set([]);
    this.markersLayer.clearLayers();
  }

  isDiaActivo(bit: number): boolean {
    return (this.form.get('vigenciaDias')!.value & bit) !== 0;
  }

  toggleDia(bit: number): void {
    const current: number = this.form.get('vigenciaDias')!.value;
    const nuevo = current ^ bit;
    this.form.get('vigenciaDias')!.setValue(nuevo);
  }

  seleccionarColor(color: string): void {
    this.form.get('colorMarca')!.setValue(color);
  }

  onColorInput(event: Event): void {
    this.seleccionarColor((event.target as HTMLInputElement).value);
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.archivoService.uploadImage(file).subscribe({
      next: (url) => {
        this.form.get('imagenUrl')!.setValue(url);
        this.uploading.set(false);
        input.value = '';
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const val = this.form.value;
    const markersJson = JSON.stringify(this.markers());
    const p = this.promocion();

    if (p) {
      const req: ActualizarPromocionRequest = {
        id: p.id,
        titulo: val.titulo,
        descripcion: val.descripcion,
        marca: val.marca,
        categoriaId: val.categoriaId,
        descuento: val.descuento,
        destacada: val.destacada,
        colorMarca: val.colorMarca,
        imagenUrl: val.imagenUrl,
        vigenciaDias: val.vigenciaDias,
        fechaDesde: this.toIso(val.fechaDesde),
        fechaHasta: this.toIso(val.fechaHasta),
        markers: markersJson,
        whatsapp: val.whatsapp || undefined,
        urlSitio: val.urlSitio || undefined,
        instagram: val.instagram || undefined,
        ciudadIds: val.ciudadIds,
        modificadoPor: 'admin',
      };
      this.promocionService.update(p.id, req).subscribe({
        next: (result) => {
          this.guardado.emit({ ...result, ciudadIds: val.ciudadIds });
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
    } else {
      const req: CrearPromocionRequest = {
        titulo: val.titulo,
        descripcion: val.descripcion,
        marca: val.marca,
        categoriaId: val.categoriaId,
        descuento: val.descuento,
        destacada: val.destacada,
        colorMarca: val.colorMarca,
        imagenUrl: val.imagenUrl,
        vigenciaDias: val.vigenciaDias,
        fechaDesde: this.toIso(val.fechaDesde),
        fechaHasta: this.toIso(val.fechaHasta),
        markers: markersJson,
        whatsapp: val.whatsapp || undefined,
        urlSitio: val.urlSitio || undefined,
        instagram: val.instagram || undefined,
        ciudadIds: val.ciudadIds,
        creadoPor: 'admin',
      };
      this.promocionService.create(req).subscribe({
        next: (result) => {
          this.guardado.emit({ ...result, ciudadIds: val.ciudadIds });
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  cerrar(): void {
    this.visible.set(false);
    this.cancelado.emit();
  }

  private toIso(date: Date | null): string | null {
    return date ? date.toISOString() : null;
  }

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && control.touched);
  }
}
