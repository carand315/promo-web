import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { CategoriaConConteo } from '../../home.model';
import { toSlug } from '../../utils/slug.utils';
import { SidebarService } from '../../services/sidebar.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-categoria-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TooltipModule],
  templateUrl: './categoria-navbar.component.html',
})
export class CategoriaNavbarComponent {
  readonly whatsappUrl =
    `https://wa.me/${environment.whatsappPlataforma}` +
    `?text=${encodeURIComponent('Hola, me interesa publicar mi negocio en Buen Plan')}`;
  categorias = input.required<CategoriaConConteo[]>();
  categoriaActivaId = input<number | null>(null);
  totalPromos = input(0);

  sidebar = inject(SidebarService);
  drawerOpen = signal(false);

  private router = inject(Router);

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
