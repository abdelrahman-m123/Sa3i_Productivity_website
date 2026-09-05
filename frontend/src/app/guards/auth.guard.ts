import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/authusers';

export const authGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);

  // Authentication is restored from localStorage in the browser. API routes
  // remain protected independently by the backend JWT middleware.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
