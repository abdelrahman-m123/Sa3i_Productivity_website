import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/authusers';
import { TaskService } from '../services/usertasks';
import { Task } from '../models/task';
import { getUploadUrl, injectApiBaseUrl } from '../services/api-config';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private apiBaseUrl = injectApiBaseUrl();
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private router = inject(Router);

  user = toSignal(this.authService.user);
  tasks = signal<Task[]>([]);
  failedPhoto = signal<string | null>(null);
  isEditing = false;
  isSaving = false;
  serverError = '';
  serverSuccess = '';
  selectedFile: File | null = null;
  selectedFileName = '';

  profileForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  name = computed(() => this.user()?.name || '');
  email = computed(() => this.user()?.email || '');

  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => this.tasks().filter((task) => task.completed).length);
  pendingTasks = computed(() => this.totalTasks() - this.completedTasks());
  highPriorityTasks = computed(
    () => this.tasks().filter((task) => task.priority === 'high' && !task.completed).length
  );
  overdueTasks = computed(() => {
    const today = this.toDateKey(new Date());

    return this.tasks().filter((task) => {
      const dueDate = this.toDateKey(task.dueDate);
      return !!dueDate && dueDate < today && !task.completed;
    }).length;
  });
  dueTodayTasks = computed(() => {
    const today = this.toDateKey(new Date());
    return this.tasks().filter((task) => this.toDateKey(task.dueDate) === today && !task.completed).length;
  });
  completionRate = computed(() => {
    if (!this.totalTasks()) {
      return 0;
    }

    return Math.round((this.completedTasks() / this.totalTasks()) * 100);
  });
  analytics = computed(() => [
    { label: 'Total tasks', value: this.totalTasks(), icon: 'inventory_2' },
    { label: 'Completed', value: this.completedTasks(), icon: 'task_alt' },
    { label: 'Pending', value: this.pendingTasks(), icon: 'pending_actions' },
    { label: 'Due today', value: this.dueTodayTasks(), icon: 'today' },
    { label: 'Overdue', value: this.overdueTasks(), icon: 'warning' },
    { label: 'High priority', value: this.highPriorityTasks(), icon: 'priority_high' },
  ]);

  get profilePhotoUrl(): string | null {
    const photo = this.user()?.photo;
    if (!photo || this.failedPhoto() === photo) return null;

    return this.getPhotoUrl(photo);
  }

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: () => this.resetForm(),
    });

    this.taskService.getTasks().subscribe({
      next: (tasks) => this.tasks.set(tasks),
    });

    this.resetForm();
  }

  startEdit(): void {
    this.resetForm();
    this.serverError = '';
    this.serverSuccess = '';
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.serverError = '';
    this.serverSuccess = '';
    this.resetForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.selectedFileName = this.selectedFile?.name || '';
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('name', this.profileForm.value.name || '');
    formData.append('email', this.profileForm.value.email || '');

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.isSaving = true;
    this.serverError = '';
    this.serverSuccess = '';

    this.authService.updateProfile(formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.selectedFile = null;
        this.selectedFileName = '';
        this.failedPhoto.set(null);
        this.serverSuccess = 'Profile updated successfully';
        this.resetForm();
      },
      error: (err) => {
        this.isSaving = false;
        this.serverError = err.message;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onProfilePhotoError(): void {
    this.failedPhoto.set(this.user()?.photo || null);
  }

  private resetForm(): void {
    this.profileForm.patchValue({
      name: this.name(),
      email: this.email(),
    });
  }

  private getPhotoUrl(photo: string): string {
    return getUploadUrl(photo, this.apiBaseUrl);
  }

  private toDateKey(value?: string | Date): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
