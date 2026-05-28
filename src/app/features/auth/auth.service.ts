import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse } from './auth.model';

const TOKEN_KEY = 'promo_admin_token';
const EXPIRA_KEY = 'promo_admin_expira';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/auth`;

  private _token = signal<string | null>(this.loadToken());

  /** Token JWT activo, o null si no hay sesión. */
  token = this._token.asReadonly();

  /** true si hay un token válido (no expirado). */
  isLoggedIn = computed(() => {
    const t = this._token();
    if (!t) return false;
    const expira = isPlatformBrowser(this.platformId)
      ? localStorage.getItem(EXPIRA_KEY)
      : null;
    if (!expira) return false;
    return new Date(expira) > new Date();
  });

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((res) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(EXPIRA_KEY, res.expira);
        }
        this._token.set(res.token);
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRA_KEY);
    }
    this._token.set(null);
  }

  private loadToken(): string | null {
    // Solo en browser — en SSR no hay localStorage
    if (typeof localStorage === 'undefined') return null;
    const expira = localStorage.getItem(EXPIRA_KEY);
    if (!expira || new Date(expira) <= new Date()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRA_KEY);
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }
}
