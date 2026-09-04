import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/user';

  signIn(payload: SignInPayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/session`, {
      ...payload,
      source: 'xpem-inventory',
    });
  }

  refreshToken(refreshToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/session/refresh`, { refreshToken });
  }

  signUp(payload: SignUpPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  sendPasswordResetEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/RecoverPassword`, { email }, { responseType: 'text' });
  }

  getProfile(): Observable<{ name: string; email: string }> {
    return this.http.get<{ name: string; email: string }>(`${this.apiUrl}/profile`);
  }
}
