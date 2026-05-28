import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  computed,
} from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Promocion } from '../../../admin/promociones/models/promocion.model';
import { HomeStore } from '../../home.store';
import { promoSlug, ciudadToSlug } from '../../utils/slug.utils';

@Component({
  selector: 'app-promo-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LowerCasePipe],
  templateUrl: './promo-card.component.html',
})
export class PromoCardComponent {
  promo = input.required<Promocion>();

  private store = inject(HomeStore);
  private router = inject(Router);

  categoriaNombre = computed(
    () =>
      this.store.categorias().find((c) => c.id === this.promo().categoriaId)
        ?.nombre ?? ''
  );

  ciudadNombres = computed(() => {
    const ids = this.promo().ciudadIds;
    if (!ids?.length) return [];
    const ciudades = this.store.ciudades();
    return ids.map(id => ciudades.find(c => c.id === id)?.nombre ?? '').filter(n => n);
  });

  esDiaUnico = computed(() => {
    const { fechaDesde, fechaHasta } = this.promo();
    if (!fechaDesde || !fechaHasta) return false;
    return new Date(fechaDesde).toDateString() === new Date(fechaHasta).toDateString();
  });

  verDetalle(): void {
    const ciudad = this.store.ciudades().find(
      (c) => c.id === this.promo().ciudadIds?.[0]
    );
    const cs = ciudad ? ciudadToSlug(ciudad) : 'colombia';
    this.router.navigate(['/promociones', cs, promoSlug(this.promo())]);
  }
}
