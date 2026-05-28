import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { HomeStore } from '../../home.store';
import { LogoComponent } from '@core/components/logo/logo.component';

@Component({
  selector: 'app-home-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, RouterLinkActive, SelectModule, LogoComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  store = inject(HomeStore);

  ciudadOptions = computed(() =>
    this.store.ciudades().map((c) => ({ label: c.nombre, value: c.id }))
  );

}
