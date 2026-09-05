import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GoalPlanPreview, GoalPlanRequest } from '../models/goal-plan';
import { Task } from '../models/task';
import { injectApiBaseUrl } from './api-config';

@Injectable({ providedIn: 'root' })
export class GoalPlanningService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly url = `${injectApiBaseUrl()}/ai-plans`;

  previewGoal(request: GoalPlanRequest): Observable<GoalPlanPreview> {
    return this.http
      .post<{ data: { plan: GoalPlanPreview } }>(`${this.url}/preview`, request, {
        headers: this.getAuthHeaders(),
      })
      .pipe(map((response) => response.data.plan));
  }

  confirmPlan(plan: GoalPlanPreview): Observable<{ goal: unknown; tasks: Task[] }> {
    return this.http
      .post<{ data: { goal: unknown; tasks: Task[] } }>(
        `${this.url}/confirm`,
        { plan },
        { headers: this.getAuthHeaders() }
      )
      .pipe(map((response) => response.data));
  }

  private getAuthHeaders(): HttpHeaders {
    let token = '';

    if (isPlatformBrowser(this.platformId)) {
      try {
        token = JSON.parse(localStorage.getItem('userData') || '{}')?._token || '';
      } catch {
        token = '';
      }
    }

    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }
}
