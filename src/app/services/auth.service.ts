import { Injectable, inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { TokenResponse } from './user-api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  private platformId = inject(PLATFORM_ID);

  private isAuthenticatedSignal = signal<boolean>(false);
  private userNameSignal = signal<string>('');
  private userEmailSignal = signal<string>('');

  private readonly TOKEN_KEY = 'xpem_inv_token';
  private readonly REFRESH_TOKEN_KEY = 'xpem_inv_refresh';
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

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.cookieService.get(this.REFRESH_TOKEN_KEY) || null;
  }

  saveTokens(response: TokenResponse): void {
    const cookieOptions = { expires: 3, secure: true, sameSite: 'Lax' as const, path: '/' };
    this.cookieService.set(this.TOKEN_KEY, response.token, cookieOptions);
    this.cookieService.set(this.REFRESH_TOKEN_KEY, response.refreshToken, cookieOptions);
    this.isAuthenticatedSignal.set(true);
  }

  /** @deprecated use saveTokens instead */
  saveToken(token: string): void {
    this.cookieService.set(this.TOKEN_KEY, token, {
      expires: 3, secure: true, sameSite: 'Lax', path: '/',
    });
    this.isAuthenticatedSignal.set(true);
  }

  refreshSession(): Observable<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return of(false);

    return this.http.post<TokenResponse>(`${this.apiUrl}/session/refresh`, { refreshToken }).pipe(
      tap((res) => this.saveTokens(res)),
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      }),
    );
  }

  logout(): void {
    this.cookieService.delete(this.TOKEN_KEY, '/');
    this.cookieService.delete(this.REFRESH_TOKEN_KEY, '/');
    this.isAuthenticatedSignal.set(false);
    this.userNameSignal.set('');
    this.userEmailSignal.set('');
  }

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
      catchError(() => {
        this.isAuthenticatedSignal.set(false);
        return of(false);
      }),
    );
  }
}
