import React, { useState } from 'react';
import { Layers, Database, Copy, Check, FileCode, Shield } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const DatabaseSchemaViewer: React.FC = () => {
  const { isRTL } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'prisma' | 'sql'>('prisma');
  const [copied, setCopied] = useState(false);

  const prismaSchemaCode = `// Prisma Schema for Maldives School Attendance & MoE Portal
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  TEACHER
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  LEAVE
}

enum LeaveReason {
  NONE
  SICK_LEAVE
  SICK_LEAVE_MC
  NOT_IN_ISLAND
  OFFICIAL_DUTY
  OTHER
}

enum SessionType {
  MORNING_BEFORE_BREAK
  POST_BREAK
}

model User {
  id              String            @id @default(uuid())
  username        String            @unique
  fullName        String
  fullNameDhivehi String
  role            Role              @default(TEACHER)
  designation     String
  phone           String?
  assignedGrade   String?
  isActive        Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  attendance      AttendanceRecord[]
  delegationsFrom ClassDelegation[] @relation("OriginalTeacher")
  delegationsTo   ClassDelegation[] @relation("SubstituteTeacher")
}

model Student {
  id                 String             @id @default(uuid())
  admissionNumber    String             @unique
  fullName           String
  fullNameDhivehi    String
  gender             String
  gradeLevel         String
  section            String             @default("A")
  parentContactPhone String
  parentEmail        String?
  guardianName       String?
  islandAddress      String?
  status             String             @default("ACTIVE")
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  attendanceRecords  AttendanceRecord[]

  @@index([gradeLevel, status])
}

model AttendanceRecord {
  id              String            @id @default(uuid())
  studentId       String
  date            DateTime          @db.Date
  sessionType     SessionType
  status          AttendanceStatus
  leaveReason     LeaveReason       @default(NONE)
  markedByUserId  String
  arrivalTime     String?
  remarks         String?
  clientSyncId    String?           @unique
  syncStatus      String            @default("SYNCED")
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  student         Student           @relation(fields: [studentId], references: [id])
  markedBy        User              @relation(fields: [markedByUserId], references: [id])

  @@unique([studentId, date, sessionType], name: "composite_student_session")
  @@index([date, sessionType])
  @@index([studentId, date])
}

model AcademicCalendarDay {
  id                 String            @id @default(uuid())
  date               DateTime          @unique @db.Date
  dayType            String
  description        String?
  descriptionDhivehi String?
  isManualOverride   Boolean           @default(false)
  updatedByUserId    String?
}

model ClassDelegation {
  id                  String           @id @default(uuid())
  date                DateTime         @db.Date
  originalTeacherId   String
  substituteTeacherId String
  gradeLevel          String
  reason              String
  notes               String?
  createdAt           DateTime         @default(now())

  originalTeacher     User             @relation("OriginalTeacher", fields: [originalTeacherId], references: [id])
  substituteTeacher   User             @relation("SubstituteTeacher", fields: [substituteTeacherId], references: [id])
}`;

  const sqlSeedCode = `-- SQL Seed & Row Level Security (RLS) Policies
CREATE TABLE IF NOT EXISTS academic_calendar_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  day_type VARCHAR(50) NOT NULL,
  description TEXT,
  description_dhivehi TEXT,
  is_manual_override BOOLEAN DEFAULT FALSE
);

-- Pre-loaded Maldivian Public Holidays
INSERT INTO academic_calendar_days (date, day_type, description, description_dhivehi)
VALUES
  ('2026-01-01', 'PUBLIC_HOLIDAY', 'New Year Day', 'މީލާދީ އައު އަހަރު ދުވަސް'),
  ('2026-03-20', 'PUBLIC_HOLIDAY', 'Eid al-Fitr', 'ފިޠުރު ޢީދު ދުވަސް'),
  ('2026-05-01', 'PUBLIC_HOLIDAY', 'Labour Day', 'މަސައްކަތްތެރިންގެ ދުވަސް'),
  ('2026-05-27', 'PUBLIC_HOLIDAY', 'Eid al-Adha', 'އަޟްޙާ ޢީދު ދުވަސް'),
  ('2026-07-26', 'PUBLIC_HOLIDAY', 'Independence Day', 'މިނިވަން ދުވަސް'),
  ('2026-08-26', 'PUBLIC_HOLIDAY', 'Prophet Muhammad\\'s Birthday', 'ކީރިތި ރަސޫލާގެ ޢީދު މީލާދު'),
  ('2026-09-12', 'PUBLIC_HOLIDAY', 'National Day', 'ޤައުމީ ދުވަސް'),
  ('2026-10-12', 'PUBLIC_HOLIDAY', 'Maldives Embraced Islam', 'ރާއްޖެ އިސްލާމްވި ދުވަސް'),
  ('2026-11-03', 'PUBLIC_HOLIDAY', 'Victory Day', 'ނަޞްރުގެ ދުވަސް'),
  ('2026-11-11', 'PUBLIC_HOLIDAY', 'Republic Day', 'ޖުމްހޫރީ ދުވަސް')
ON CONFLICT (date) DO NOTHING;

-- Row Level Security (RLS) Policies for MoE Portal
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_view_all_students ON students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY teacher_mark_attendance ON attendance_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = marked_by_user_id);

CREATE POLICY admin_full_access ON attendance_records
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );`;

  const handleCopy = () => {
    const text = activeSubTab === 'prisma' ? prismaSchemaCode : sqlSeedCode;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{isRTL ? 'ޑޭޓާބޭސް ސްކީމާ އަދި އާކިޓެކްޗަރ' : 'Database Schema & Architecture'}</h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
              Prisma + PostgreSQL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRTL ? '215 ދަރިވަރުންނާއި 35 ސްޓާފުންގެ ރިލޭޝަނަލް ޑޭޓާ މޮޑެލް' : 'Relational data models with composite keys, RLS security policies, and Maldivian calendar seeds.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center">
            <button
              type="button"
              onClick={() => setActiveSubTab('prisma')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'prisma' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              schema.prisma
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('sql')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'sql' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              seed.sql & RLS
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl text-slate-200 overflow-hidden font-mono text-xs">
        <pre className="overflow-x-auto max-h-[550px] p-2 scrollbar-thin">
          <code>{activeSubTab === 'prisma' ? prismaSchemaCode : sqlSeedCode}</code>
        </pre>
      </div>
    </div>
  );
};
