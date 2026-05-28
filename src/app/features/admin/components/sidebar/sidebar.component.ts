import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  collapsed = input(false);

  readonly navSections: NavSection[] = [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'pi-th-large' },
        { label: 'Planes', route: '/admin/promociones', icon: 'pi-tag' },
      ],
    },
    {
      title: 'GESTIÓN',
      items: [
        { label: 'Categorías', route: '/admin/categorias', icon: 'pi-list' },
        { label: 'Usuarios', route: '/admin/usuarios', icon: 'pi-users' },
        { label: 'Configuración', route: '/admin/configuracion', icon: 'pi-cog' },
      ],
    },
  ];
}
