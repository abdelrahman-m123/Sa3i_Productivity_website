import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../services/usertasks';
import { Task } from '../models/task';
import id from '@angular/common/locales/id';
import { CommonModule } from '@angular/common';
import { AddTask } from '../add-task/add-task';
import { FormGroup } from '@angular/forms';
import { UpdateTask } from '../update-task/update-task';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/authusers';

type SortMode = 'dateAsc' | 'dateDesc' | 'priorityAsc' | 'priorityDesc';

@Component({
  selector: 'app-tasklist',
  imports: [
    CommonModule,
    AddTask,
    UpdateTask,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  standalone: true,
  templateUrl: './tasklist.html',
  styleUrl: './tasklist.css',
})

export class Tasklist {
  myService = inject(TaskService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  tasks: Task[] = [];
  sortMode: SortMode = 'dateAsc';
  addTaskForm!: FormGroup;
  constructor(private ref: ChangeDetectorRef, private dialog: MatDialog, private editDialog: MatDialog ) {}

  showAddTask = false;
  showUpdateTask = false; // toggle state
  editId!: string;

  toggleAddTask() {
    const dialogRef = this.dialog.open(AddTask, {
      width: '620px',
      disableClose: true, // optional
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result (new task):', result);
        // refresh list, etc.
        this.ref.detectChanges();
        this.loadtasks();

      }
    });
  }
  toggleUpdateTask() {
    
  }

  ngOnInit(): void {
    this.loadtasks();
  }

  get sortedTasks(): Task[] {
    const priorityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };

    return this.tasks
      .map((task, index) => ({ task, index }))
      .sort((first, second) => {
        let result = 0;

        if (this.sortMode === 'dateAsc' || this.sortMode === 'dateDesc') {
          result = this.compareDateKeys(
            this.toDateKey(first.task.dueDate),
            this.toDateKey(second.task.dueDate)
          );

          if (this.sortMode === 'dateDesc' && result !== 0) {
            result *= -1;
          }
        } else {
          result =
            (priorityOrder[first.task.priority || 'medium'] ?? 1) -
            (priorityOrder[second.task.priority || 'medium'] ?? 1);

          if (this.sortMode === 'priorityDesc') {
            result *= -1;
          }
        }

        return result || first.index - second.index;
      })
      .map(({ task }) => task);
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
  }

  loadtasks() {
    this.myService.getTasks().subscribe({
      next: (data) => {
        console.log(data);
        this.tasks = data;
        this.ref.detectChanges();
      },
    });
  }

  updateTask(task: Task) {
    // this.myService.updateTask(id, { title: 'Updated Title' }).subscribe({
    //   next: (data) => {
    //     console.log(data);
    //     console.log(index);

    //     this.tasks[index] = data;
    //   },
    // });
    localStorage.setItem('editId', task._id);

    const dialogRef = this.editDialog.open(UpdateTask, {
      width: '620px',
      disableClose: true, // optional
      data: { task },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result (new task):', result);
        // refresh list, etc.
        this.ref.detectChanges();
        this.loadtasks();

      }
    });
  }

  toDateKey(value?: string | Date): string {
    if (!value) {
      return '';
    }

    if (
      typeof value === 'string' &&
      (/^\d{4}-\d{2}-\d{2}$/.test(value) || /T00:00:00(?:\.000)?Z$/.test(value))
    ) {
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

  private compareDateKeys(firstDate: string, secondDate: string): number {
    if (!firstDate && !secondDate) {
      return 0;
    }

    if (!firstDate) {
      return 1;
    }

    if (!secondDate) {
      return -1;
    }

    return firstDate.localeCompare(secondDate);
  }

  checkTask(event: MatCheckboxChange, task: Task){
    if (this.authService.isDemoMode()) {
      event.source.checked = !!task.completed;
      this.snackBar.open(
        'Demo mode is read-only here. Use Calendar or Kanban to try checking items.',
        'Dismiss',
        {
          duration: 4500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
      return;
    }

    const completed = event.checked;
    this.myService.updateTask(task._id,{completed: completed}).subscribe({
      next: (data) => {
        console.log(data);
        console.log(localStorage.getItem("editId"));
        task.completed = completed;
        
      },});
      
  }

  deleteTask(task: Task) {
    this.myService.deleteTask(task._id).subscribe({
      next: (data) => {
        console.log(data);
        this.ref.detectChanges();
        this.loadtasks();
      },
    });
  }
}
