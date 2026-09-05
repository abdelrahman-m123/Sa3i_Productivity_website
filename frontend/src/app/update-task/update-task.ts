import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Task } from '../models/task';
import { TaskService } from '../services/usertasks';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Inject } from '@angular/core';


@Component({
  selector: 'app-update-task',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIcon, MatSelectModule, MatFormFieldModule, MatInputModule ],
  templateUrl: './update-task.html',
  styleUrl: './update-task.css'
})
export class UpdateTask {
  addTaskForm !: FormGroup;
  newTask!: Task;
  myService = inject(TaskService);
  constructor(
    private dialogRef: MatDialogRef<UpdateTask>,
    @Inject(MAT_DIALOG_DATA) private data: { task?: Task } | null
  ) {}

  
  ngOnInit() {
    const task = this.data?.task;

    this.addTaskForm = new FormGroup({
      title: new FormControl(task?.title ?? null),
      description: new FormControl(task?.description ?? null),
      dueDate: new FormControl(task?.dueDate ? task.dueDate.slice(0, 10) : null),
      scheduledStart: new FormControl(this.toLocalDateTimeInput(task?.scheduledStart)),
      scheduledEnd: new FormControl(this.toLocalDateTimeInput(task?.scheduledEnd)),
      completed: new FormControl(task?.completed ?? null),
      priority: new FormControl(task?.priority ?? null),
      category: new FormControl(task?.category ?? null),
    });
  }

  private toLocalDateTimeInput(value?: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }

   
  
   onSubmit() {
      console.log(this.addTaskForm);
      
      if (this.addTaskForm.invalid){
        this.addTaskForm.markAllAsTouched();
        console.log('invalid');
        
        return
      }else{
        const rawTask = this.withIsoSchedule(this.addTaskForm.value);

  
      this.newTask = Object.fromEntries(
        Object.entries(rawTask).filter(([_, v]) => v != null && v !== '')
      ) as unknown as Task;

      this.myService.updateTask(this.data?.task?._id ?? localStorage.getItem("editId"),this.newTask).subscribe({
      next: (data) => {
        console.log(data);
        console.log(localStorage.getItem("editId"));
        this.dialogRef.close(data);
        
      },
    });
        console.log(this.newTask);
        
      }
      
    }

  private withIsoSchedule(rawTask: Record<string, unknown>): Record<string, unknown> {
    return {
      ...rawTask,
      scheduledStart: rawTask['scheduledStart']
        ? new Date(String(rawTask['scheduledStart'])).toISOString()
        : rawTask['scheduledStart'],
      scheduledEnd: rawTask['scheduledEnd']
        ? new Date(String(rawTask['scheduledEnd'])).toISOString()
        : rawTask['scheduledEnd'],
    };
  }
}
