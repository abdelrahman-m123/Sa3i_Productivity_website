import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { AddTask } from './add-task/add-task';
import { Tasklist } from './tasklist/tasklist';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { UpdateTask } from './update-task/update-task';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [Login, Signup, AddTask, Tasklist, Header,RouterOutlet, Footer, UpdateTask, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sa3i_productivity_frontend');
}
