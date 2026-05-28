import { Component, ChangeDetectionStrategy, inject, computed, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { HomeStore } from '../../home.store';
import { LogoComponent } from '@core/components/logo/logo.component';

@Component({
  selector: 'app-ciudad-bienvenida-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DialogModule, SelectModule, LogoComponent],
  templateUrl: './ciudad-bienvenida-modal.component.html',
})
export class CiudadBienvenidaModalComponent {
  store = inject(HomeStore);

  ciudadOptions = computed(() =>
    this.store.ciudades().map((c) => ({ label: c.nombre, value: c.id }))
  );

  // Pre-selecciona Bogotá (o la ciudad que resolvió el store por defecto)
  ciudadLocal = linkedSignal(() => this.store.ciudadId());

  confirmar(): void {
    const id = this.ciudadLocal();
    if (id !== null) {
      this.store.confirmarCiudadModal(id);
    } else {
      this.store.cerrarModalCiudad();
    }
  }

  cerrar(): void {
    this.store.cerrarModalCiudad();
  }
}
