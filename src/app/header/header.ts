import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/authusers';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatTabsModule, RouterLinkActive, MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);
  userData :any;
  photo :any;
  name :any;
  email:any;
  profile = '/profile';
  login = '/login';
  signUp= '/signup';
  links = [
    // { path: '/tasks', label: 'Tasks' },
  ];
  isLoggedIn = false;

  ngOnInit() {
    const stored = localStorage.getItem('userData');
    if (stored) {
      this.isLoggedIn = true;
      this.userData = JSON.parse(stored);
      this.photo = this.userData.photo;
      this.name = this.userData.name;
      this.email = this.userData.email;
    } else {
      this.authService.user.subscribe(usr => {
      this.isLoggedIn = usr?.loggedIn;
      this.photo = usr.photo;
      this.name = usr.name;
      this.email = usr.email;
      console.log("user object",usr);
    });
    }

  }

  getFromLocalStorage(key: string): string | null {
  if (typeof window !== 'undefined' && localStorage) {
    return localStorage.getItem(key);
  }
  return null;
}

}
