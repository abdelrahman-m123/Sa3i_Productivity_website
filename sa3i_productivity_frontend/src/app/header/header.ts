import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/authusers';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatTabsModule, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);
  private uploadsUrl = 'http://localhost:3000/uploads/';
  
  user = toSignal(this.authService.user);
  
  failedPhoto = signal<string | null>(null);
  isLoggedIn = computed(() => !!this.user()?._token);
  name = computed(() => this.user()?.name || null);
  email = computed(() => this.user()?.email || null);
  profilePhotoUrl = computed(() => {
    const photo = this.user()?.photo;
    if (!photo || this.failedPhoto() === photo) return null;

    return this.getPhotoUrl(photo);
  });
  
  profile = '/profile';
  login = '/login';
  signUp = '/signup';
  links = [
    // { path: '/tasks', label: 'Tasks' },
  ];

  ngOnInit() {
    this.authService.autoLogin();
  }

  onProfilePhotoError() {
    this.failedPhoto.set(this.user()?.photo || null);
  }

  private getPhotoUrl(photo: string): string {
    const trimmedPhoto = photo.trim();

    if (/^(https?:|data:|blob:)/i.test(trimmedPhoto)) {
      return trimmedPhoto;
    }

    if (trimmedPhoto.startsWith('/uploads/')) {
      return `http://localhost:3000${trimmedPhoto}`;
    }

    return `${this.uploadsUrl}${trimmedPhoto}`;
  }
}
