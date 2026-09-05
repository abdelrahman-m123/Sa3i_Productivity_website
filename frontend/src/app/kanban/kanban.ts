import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AddTask } from '../add-task/add-task';
import { Task } from '../models/task';
import { TaskService } from '../services/usertasks';

type TaskStatus = 'todo' | 'inProgress' | 'done';

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  icon: string;
  tasks: Task[];
}

@Component({
  selector: 'app-kanban',
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './kanban.html',
  styleUrl: './kanban.css',
})
export class Kanban {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private ref = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  columns: KanbanColumn[] = [
    { id: 'todo', title: 'Todo', icon: 'radio_button_unchecked', tasks: [] },
    { id: 'inProgress', title: 'In Progress', icon: 'pending_actions', tasks: [] },
    { id: 'done', title: 'Done', icon: 'task_alt', tasks: [] },
  ];
  columnIds = this.columns.map((column) => column.id);

  ngOnInit(): void {
    this.loadTasks();
  }

  addTask(): void {
    const dialogRef = this.dialog.open(AddTask, {
      width: '620px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  dropTask(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    const task = event.item.data as Task;
    const previousStatus = task.status || (task.completed ? 'done' : 'todo');
    const previousCompleted = !!task.completed;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    task.status = targetStatus;
    task.completed = targetStatus === 'done';

    this.taskService
      .updateTask(task._id, { status: targetStatus, completed: targetStatus === 'done' })
      .subscribe({
        next: () => {
          this.ref.detectChanges();
        },
        error: () => {
          task.status = previousStatus;
          task.completed = previousCompleted;
          this.buildColumns();
          this.ref.detectChanges();
        },
      });
  }

  checkTask(completed: boolean, task: Task): void {
    const status: TaskStatus = completed ? 'done' : 'todo';

    this.taskService.updateTask(task._id, { completed, status }).subscribe({
      next: () => {
        task.completed = completed;
        task.status = status;
        this.buildColumns();
        this.ref.detectChanges();
      },
    });
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

  private loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.buildColumns();
        this.ref.detectChanges();
      },
    });
  }

  private buildColumns(): void {
    this.columns = this.columns.map((column) => ({
      ...column,
      tasks: this.tasks.filter((task) => this.getStatus(task) === column.id),
    }));
    this.columnIds = this.columns.map((column) => column.id);
  }

  private getStatus(task: Task): TaskStatus {
    if (task.status) {
      return task.status;
    }

    return task.completed ? 'done' : 'todo';
  }
}
