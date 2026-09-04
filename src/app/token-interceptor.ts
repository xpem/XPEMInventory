import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';

const addAuthHeader = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

export const tokenInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token ? addAuthHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isRefreshRequest = req.url.includes('/session/refresh');
      if (error.status !== 401 || isRefreshRequest) return throwError(() => error);

      return authService.refreshSession().pipe(
        switchMap((refreshed) => {
          if (!refreshed) return throwError(() => error);
          const newToken = authService.getToken();
          return next(newToken ? addAuthHeader(req, newToken) : req);
        }),
      );
    }),
  );
};
