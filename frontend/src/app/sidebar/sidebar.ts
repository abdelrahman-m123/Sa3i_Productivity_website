import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/authusers';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  standalone: true
})
export class Sidebar {
  private authService = inject(AuthService);
  private uploadsUrl = 'http://localhost:3000/uploads/';

  user = toSignal(this.authService.user);
  failedPhoto = signal<string | null>(null);
  name = computed(() => this.user()?.name || 'Profile');
  email = computed(() => this.user()?.email || '');
  isDemo = computed(() => this.user()?.isDemo === true);
  profilePhotoUrl = computed(() => {
    const photo = this.user()?.photo;
    if (!photo || this.failedPhoto() === photo) {
      return null;
    }

    return this.getPhotoUrl(photo);
  });

  collapsed = false;

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  onProfilePhotoError(): void {
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
