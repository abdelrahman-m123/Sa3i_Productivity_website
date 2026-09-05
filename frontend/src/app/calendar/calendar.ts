import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../models/task';
import { TaskService } from '../services/usertasks';
import { AddTask } from '../add-task/add-task';

interface CalendarDay {
  date: Date;
  isoDate: string;
  label: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    DragDropModule,
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private ref = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  calendarDays: CalendarDay[] = [];
  unscheduledTasks: Task[] = [];
  dropListIds: string[] = [];
  selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.loadTasks();
  }

  get monthTitle(): string {
    return this.selectedMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.buildCalendar();
        this.ref.detectChanges();
      },
    });
  }

  previousMonth(): void {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.selectedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.buildCalendar();
  }

  addTaskToDay(isoDate: string): void {
    const dialogRef = this.dialog.open(AddTask, {
      width: '620px',
      disableClose: true,
      data: { dueDate: isoDate },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  checkTask(completed: boolean, task: Task): void {
    this.taskService.updateTask(task._id, { completed, status: completed ? 'done' : task.status || 'todo' }).subscribe({
      next: () => {
        task.completed = completed;
        task.status = completed ? 'done' : task.status || 'todo';
        this.buildCalendar();
        this.ref.detectChanges();
      },
    });
  }

  dropTaskOnDay(event: CdkDragDrop<Task[]>, isoDate: string): void {
    const task = event.item.data as Task;

    if (!task || this.getCalendarDateKey(task) === isoDate) {
      return;
    }

    const previousDueDate = task.dueDate;
    const previousScheduledStart = task.scheduledStart;
    const previousScheduledEnd = task.scheduledEnd;
    let update: Partial<Task>;

    if (task.scheduledStart && task.scheduledEnd) {
      const originalStart = new Date(task.scheduledStart);
      const originalEnd = new Date(task.scheduledEnd);
      const duration = originalEnd.getTime() - originalStart.getTime();
      const movedStart = new Date(
        `${isoDate}T${String(originalStart.getHours()).padStart(2, '0')}:${String(
          originalStart.getMinutes()
        ).padStart(2, '0')}:00`
      );
      const movedEnd = new Date(movedStart.getTime() + duration);

      task.scheduledStart = movedStart.toISOString();
      task.scheduledEnd = movedEnd.toISOString();
      update = { scheduledStart: task.scheduledStart, scheduledEnd: task.scheduledEnd };
    } else {
      task.dueDate = isoDate;
      update = { dueDate: isoDate };
    }

    this.buildCalendar();

    this.taskService.updateTask(task._id, update).subscribe({
      next: () => {
        this.ref.detectChanges();
      },
      error: () => {
        task.dueDate = previousDueDate;
        task.scheduledStart = previousScheduledStart;
        task.scheduledEnd = previousScheduledEnd;
        this.buildCalendar();
        this.ref.detectChanges();
      },
    });
  }

  private buildCalendar(): void {
    const tasksByDate = this.tasks.reduce<Record<string, Task[]>>((days, task) => {
      const key = this.getCalendarDateKey(task);

      if (key) {
        days[key] = [...(days[key] || []), task];
      }

      return days;
    }, {});

    this.unscheduledTasks = this.tasks.filter((task) => !this.getCalendarDateKey(task));

    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    this.calendarDays = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const isoDate = this.toDateKey(date) || '';

      return {
        date,
        isoDate,
        label: date.getDate(),
        isToday: isoDate === this.toDateKey(new Date()),
        isCurrentMonth: date.getMonth() === month,
        tasks: tasksByDate[isoDate] || [],
      };
    });

    this.dropListIds = this.calendarDays.map((day) => this.getDropListId(day.isoDate));
  }

  getDropListId(isoDate: string): string {
    return `calendar-day-${isoDate}`;
  }

  taskTime(task: Task): string {
    if (!task.scheduledStart || !task.scheduledEnd) {
      return '';
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return `${formatter.format(new Date(task.scheduledStart))}–${formatter.format(
      new Date(task.scheduledEnd)
    )}`;
  }

  private getCalendarDateKey(task: Task): string {
    if (task.scheduledStart) {
      return this.toDateKey(task.scheduledStart);
    }

    if (task.schedulingSource === 'ai') {
      return '';
    }

    return this.toDateKey(task.dueDate);
  }

  private toDateKey(value?: string | Date): string {
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
}
