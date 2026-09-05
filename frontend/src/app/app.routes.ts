import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Tasklist } from './tasklist/tasklist';
import { Profile } from './profile/profile';
import { Calendar } from './calendar/calendar';
import { Dashboard } from './dashboard/dashboard';
import { Kanban } from './kanban/kanban';
import { GoalPlanner } from './goal-planner/goal-planner';
import { Landing } from './landing/landing';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing, pathMatch: 'full' },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'tasks', component: Tasklist },
      { path: 'calendar', component: Calendar },
      { path: 'planner', component: GoalPlanner },
      { path: 'kanban', component: Kanban },
      { path: 'profile', component: Profile },
    ],
  },
  { path: '**', redirectTo: '' },
];
