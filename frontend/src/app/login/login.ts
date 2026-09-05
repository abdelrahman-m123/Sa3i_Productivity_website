import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from "@angular/forms";
import { AuthService } from "../services/authusers";
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-login',
  imports: [FormsModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loading = false;
  serverError = "";

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  @ViewChild("loginForm") loginForm!: NgForm;

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.serverError = "";

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.loginForm.reset();
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.message;
      },
    });
  }

  enterDemo() {
    this.loading = true;
    this.serverError = "";

    this.authService.loginDemo().subscribe({
      next: () => {
        this.loading = false;
        this.loginForm.reset();
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.message;
      },
    });
  }

  private redirectAfterLogin() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/tasks';

    void this.router.navigateByUrl(safeReturnUrl);
  }
}
