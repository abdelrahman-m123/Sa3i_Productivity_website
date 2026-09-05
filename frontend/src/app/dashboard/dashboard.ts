import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../models/task';
import { TaskService } from '../services/usertasks';
import { RouterLink } from '@angular/router';

type EffortLevel = 'minimum' | 'normal' | 'maximum';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatButtonModule, MatCheckboxModule, MatChipsModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private taskService = inject(TaskService);
  private ref = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  effortLevel: EffortLevel = 'normal';
  effortLevels: Array<{ value: EffortLevel; label: string; icon: string }> = [
    { value: 'minimum', label: 'Minimum', icon: 'bolt' },
    { value: 'normal', label: 'Normal', icon: 'checklist' },
    { value: 'maximum', label: 'Maximum', icon: 'rocket_launch' },
  ];

  ngOnInit(): void {
    this.loadTasks();
  }

  get selectedTasks(): Task[] {
    const today = this.toDateKey(new Date());
    const maxDate = this.addDays(today, 3);

    return this.tasks
      .filter((task) => !task.completed)
      .filter((task) => {
        const taskDate = this.toDateKey(task.dueDate);

        if (!taskDate) {
          return false;
        }

        if (this.effortLevel === 'minimum') {
          return taskDate <= today && task.priority === 'high';
        }

        if (this.effortLevel === 'maximum') {
          return taskDate <= maxDate;
        }

        return taskDate <= today;
      })
      .sort((a, b) => this.sortTasks(a, b));
  }

  get todayCount(): number {
    const today = this.toDateKey(new Date());
    return this.tasks.filter((task) => this.toDateKey(task.dueDate) === today && !task.completed).length;
  }

  get overdueCount(): number {
    const today = this.toDateKey(new Date());
    return this.tasks.filter((task) => {
      const taskDate = this.toDateKey(task.dueDate);
      return !!taskDate && taskDate < today && !task.completed;
    }).length;
  }

  get highPriorityCount(): number {
    return this.selectedTasks.filter((task) => task.priority === 'high').length;
  }

  setEffortLevel(level: EffortLevel): void {
    this.effortLevel = level;
  }

  checkTask(completed: boolean, task: Task): void {
    this.taskService
      .updateTask(task._id, { completed, status: completed ? 'done' : task.status || 'todo' })
      .subscribe({
        next: () => {
          task.completed = completed;
          task.status = completed ? 'done' : task.status || 'todo';
          this.ref.detectChanges();
        },
      });
  }

  private loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.ref.detectChanges();
      },
    });
  }

  private sortTasks(first: Task, second: Task): number {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const firstDate = this.toDateKey(first.dueDate);
    const secondDate = this.toDateKey(second.dueDate);

    if (firstDate !== secondDate) {
      return firstDate.localeCompare(secondDate);
    }

    return (priorityOrder[first.priority || 'medium'] ?? 1) - (priorityOrder[second.priority || 'medium'] ?? 1);
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);

    return this.toDateKey(date);
  }

  toDateKey(value?: string | Date): string {
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
