import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/authusers';

@Component({
  selector: 'app-landing',
  imports: [MatIconModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements AfterViewInit {
  @ViewChild('productTourVideo') private productTourVideo?: ElementRef<HTMLVideoElement>;

  readonly repositoryUrl = 'https://github.com/abdelrahman-m123/sa3i_productivity_frontend';
  loading = false;
  errorMessage = '';
  readonly year = new Date().getFullYear();

  readonly features = [
    {
      number: '01',
      icon: 'today',
      title: 'Plan for the energy you have',
      description:
        'Choose a minimum, normal, or maximum effort day and surface the work that matters now.',
    },
    {
      number: '02',
      icon: 'checklist',
      title: 'Keep every task legible',
      description:
        'Descriptions, priorities, categories, and dates stay visible without turning your list into noise.',
    },
    {
      number: '03',
      icon: 'calendar_month',
      title: 'Turn due dates into real time',
      description:
        'Schedule work on a calendar and move tasks between days as plans inevitably change.',
    },
    {
      number: '04',
      icon: 'view_kanban',
      title: 'See work move forward',
      description:
        'Use a focused Kanban flow to separate what is next, in progress, and already complete.',
    },
    {
      number: '05',
      icon: 'auto_awesome',
      title: 'Break down the goal, not your momentum',
      description:
        'Give the AI planner a goal, review its steps and estimates, then add the plan directly to your calendar.',
      featured: true,
    },
  ];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      this.playProductTour();
      return;
    }

    this.host.nativeElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    this.host.nativeElement.querySelectorAll('[data-reveal]').forEach((element) => {
      observer.observe(element);
    });

    const videoObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          this.playProductTour();
        } else {
          this.productTourVideo?.nativeElement.pause();
        }
      },
      { threshold: 0.35 },
    );
    const video = this.productTourVideo?.nativeElement;

    if (video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      videoObserver.observe(video);
    }

    this.destroyRef.onDestroy(() => observer.disconnect());
    this.destroyRef.onDestroy(() => videoObserver.disconnect());
  }

  enterDemo(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.authService.loginDemo().subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.message || 'The demo could not start. Please try again.';
      },
    });
  }

  private playProductTour(): void {
    const video = this.productTourVideo?.nativeElement;

    if (!video) {
      return;
    }

    video.muted = true;
    video.loop = true;
    void video.play().catch(() => undefined);
  }
}
