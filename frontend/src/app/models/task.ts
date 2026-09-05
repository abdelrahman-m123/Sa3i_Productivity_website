export interface Task {
  _id: string;
  title: string;
  description?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high"; // restricts to allowed values
  category?: string;
  dueDate?: string;
  goalId?: string;
  estimatedMinutes?: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  schedulingSource?: "manual" | "ai";
  scheduleLocked?: boolean;
  status?: "todo" | "inProgress" | "done";
  userId?: string;
  createdAt?: string; 
  __v?: number;
}
