import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { AddTask } from './add-task/add-task';
import { Tasklist } from './tasklist/tasklist';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { UpdateTask } from './update-task/update-task';
import { RouterModule } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    Login, Signup, AddTask, Tasklist, Header, RouterOutlet, 
    Footer, UpdateTask, RouterModule, Sidebar, CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sa3i_productivity_frontend');
  private authRoutes = ['/login', '/signup'];

  constructor(private router: Router) {
    // Optional: track route changes if needed
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Route changed
    });
  }

  isAuthRoute(): boolean {
    return this.authRoutes.some(route => 
      this.router.url.startsWith(route)
    );
  }
}