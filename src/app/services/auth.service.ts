import { Injectable, inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  private platformId = inject(PLATFORM_ID);

  private isAuthenticatedSignal = signal<boolean>(false);
  private userNameSignal = signal<string>('');
  private userEmailSignal = signal<string>('');

  private readonly TOKEN_KEY = 'xpem_inv_token';
  readonly apiUrl = '/api/user';

  isAuthenticated = computed(() => this.isAuthenticatedSignal());
  userName = computed(() => this.userNameSignal());
  userEmail = computed(() => this.userEmailSignal());

  constructor() {
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isAuthenticatedSignal.set(false);
      return;
    }
    const token = this.cookieService.get(this.TOKEN_KEY);
    this.isAuthenticatedSignal.set(!!token);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.cookieService.get(this.TOKEN_KEY) || null;
  }

  saveToken(token: string): void {
    this.cookieService.set(this.TOKEN_KEY, token, {
      expires: 3,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
    this.isAuthenticatedSignal.set(true);
  }

  logout(): void {
    this.cookieService.delete(this.TOKEN_KEY, '/');
    this.isAuthenticatedSignal.set(false);
    this.userNameSignal.set('');
    this.userEmailSignal.set('');
  }

  /** Valida a sessão contra a API — usado pelo authGuard. */
  checkSessionStatus(): Observable<boolean> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        const hasSession = !!response?.email;
        this.isAuthenticatedSignal.set(hasSession);
        if (hasSession) {
          this.userNameSignal.set(response.name ?? '');
          this.userEmailSignal.set(response.email ?? '');
        }
        return hasSession;
      }),
      catchError((error) => {
        console.error('Erro ao verificar status da sessão:', error);
        this.isAuthenticatedSignal.set(false);
        return of(false);
      }),
    );
  }
}
