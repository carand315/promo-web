import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { RouterOutlet, RouterLink, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, SidebarComponent],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private auth = inject(AuthService);

  sidebarCollapsed = signal(false);

  private routeData = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute.firstChild;
        while (route?.firstChild) route = route.firstChild;
        return route?.snapshot.data ?? {};
      })
    ),
    { initialValue: {} }
  );

  pageTitle = computed(() => (this.routeData() as Record<string, string>)['title'] ?? '');
  pageSubtitle = computed(
    () => (this.routeData() as Record<string, string>)['subtitle'] ?? ''
  );

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
