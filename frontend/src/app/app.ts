import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sa3i_productivity_frontend');
  private readonly publicRoutes = ['/', '/login', '/signup'];

  constructor(private router: Router) {
    // Optional: track route changes if needed
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Route changed
    });
  }

  isPublicRoute(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0];
    return this.publicRoutes.includes(path);
  }
}
