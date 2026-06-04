import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '@core/services/seo.service';
import { InputTextModule } from 'primeng/inputtext';
import { SliderModule } from 'primeng/slider';
import { CategoriaNavbarComponent } from '../../components/categoria-navbar/categoria-navbar.component';
import { CiudadBienvenidaModalComponent } from '../../components/ciudad-bienvenida-modal/ciudad-bienvenida-modal.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PromoCardComponent } from '../../components/promo-card/promo-card.component';
import { PromoCarouselComponent } from '../../components/promo-carousel/promo-carousel.component';
import { PromoMapComponent } from '../../components/promo-map/promo-map.component';
import { HomeStore } from '../../home.store';
import { SidebarService } from '../../services/sidebar.service';
import { FooterComponent } from '@core/components/footer/footer.component';
import { LogoComponent } from '@core/components/logo/logo.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    SliderModule,
    InputTextModule,
    NavbarComponent,
    PromoCarouselComponent,
    PromoCardComponent,
    PromoMapComponent,
    CategoriaNavbarComponent,
    CiudadBienvenidaModalComponent,
    FooterComponent,
    LogoComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  store = inject(HomeStore);
  sidebar = inject(SidebarService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.store.loadData();
    }
  };

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const slug = params.get('slug');
        this.store.setCategoriaBySlug(slug);
        this.updateSeo(slug);
      });
  }

  ngOnInit(): void {
    if (!this.store.loaded()) {
      this.store.loadData();
    }

    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  clearFiltros(): void {
    this.store.setSearch('');
    this.store.setDescuentoMin(0);
  }

  private updateSeo(slug: string | null): void {
    if (slug) {
      const nombre = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      this.seo.setPage({
        title: `Planes de ${nombre}`,
        description: `Planes y ofertas de ${nombre} cerca de ti. Ahorra con Buen Plan.`,
      });
      this.seo.removeJsonLd();
    } else {
      this.seo.setPage({
        title: 'Planes y descuentos cerca de ti',
        description: 'Encuentra las mejores promociones en restaurantes, ropa, tecnología, belleza y más en tu ciudad.',
      });
      this.seo.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Buen Plan',
        url: 'https://unbuenplan.com.co',
        description: 'Plataforma de planes y descuentos en Colombia.',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://unbuenplan.com.co/?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      });
    }
  }
}
