export type Role = 'missionary' | 'leader' | 'coordinator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string;
  baseId: string;
}

export interface SyncEvent {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT' | 'SUBMIT_TASK' | 'JUSTIFY_ABSENCE';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
  retryCount: number;
  createdAt: number;
  errorReason?: string;
}

export interface Task {
  id: string;
  activityId?: string;
  assigneeId?: string;
  title: string;
  description: string;
  sop?: {
    steps: string[];
    successCriteria: string;
    commonErrors: string;
  };
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface Activity {
  id: string;
  title: string;
  teamId: string;
  date: string;
  timeWindow: {
    start: string;
    end: string;
    toleranceMinutes: number;
  };
  rules: {
    requiresPhoto: boolean;
    requiresOfflineCode: boolean;
    requiresCheckout: boolean;
  };
  offlineCode?: string;
  status: 'open' | 'closed';
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}
