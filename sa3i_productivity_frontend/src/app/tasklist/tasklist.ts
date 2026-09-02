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
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
@Component({
  selector: 'app-tasklist',
  imports: [CommonModule, AddTask, UpdateTask, MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatChipsModule],
  standalone: true,
  templateUrl: './tasklist.html',
  styleUrl: './tasklist.css',
})

export class Tasklist {
  myService = inject(TaskService);
  tasks: Task[] = [];
  addTaskForm!: FormGroup;
  constructor(private ref: ChangeDetectorRef, private dialog: MatDialog, private editDialog: MatDialog ) {}

  showAddTask = false;
  showUpdateTask = false; // toggle state
  editId!: string;

  toggleAddTask() {
    const dialogRef = this.dialog.open(AddTask, {
      width: '500px',
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

  loadtasks() {
    this.myService.getTasks().subscribe({
      next: (data) => {
        console.log(data);
        this.tasks = data;
        this.ref.detectChanges();
      },
    });
  }

  updateTask(id: string, index: number) {
    // this.myService.updateTask(id, { title: 'Updated Title' }).subscribe({
    //   next: (data) => {
    //     console.log(data);
    //     console.log(index);

    //     this.tasks[index] = data;
    //   },
    // });
    localStorage.setItem('editId', id);

    const dialogRef = this.editDialog.open(UpdateTask, {
      width: '500px',
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

  checkTask(completed: boolean, id: string, index: number){
    this.myService.updateTask(id,{completed: completed}).subscribe({
      next: (data) => {
        console.log(data);
        console.log(localStorage.getItem("editId"));
        
      },});
      
  }

  deleteTask(id: string, index: number) {
    this.myService.deleteTask(id).subscribe({
      next: (data) => {
        console.log(data);
        console.log(index);
        this.ref.detectChanges();
        this.loadtasks();
      },
    });
  }
}
