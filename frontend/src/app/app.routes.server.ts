import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'tasks', renderMode: RenderMode.Client },
  { path: 'calendar', renderMode: RenderMode.Client },
  { path: 'planner', renderMode: RenderMode.Client },
  { path: 'kanban', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
