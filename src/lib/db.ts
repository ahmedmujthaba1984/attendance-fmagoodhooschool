import Dexie, { type Table } from 'dexie';
import { Student, AttendanceRecord, OfflineQueueItem, AcademicCalendarDay, ClassDelegation } from '../types';

export class AttendanceOfflineDB extends Dexie {
  students!: Table<Student, string>;
  attendance!: Table<AttendanceRecord, string>;
  syncQueue!: Table<OfflineQueueItem, string>;
  calendar!: Table<AcademicCalendarDay, string>;
  delegations!: Table<ClassDelegation, string>;

  constructor() {
    super('MoEAttendancePortalDB');
    this.version(1).stores({
      students: 'id, admissionNumber, gradeLevel, status',
      attendance: 'id, studentId, date, sessionType, syncStatus, [studentId+date+sessionType]',
      syncQueue: 'id, clientSyncId, createdAt',
      calendar: 'id, date, dayType',
      delegations: 'id, date, gradeLevel',
    });
  }
}

export const offlineDb = new AttendanceOfflineDB();
