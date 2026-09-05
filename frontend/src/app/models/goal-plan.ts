export interface GoalPlanItem {
  clientId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'study' | 'health' | 'other';
  order: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  unscheduledReason: string | null;
  included?: boolean;
}

export interface GoalPlanPreview {
  previewId: string;
  originalGoal: string;
  title: string;
  deadline: string;
  assumptions: string[];
  timeZone: string;
  workingHours: {
    start: string;
    end: string;
  };
  includeWeekends: boolean;
  totalEstimatedMinutes: number;
  scheduledMinutes: number;
  items: GoalPlanItem[];
}

export interface GoalPlanRequest {
  goal: string;
  targetDate?: string;
  timeZone: string;
  workingHours: {
    start: string;
    end: string;
  };
  includeWeekends: boolean;
}
