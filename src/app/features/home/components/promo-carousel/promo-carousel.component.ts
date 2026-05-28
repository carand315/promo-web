import { DatePipe, LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { Promocion } from '../../../admin/promociones/models/promocion.model';
import { HomeStore } from '../../home.store';
import { ciudadToSlug, promoSlug } from '../../utils/slug.utils';

const DIAS = [
  { label: 'Lun', bit: 1 },
  { label: 'Mar', bit: 2 },
  { label: 'Mié', bit: 4 },
  { label: 'Jue', bit: 8 },
  { label: 'Vie', bit: 16 },
  { label: 'Sáb', bit: 32 },
  { label: 'Dom', bit: 64 },
];

@Component({
  selector: 'app-promo-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LowerCasePipe, CarouselModule, ButtonModule],
  templateUrl: './promo-carousel.component.html',
})
export class PromoCarouselComponent {
  promos = input.required<Promocion[]>();

  private store  = inject(HomeStore);
  private router = inject(Router);

  readonly dias = DIAS;

  getCategoriaNombre(categoriaId: number): string {
    return this.store.categorias().find((c) => c.id === categoriaId)?.nombre ?? '';
  }

  getCiudadNombre(ciudadIds: number[]): string {
    if (!ciudadIds?.length) return '';
    return this.store.ciudades().find((c) => c.id === ciudadIds[0])?.nombre ?? '';
  }

  isDiaActivo(vigenciaDias: number, bit: number): boolean {
    return (vigenciaDias & bit) !== 0;
  }

  verDetalle(promo: Promocion): void {
    const ciudad = this.store.ciudades().find(c => c.id === promo.ciudadIds?.[0]);
    const cs = ciudad ? ciudadToSlug(ciudad) : 'colombia';
    this.router.navigate(['/promociones', cs, promoSlug(promo)]);
  }

  getFirstMarkerLabel(markers: string): string {
    try {
      const parsed: { lat: number; lng: number; label?: string }[] =
        JSON.parse(markers);
      return parsed[0]?.label ?? '';
    } catch {
      return '';
    }
  }
}
