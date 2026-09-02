import { Component, inject, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { AuthService } from "../services/authusers";

@Component({
  selector: "app-signup",
  imports: [FormsModule],
  templateUrl: "./signup.html",
  styleUrl: "./signup.css",
})
export class Signup {
  loading = false;
  serverError = "";
  serverSuccess = "";
  selectedFile: File | null = null;
  selectedFileName = "";
  passwordMismatch = false;

  private authService = inject(AuthService);
  @ViewChild("signUpForm") signUpForm!: NgForm;

  onFileSelected(e: Event) {
    console.log(e);

    const input = e.target as HTMLInputElement;

    this.selectedFile = input.files?.[0] || null;
    this.selectedFileName = this.selectedFile?.name || "";
  }

  onSubmit() {
    if (this.signUpForm.invalid) return;

    const { name, email, password, confirmPassword } = this.signUpForm.value;
    this.passwordMismatch = password !== confirmPassword;
    if (this.passwordMismatch) return;

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("password", password);
    fd.append("confirmPassword", confirmPassword); // should handle in front instead of back
    if (this.selectedFile) fd.append("photo", this.selectedFile);

    this.loading = true;
    this.serverError = "";
    this.serverSuccess = "";

    this.authService.signup(fd).subscribe({
      next: (user) => {
        console.log(user);
        this.loading = false;
        this.serverSuccess = "Account created successfully";
        this.signUpForm.reset();
        this.selectedFile = null;
        this.selectedFileName = "";
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.message;
      },
    });
  }
}