import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly whatsappUrl =
    `https://wa.me/${environment.whatsappPlataforma}` +
    `?text=${encodeURIComponent('Hola, me interesa publicar mi negocio en Buen Plan')}`;
}
