import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const demoWriteToastInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        /demo mode/i.test(error.error?.message || '')
      ) {
        snackBar.open(error.error.message, 'Dismiss', {
          duration: 4500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }

      return throwError(() => error);
    })
  );
};
