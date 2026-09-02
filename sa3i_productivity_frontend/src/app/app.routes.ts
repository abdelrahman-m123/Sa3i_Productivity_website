import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Tasklist } from './tasklist/tasklist';
import { Profile } from './profile/profile';
import { Calendar } from './calendar/calendar';
import { Dashboard } from './dashboard/dashboard';
import { Kanban } from './kanban/kanban';

export const routes: Routes = [
    {path:"", redirectTo: "signup", pathMatch: "full"},
    {path:"signup", component: Signup},
    {path:"login", component: Login},
    {path:"dashboard", component: Dashboard},
    {path:"tasks", component: Tasklist},
    {path:"calendar", component: Calendar},
    {path:"kanban", component: Kanban},
    {path:"profile", component: Profile}
];
//route guards
