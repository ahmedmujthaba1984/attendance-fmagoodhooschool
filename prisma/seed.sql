-- Maldives School Attendance & Analytics Portal - SQL Initialization Script
-- Pre-loaded with Maldivian National & Islamic Holidays and Row-Level Security (RLS)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER');
    CREATE TYPE "DayType" AS ENUM ('REGULAR_SCHOOL', 'TERM_BREAK', 'PUBLIC_HOLIDAY', 'NON_TEACHING_DAY', 'EXAM_DAY', 'SCHOOL_CLOSED');
    CREATE TYPE "SessionType" AS ENUM ('MORNING_BEFORE_BREAK', 'POST_BREAK');
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');
    CREATE TYPE "LeaveReason" AS ENUM ('NONE', 'SICK_LEAVE', 'SICK_LEAVE_MC', 'NOT_IN_ISLAND', 'OFFICIAL_DUTY', 'OTHER');
    CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING_OFFLINE');
    CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "fullNameDhivehi" VARCHAR(100),
    role "Role" DEFAULT 'TEACHER' NOT NULL,
    designation VARCHAR(100),
    phone VARCHAR(20),
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    "admissionNumber" VARCHAR(20) UNIQUE NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "fullNameDhivehi" VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    "gradeLevel" VARCHAR(20) NOT NULL,
    section VARCHAR(5) DEFAULT 'A' NOT NULL,
    "parentContactPhone" VARCHAR(20) NOT NULL,
    "parentEmail" VARCHAR(100),
    status "StudentStatus" DEFAULT 'ACTIVE' NOT NULL,
    "islandAddress" VARCHAR(150),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS class_delegations (
    id VARCHAR(36) PRIMARY KEY,
    date DATE NOT NULL,
    "originalTeacherId" VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    "substituteTeacherId" VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    "gradeLevel" VARCHAR(20) NOT NULL,
    reason TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS academic_calendar_days (
    id VARCHAR(36) PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    "dayType" "DayType" DEFAULT 'REGULAR_SCHOOL' NOT NULL,
    description VARCHAR(255),
    "descriptionDhivehi" VARCHAR(255),
    "isManualOverride" BOOLEAN DEFAULT false NOT NULL,
    "updatedByUserId" VARCHAR(36),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id VARCHAR(36) PRIMARY KEY,
    "studentId" VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    status "AttendanceStatus" DEFAULT 'PRESENT' NOT NULL,
    "leaveReason" "LeaveReason" DEFAULT 'NONE' NOT NULL,
    "markedByUserId" VARCHAR(36) REFERENCES users(id) ON DELETE RESTRICT,
    "arrivalTime" VARCHAR(10),
    remarks TEXT,
    "syncStatus" "SyncStatus" DEFAULT 'SYNCED' NOT NULL,
    "clientSyncId" VARCHAR(100) UNIQUE,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_student_session_date UNIQUE ("studentId", date, "sessionType")
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    "actionType" VARCHAR(50) NOT NULL,
    "entityAffected" VARCHAR(50) NOT NULL,
    "ipAddress" VARCHAR(50),
    details TEXT NOT NULL
);

-- 3. Row-Level Security (RLS) Policies
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_attendance_policy ON attendance_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY admin_audit_policy ON audit_logs
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ADMIN');

-- 4. Pre-load Maldivian National & Islamic Holidays
INSERT INTO academic_calendar_days (id, date, "dayType", description, "descriptionDhivehi", "isManualOverride")
VALUES
    ('hol-1', '2026-01-01', 'PUBLIC_HOLIDAY', 'New Year Day', 'މީލާދީ އައު އަހަރުގެ ދުވަސް', false),
    ('hol-2', '2026-03-20', 'PUBLIC_HOLIDAY', 'Eid al-Fitr (Fith''r Eid)', 'ފިޠުރު ޢީދު ދުވަސް', false),
    ('hol-3', '2026-03-21', 'PUBLIC_HOLIDAY', 'Eid al-Fitr Holiday', 'ފިޠުރު ޢީދު ބަންދު', false),
    ('hol-4', '2026-05-01', 'PUBLIC_HOLIDAY', 'Labour Day', 'މަސައްކަތްތެރިންގެ ދުވަސް', false),
    ('hol-5', '2026-05-27', 'PUBLIC_HOLIDAY', 'Eid al-Adha (Bodu Eid)', 'އަޟްޙާ ޢީދު ދުވަސް', false),
    ('hol-6', '2026-05-28', 'PUBLIC_HOLIDAY', 'Eid al-Adha Holiday', 'އަޟްޙާ ޢީދު ބަންދު', false),
    ('hol-7', '2026-06-17', 'PUBLIC_HOLIDAY', 'Islamic New Year', 'ހިޖުރީ އައު އަހަރު ދުވަސް', false),
    ('hol-8', '2026-07-26', 'PUBLIC_HOLIDAY', 'Independence Day', 'މިނިވަން ދުވަސް', false),
    ('hol-9', '2026-07-27', 'PUBLIC_HOLIDAY', 'Independence Day Holiday', 'މިނިވަން ދުވަހުގެ ބަންދު', false),
    ('hol-10', '2026-08-26', 'PUBLIC_HOLIDAY', 'Prophet Muhammad''s Birthday (Mawlid)', 'ކީރިތި ރަސޫލާގެ ޢީދު މީލާދު', false),
    ('hol-11', '2026-09-12', 'PUBLIC_HOLIDAY', 'National Day (Qaumee Dhuvas)', 'ޤައުމީ ދުވަސް', false),
    ('hol-12', '2026-10-12', 'PUBLIC_HOLIDAY', 'The Day Maldives Embraced Islam', 'ރާއްޖެ އިސްލާމްވި ދުވަސް', false),
    ('hol-13', '2026-11-03', 'PUBLIC_HOLIDAY', 'Victory Day', 'ނަޞްރުގެ ދުވަސް', false),
    ('hol-14', '2026-11-11', 'PUBLIC_HOLIDAY', 'Republic Day', 'ޖުމްހޫރީ ދުވަސް', false)
ON CONFLICT (date) DO UPDATE 
SET "dayType" = EXCLUDED."dayType", description = EXCLUDED.description, "descriptionDhivehi" = EXCLUDED."descriptionDhivehi";
