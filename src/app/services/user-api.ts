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

export interface UpdatePasswordPayload {
  token: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/user';

  /** Retorna o token JWT no corpo da resposta. */
  signIn(payload: SignInPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/session`, payload);
  }

  /** Cria um novo usuário. */
  signUp(payload: SignUpPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  /** Solicita o envio do e-mail de recuperação de senha. */
  sendPasswordResetEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Password/SendEmail`, { email }, { responseType: 'text' });
  }

  /** Atualiza a senha usando o token recebido por e-mail. */
  updatePassword(payload: UpdatePasswordPayload): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/Password`,
      { Token: payload.token, Password: payload.password },
      { responseType: 'text' },
    );
  }

  /** Retorna os dados do usuário autenticado (nome e email). */
  getProfile(): Observable<{ name: string; email: string }> {
    return this.http.get<{ name: string; email: string }>(`${this.apiUrl}/profile`);
  }
}
