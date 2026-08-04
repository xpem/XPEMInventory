import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './services/auth.service';
import { map, take, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // No SSR não há cookie nem API — deixa passar para o browser resolver
  if (!isPlatformBrowser(platformId)) return of(true);

  return authService.checkSessionStatus().pipe(
    take(1),
    map((isLoggedIn) => {
      if (isLoggedIn) return true;

      authService.logout();
      return router.createUrlTree(['user/signin'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
