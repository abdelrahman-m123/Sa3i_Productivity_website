import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from "@angular/forms";
import { AuthService } from "../services/authusers";
import { Router } from '@angular/router';
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
        this.router.navigate(["/tasks"]);
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.message;
      },
    });
  }

  testlogin() {
      const { email, password } ={
    email: "test@example.com",
    password: "password123"
  };

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.loginForm.reset();
        this.router.navigate(["/tasks"]);
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.message;
      },
    });
  }
}
