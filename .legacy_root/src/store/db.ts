import Dexie, { Table } from 'dexie';
import { SyncEvent, Task, Activity, FAQItem } from '../types';

export class MissaoOpsDB extends Dexie {
  syncQueue!: Table<SyncEvent, string>;
  tasks!: Table<Task, string>;
  activities!: Table<Activity, string>;
  faq!: Table<FAQItem, string>;

  constructor() {
    super('MissaoOpsDB');
    this.version(1).stores({
      syncQueue: 'id, type, status, createdAt',
      tasks: 'id, activityId, status, dueDate',
      activities: 'id, date, status',
      faq: 'id, category'
    });
  }
}

export const db = new MissaoOpsDB();
