import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromocionStore } from '../../store/promocion.store';
import { PromocionFormComponent } from '../../components/promocion-form/promocion-form.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PromocionService } from '../../services/promocion.service';
import { Promocion } from '../../models/promocion.model';
import { promoSlug } from '../../../../home/utils/slug.utils';

type EstadoPromo = 'activa' | 'vencida' | 'vence_pronto';

@Component({
  selector: 'app-promociones-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DatePipe,
    LowerCasePipe,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule,
    SelectModule,
    PromocionFormComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './promociones-list.component.html',
})
export class PromocionesListComponent implements OnInit {
  store = inject(PromocionStore);
  private promocionService = inject(PromocionService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // Filtros (estado local de UI)
  searchText = signal('');
  filterCategoriaId = signal<number | null>(null);
  filterCiudadId = signal<number | null>(null);
  filterEstado = signal('todas');

  // Opciones de selects derivadas del store
  categoriaOptions = computed(() => [
    { label: 'Todas', value: null },
    ...this.store.categorias().map(c => ({ label: c.nombre, value: c.id })),
  ]);

  ciudadOptions = computed(() => [
    { label: 'Todas', value: null },
    ...this.store.ciudades().map(c => ({ label: c.nombre, value: c.id })),
  ]);

  // Lista filtrada
  promocionesFiltradas = computed(() => {
    const text = this.searchText().toLowerCase();
    const catId = this.filterCategoriaId();
    const cityId = this.filterCiudadId();
    const estado = this.filterEstado();

    return this.store.promociones().filter(p => {
      if (text && !p.titulo.toLowerCase().includes(text) && !p.marca.toLowerCase().includes(text)) return false;
      if (catId !== null && p.categoriaId !== catId) return false;
      if (cityId !== null && !p.ciudadIds?.includes(cityId)) return false;
      if (estado !== 'todas' && this.getEstado(p.fechaHasta) !== estado) return false;
      return true;
    });
  });

  readonly estadoOptions = [
    { label: 'Todos los estados', value: 'todas' },
    { label: 'Activa',           value: 'activa' },
    { label: 'Vencida',          value: 'vencida' },
    { label: 'Vence pronto',     value: 'vence_pronto' },
  ];

  ngOnInit(): void {
    this.store.loadAll();
    this.store.loadCategorias();
    this.store.loadCiudades();
  }

  nueva(): void {
    this.store.openDrawer(null);
  }

  ver(promocion: Promocion): void {
    window.open(`/promociones/colombia/${promoSlug(promocion)}`, '_blank', 'noopener');
  }

  editar(promocion: Promocion): void {
    this.store.openDrawer(promocion);
  }

  confirmarEliminar(promocion: Promocion): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la promoción "${promocion.titulo}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(promocion.id),
    });
  }

  private eliminar(id: number): void {
    this.promocionService.delete(id).subscribe({
      next: () => {
        this.store.remove(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Promoción eliminada correctamente',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la promoción',
        });
      },
    });
  }

  onGuardado(promocion: Promocion): void {
    this.store.addOrUpdate(promocion);
    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Promoción guardada correctamente',
    });
  }

  formatId(id: number): string {
    return `#${String(id).padStart(3, '0')}`;
  }

  getEstado(fechaHasta: string | null): EstadoPromo {
    if (!fechaHasta) return 'activa';
    const hoy = new Date();
    const venc = new Date(fechaHasta);
    if (venc < hoy) return 'vencida';
    const dias = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return dias <= 7 ? 'vence_pronto' : 'activa';
  }

  getCategoriaNombre(categoriaId: number): string {
    return this.store.categorias().find(c => c.id === categoriaId)?.nombre ?? '—';
  }

  getCiudadNombre(ciudadIds: number[]): string {
    if (!ciudadIds?.length) return '—';
    if (ciudadIds.length > 1) return `${ciudadIds.length} ciudades`;
    return this.store.ciudades().find(c => c.id === ciudadIds[0])?.nombre ?? '—';
  }
}
