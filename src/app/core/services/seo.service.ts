import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Promocion } from '../../features/admin/promociones/models/promocion.model';

const SITE_NAME = 'Buen Plan';
const BASE_URL = 'https://buenplan.com.co';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.jpg`;
const DEFAULT_DESCRIPTION =
  'Encuentra los mejores planes y descuentos en restaurantes, ropa, tecnología, belleza y más en tu ciudad.';

export interface SeoConfig {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);
  private router = inject(Router);

  private get currentUrl(): string {
    const path = this.router.url.split('?')[0];
    const normalized = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
    return `${BASE_URL}${normalized}`;
  }

  setPage(config: SeoConfig): void {
    const fullTitle = `${config.title} | ${SITE_NAME}`;
    const description = config.description || DEFAULT_DESCRIPTION;
    const image = config.image ?? DEFAULT_IMAGE;
    const url = this.currentUrl;
    const type = config.type ?? 'website';

    this.titleService.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: config.noindex ? 'noindex, nofollow' : 'index, follow' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CO' });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);
  }

  setPromocion(promo: Promocion, ciudad: string, categoria: string): void {
    const tieneDescuento = promo.descuento > 0;

    const description = promo.descripcion?.trim()
      ? promo.descripcion
      : tieneDescuento
        ? `${promo.descuento}% de descuento en ${promo.marca}. Plan de ${categoria} en ${ciudad}.`
        : `Plan de ${categoria} en ${promo.marca}. Disponible en ${ciudad}.`;

    this.setPage({
      title: tieneDescuento
        ? `${promo.descuento}% en ${promo.marca} — ${promo.titulo}`
        : `${promo.marca} — ${promo.titulo}`,
      description,
      image: promo.imagenUrl || undefined,
      type: 'article',
    });

    if (promo.fechaDesde) {
      this.meta.updateTag({ property: 'article:published_time', content: promo.fechaDesde });
    }
    if (promo.fechaHasta) {
      this.meta.updateTag({ property: 'article:modified_time', content: promo.fechaHasta });
    }
    this.meta.updateTag({ property: 'article:section', content: categoria });

    const ahora = Date.now();
    const estaActiva =
      (!promo.fechaDesde || new Date(promo.fechaDesde).getTime() <= ahora) &&
      (!promo.fechaHasta || new Date(promo.fechaHasta).getTime() >= ahora);

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: promo.titulo,
      description,
      url: this.currentUrl,
      availability: estaActiva
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'LocalBusiness',
        name: promo.marca,
        address: { '@type': 'PostalAddress', addressLocality: ciudad, addressCountry: 'CO' },
      },
      ...(ciudad && {
        areaServed: { '@type': 'City', name: ciudad, addressCountry: 'CO' },
      }),
      category: categoria,
      discount: `${promo.descuento}%`,
      ...(tieneDescuento && {
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'COP',
          discount: promo.descuento,
        },
      }),
      ...(promo.fechaDesde && { validFrom: promo.fechaDesde }),
      ...(promo.fechaHasta && { validThrough: promo.fechaHasta }),
      ...(promo.imagenUrl && { image: promo.imagenUrl }),
    });
  }

  setJsonLd(schema: object): void {
    this.removeJsonLd();
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-json-ld', '');
    script.textContent = JSON.stringify(schema);
    this.doc.head.appendChild(script);
  }

  removeJsonLd(): void {
    this.doc.querySelector('script[data-json-ld]')?.remove();
  }

  private setCanonical(url: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (link) {
      link.href = url;
    } else {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      this.doc.head.appendChild(link);
    }
  }
}
