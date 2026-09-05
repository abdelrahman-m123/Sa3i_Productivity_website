import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, inject, PLATFORM_ID } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoalPlanItem, GoalPlanPreview } from '../models/goal-plan';
import { GoalPlanningService } from '../services/goal-planning';

@Component({
  selector: 'app-goal-planner',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './goal-planner.html',
  styleUrl: './goal-planner.css',
})
export class GoalPlanner {
  private planningService = inject(GoalPlanningService);
  private platformId = inject(PLATFORM_ID);
  private ref = inject(ChangeDetectorRef);
  private router = inject(Router);

  readonly minDate = this.toDateInput(new Date());
  readonly timeZone = isPlatformBrowser(this.platformId)
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    : 'UTC';

  plannerForm = new FormGroup({
    goal: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)],
    }),
    targetDate: new FormControl('', { nonNullable: true }),
    workingStart: new FormControl('09:00', { nonNullable: true, validators: Validators.required }),
    workingEnd: new FormControl('17:00', { nonNullable: true, validators: Validators.required }),
    includeWeekends: new FormControl(false, { nonNullable: true }),
  });

  plan: GoalPlanPreview | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  get selectedCount(): number {
    return this.plan?.items.filter((item) => item.included !== false).length || 0;
  }

  get scheduledCount(): number {
    return (
      this.plan?.items.filter((item) => item.included !== false && item.scheduledStart).length || 0
    );
  }

  generatePlan(): void {
    if (this.plannerForm.invalid) {
      this.plannerForm.markAllAsTouched();
      return;
    }

    const values = this.plannerForm.getRawValue();
    if (values.workingEnd <= values.workingStart) {
      this.errorMessage = 'Working hours must end after they start.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.planningService
      .previewGoal({
        goal: values.goal.trim(),
        targetDate: values.targetDate || undefined,
        timeZone: this.timeZone,
        workingHours: { start: values.workingStart, end: values.workingEnd },
        includeWeekends: values.includeWeekends,
      })
      .subscribe({
        next: (plan) => {
          this.plan = {
            ...plan,
            items: plan.items.map((item) => ({ ...item, included: true })),
          };
          this.loading = false;
          this.ref.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.error?.message || 'Could not create a plan. Please try again.';
          this.loading = false;
          this.ref.detectChanges();
        },
      });
  }

  confirmPlan(): void {
    if (!this.plan || this.selectedCount === 0) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.planningService.confirmPlan(this.plan).subscribe({
      next: (result) => {
        this.successMessage = `${result.tasks.length} tasks were added to your calendar.`;
        this.saving = false;
        this.ref.detectChanges();
        void this.router.navigate(['/calendar']);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Could not save this plan. Please try again.';
        this.saving = false;
        this.ref.detectChanges();
      },
    });
  }

  cancelPlan(): void {
    if (this.saving) {
      return;
    }

    this.plan = null;
    this.errorMessage = '';
    this.saving = false;
    this.ref.detectChanges();
  }

  updateIncluded(item: GoalPlanItem, included: boolean): void {
    item.included = included;
  }

  updateTitle(item: GoalPlanItem, event: Event): void {
    item.title = (event.target as HTMLInputElement).value;
  }

  updateEstimate(item: GoalPlanItem, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) {
      item.estimatedMinutes = Math.max(15, Math.min(480, value));
    }
  }

  formatSlot(isoDate: string | null): string {
    if (!isoDate) {
      return 'Unscheduled';
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.plan?.timeZone || this.timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoDate));
  }

  formatTime(isoDate: string | null): string {
    if (!isoDate) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.plan?.timeZone || this.timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoDate));
  }

  viewCalendar(): void {
    void this.router.navigate(['/calendar']);
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
