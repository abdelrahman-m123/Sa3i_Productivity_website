import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../services/authusers';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [MatButton],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  userData = JSON.parse(localStorage.getItem("userData") || '{}');
  photo = this.userData.photo;
  name = this.userData.name;
  email = this.userData.email;
  private authService = inject(AuthService);
  private router = inject(Router);


  logout(){
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
