import {
  Component,
  ChangeDetectionStrategy,
  afterNextRender,
  computed,
  ElementRef,
  input,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { CategoriaConConteo } from '../../home.model';
import { toSlug } from '../../utils/slug.utils';
import { HomeStore } from '../../home.store';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-categoria-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, FormsModule, SelectModule, TooltipModule],
  templateUrl: './categoria-navbar.component.html',
})
export class CategoriaNavbarComponent {
  categorias = input.required<CategoriaConConteo[]>();
  categoriaActivaId = input<number | null>(null);
  totalPromos = input(0);

  store = inject(HomeStore);
  sidebar = inject(SidebarService);
  drawerOpen = signal(false);
  canScrollLeft = signal(false);
  canScrollRight = signal(true);

  private pillsScroll = viewChild<ElementRef<HTMLDivElement>>('pillsScroll');

  ciudadOptions = computed(() =>
    this.store.ciudades().map((c) => ({ label: c.nombre, value: c.id }))
  );

  private router = inject(Router);

  constructor() {
    afterNextRender(() => this.updateScrollState());
  }

  updateScrollState(): void {
    const el = this.pillsScroll()?.nativeElement;
    if (!el) return;
    this.canScrollLeft.set(el.scrollLeft > 4);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  scrollPills(dir: 'left' | 'right'): void {
    const el = this.pillsScroll()?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 320);
  }

  toggleCollapsed(): void {
    this.sidebar.toggle();
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  seleccionarTodas(): void {
    this.drawerOpen.set(false);
    this.router.navigate(['/']);
  }

  seleccionarCategoria(cat: CategoriaConConteo): void {
    this.drawerOpen.set(false);
    this.router.navigate(['/categorias', toSlug(cat.nombre)]);
  }

  esTodas(): boolean {
    return this.categoriaActivaId() === null;
  }

  /** Convierte un color hex (#RRGGBB) a rgba con opacidad dada. */
  chipBg(hex: string | null | undefined, alpha = 0.15): string {
    if (!hex) return `rgba(107,114,128,${alpha})`;
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
