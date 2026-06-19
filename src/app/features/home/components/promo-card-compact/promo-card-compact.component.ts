import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { Promocion } from '../../../admin/promociones/models/promocion.model';
import { HomeStore } from '../../home.store';

@Component({
  selector: 'app-promo-card-compact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './promo-card-compact.component.html',
  host: {
    'role': 'button',
    'tabindex': '0',
    '[attr.aria-label]': '"Ver " + promo().titulo',
    '[attr.aria-pressed]': 'selected()',
    '(click)': 'seleccionada.emit(promo())',
    '(keydown.enter)': 'seleccionada.emit(promo())',
    '(keydown.space)': 'seleccionada.emit(promo()); $event.preventDefault()',
  },
})
export class PromoCardCompactComponent {
  promo    = input.required<Promocion>();
  selected = input(false);

  seleccionada = output<Promocion>();

  private store = inject(HomeStore);

  categoriaNombre = computed(
    () => this.store.categorias().find(c => c.id === this.promo().categoriaId)?.nombre ?? ''
  );

  ciudadNombre = computed(() => {
    const ids = this.promo().ciudadIds;
    if (!ids?.length) return '';
    const ciudades = this.store.ciudades();
    if (ids.length === 1) return ciudades.find(c => c.id === ids[0])?.nombre ?? '';
    return `${ciudades.find(c => c.id === ids[0])?.nombre ?? ''} +${ids.length - 1}`;
  });

  markerColor = computed(() => {
    const d = this.promo().descuento;
    if (d >= 50) return '#e8342c';
    if (d >= 30) return '#F97316';
    return '#22C55E';
  });
}
