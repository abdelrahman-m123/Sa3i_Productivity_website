import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatTabsModule, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  links = [
    { path: '/signup', label: 'Sign Up' },
    { path: '/login', label: 'Login' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/profile', label: 'Profile' },
  ];
}
