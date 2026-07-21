import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { Task } from '../models/task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private URL = 'http://localhost:3000/tasks';

  getTasks(): Observable<any[]> {
    const token = this.getToken();

    if (!token) {
      return of([]);
    }

    const headers = this.getAuthHeaders(token);

    return this.http.get<any>(this.URL, { headers }).pipe(
      map((response) => {
        return response.data; 
      })
    );
  }


  addTask(task: Task): Observable<Task> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(this.URL, task, {headers}).pipe(
      map((response) =>{
        console.log(response);
        return response.data.task;
        
        
      })
    );
  }
  

  updateTask(taskId: any, updatedData: any): Observable<any> {
    console.log(taskId);

    const headers = this.getAuthHeaders();
    console.log(updatedData);
    
    return this.http.patch<any>(`${this.URL}/${taskId}`, updatedData, { headers }).pipe(
      map((response) => response.data.task)
    );
  }

 
  deleteTask(taskId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.URL}/${taskId}`, { headers }).pipe(
      map((response) => response.data.task)
    );
  }

  private getAuthHeaders(token = this.getToken()): HttpHeaders {
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  private getToken(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const userData = JSON.parse(localStorage.getItem("userData") || '{}');

    return userData?._token || '';
  }
  
}
