import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { FooterComponent } from '@core/components/footer/footer.component';
import { SeoService } from '@core/services/seo.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-terminos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './terminos.component.html',
})
export class TerminosComponent {
  private router = inject(Router);
  private seo = inject(SeoService);

  readonly fechaActualizacion = '26 de mayo de 2025';

  constructor() {
    this.seo.setPage({
      title: 'Términos y Condiciones — Buen Plan',
      description:
        'Conoce los términos y condiciones de uso de Buen Plan S.A.S., plataforma de anunciantes de planes y descuentos en Colombia.',
    });
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
