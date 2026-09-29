import * as XLSX from 'xlsx';
import { ExtraClass, GradeLevel, Student, User } from '../types';

export interface ParsedExtraClassRow {
  date: string;
  gradeLevel: GradeLevel;
  subject: string;
  subjectDhivehi?: string;
  title: string;
  titleDhivehi?: string;
  teacherName: string;
  teacherId?: string;
  startTime: string;
  endTime: string;
  venue?: string;
  notes?: string;
}

export const VALID_GRADES: GradeLevel[] = [
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

/**
 * Converts Excel fraction/decimal or raw string to HH:MM format
 */
export function formatExcelTime(val: any): string {
  if (val === undefined || val === null || val === '') return '14:00';
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  if (/^0\.\d+$/.test(s)) {
    const num = parseFloat(s);
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  // If format is like "14:30" or "2:30 PM"
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':');
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return s || '14:00';
}

/**
 * Validates whether a YYYY-MM-DD string is a genuine calendar date
 */
export function isValidCalendarDate(dateStr: string): { valid: boolean; reason?: string } {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, reason: 'Format must be YYYY-MM-DD.' };
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12) {
    return { valid: false, reason: `Month ${month} is invalid (must be 01 to 12).` };
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1] || `Month ${month}`;

  if (day < 1 || day > daysInMonth) {
    return {
      valid: false,
      reason: `${monthName} ${year} only has ${daysInMonth} days (day ${day} does not exist in calendar).`,
    };
  }

  return { valid: true };
}

/**
 * Generates and downloads an official Excel template for bulk scheduling extra classes
 */
export function downloadExtraClassTemplate(staffList: User[]) {
  const wb = XLSX.utils.book_new();

  // 1. Template Sheet with sample rows
  const templateRows = [
    {
      'Date (YYYY-MM-DD)': '2026-09-25',
      'Grade Level': 'Grade 10',
      'Subject / Topic': 'Mathematics',
      'Subject (Dhivehi)': 'ހިސާބު',
      'Class Title / Objective': 'IGCSE Paper 2 Past Paper Revision & Problem Solving',
      'Teacher In Charge': staffList[0]?.fullName || 'Ahmed Mujthaba',
      'Start Time (HH:MM)': '14:30',
      'End Time (HH:MM)': '16:00',
      'Venue / Room': 'Classroom 10A',
      'Notes / Remarks': 'Students must bring scientific calculators and past paper booklets',
    },
    {
      'Date (YYYY-MM-DD)': '2026-09-25',
      'Grade Level': 'Grade 9',
      'Subject / Topic': 'Dhivehi',
      'Subject (Dhivehi)': 'ދިވެހި',
      'Class Title / Objective': 'Adhabee & Essay Writing Clinic',
      'Teacher In Charge': staffList[3]?.fullName || 'Mariyam Shifana',
      'Start Time (HH:MM)': '14:00',
      'End Time (HH:MM)': '15:15',
      'Venue / Room': 'School Hall',
      'Notes / Remarks': 'Creative rhetoric and comprehension practice',
    },
    {
      'Date (YYYY-MM-DD)': '2026-09-26',
      'Grade Level': 'Grade 8',
      'Subject / Topic': 'Islam',
      'Subject (Dhivehi)': 'އިސްލާމް',
      'Class Title / Objective': 'Fiqh & Quran Recitation Revision',
      'Teacher In Charge': staffList[1]?.fullName || 'Mohamed Waheed',
      'Start Time (HH:MM)': '14:30',
      'End Time (HH:MM)': '15:30',
      'Venue / Room': 'Islam Activity Room',
      'Notes / Remarks': 'Targeted revision for upcoming term assessment',
    },
  ];

  const wsSchedule = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths for clean presentation
  wsSchedule['!cols'] = [
    { wch: 18 }, // Date
    { wch: 14 }, // Grade Level
    { wch: 20 }, // Subject
    { wch: 18 }, // Subject Dhivehi
    { wch: 45 }, // Title / Objective
    { wch: 26 }, // Teacher In Charge
    { wch: 18 }, // Start Time
    { wch: 18 }, // End Time
    { wch: 20 }, // Venue
    { wch: 50 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Extra_Classes_Schedule');

  // 2. Reference Sheet with valid grades & current active staff
  const refGradesRows = VALID_GRADES.map((g) => ({
    'Valid Grade Levels': g,
  }));

  const refStaffRows = staffList.map((s) => ({
    'Staff Name (English)': s.fullName,
    'Staff Name (Dhivehi)': s.fullNameDhivehi || '',
    'Designation / Role': s.designation,
    'Assigned Grade': s.assignedGrade || 'General',
  }));

  const wsRefGrades = XLSX.utils.json_to_sheet(refGradesRows);
  const wsRefStaff = XLSX.utils.json_to_sheet(refStaffRows);

  wsRefGrades['!cols'] = [{ wch: 20 }];
  wsRefStaff['!cols'] = [{ wch: 28 }, { wch: 25 }, { wch: 30 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, wsRefGrades, 'Valid_Grades');
  XLSX.utils.book_append_sheet(wb, wsRefStaff, 'Staff_Reference');

  // Save workbook
  XLSX.writeFile(wb, 'FMS_Extra_Class_Schedule_Template.xlsx');
}

/**
 * Parses uploaded Excel file into Extra Class candidates
 */
export async function parseExtraClassExcel(
  file: File,
  staffList: User[]
): Promise<{ classes: ParsedExtraClassRow[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Use the first sheet or the one named 'Extra_Classes_Schedule'
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes('extra') || n.toLowerCase().includes('schedule')) ||
          wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        if (!ws) {
          return resolve({ classes: [], errors: ['No valid sheet found in uploaded Excel file.'] });
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rawRows.length === 0) {
          return resolve({ classes: [], errors: ['Uploaded Excel sheet is empty.'] });
        }

        const classes: ParsedExtraClassRow[] = [];
        const errors: string[] = [];

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2; // account for header line

          // Find date
          const dateVal =
            row['Date (YYYY-MM-DD)'] ||
            row['Date'] ||
            row['date'] ||
            row['DATE'] ||
            '';

          // Format date string safely
          let cleanDate = String(dateVal).trim();
          if (typeof dateVal === 'number') {
            // Excel serial date number
            const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            cleanDate = jsDate.toISOString().split('T')[0];
          }

          // Validate date format YYYY-MM-DD
          if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
            errors.push(`Row ${rowNum}: Invalid or missing date "${cleanDate}". Format must be YYYY-MM-DD.`);
            return;
          }

          // Strict calendar date validation (prevents 2026-09-31, 2026-09-32, etc.)
          const dateCheck = isValidCalendarDate(cleanDate);
          if (!dateCheck.valid) {
            errors.push(`Row ${rowNum}: Invalid calendar date "${cleanDate}". ${dateCheck.reason || 'Please specify a real calendar date.'}`);
            return;
          }

          // Find grade
          const gradeVal =
            row['Grade Level'] ||
            row['Grade'] ||
            row['grade'] ||
            row['GRADE'] ||
            '';
          const cleanGrade = String(gradeVal).trim();

          // Reject Grade 11 or Grade 12 specifically as F. Magoodhoo School only offers LKG to Grade 10
          if (cleanGrade.toLowerCase().includes('11') || cleanGrade.toLowerCase().includes('12')) {
            errors.push(
              `Row ${rowNum}: Invalid grade "${cleanGrade}". F. Magoodhoo School only operates LKG to Grade 10 (Grade 11 and Grade 12 do not exist in this school).`
            );
            return;
          }

          const matchedGrade = VALID_GRADES.find(
            (g) => g.toLowerCase() === cleanGrade.toLowerCase() || g.replace(/\s+/g, '').toLowerCase() === cleanGrade.replace(/\s+/g, '').toLowerCase()
          );

          if (!matchedGrade) {
            errors.push(
              `Row ${rowNum}: Invalid grade "${cleanGrade}". Must be one of: ${VALID_GRADES.join(', ')}. (F. Magoodhoo School only offers LKG to Grade 10).`
            );
            return;
          }

          // Find subject
          const subject =
            String(row['Subject / Topic'] || row['Subject'] || row['subject'] || '').trim() ||
            'General Revision';

          const subjectDhivehi =
            String(row['Subject (Dhivehi)'] || row['Dhivehi Subject'] || '').trim() || undefined;

          // Find title/topic
          const title =
            String(
              row['Class Title / Objective'] ||
                row['Title'] ||
                row['Objective'] ||
                row['Topic'] ||
                ''
            ).trim() || `${matchedGrade} ${subject} Extra Class`;

          // Find teacher
          const teacherNameInput =
            String(row['Teacher In Charge'] || row['Teacher'] || row['teacher'] || '').trim();

          // Match with staff list if possible
          let matchedTeacher = staffList.find(
            (s) =>
              s.fullName.toLowerCase() === teacherNameInput.toLowerCase() ||
              (s.fullNameDhivehi && s.fullNameDhivehi === teacherNameInput)
          );

          const teacherName = matchedTeacher?.fullName || teacherNameInput || staffList[0]?.fullName || 'Staff Member';
          const teacherId = matchedTeacher?.id;

          // Times formatted cleanly (handles Excel time fractions like 0.73125)
          const startTime = formatExcelTime(row['Start Time (HH:MM)'] || row['Start Time'] || '14:00');
          const endTime = formatExcelTime(row['End Time (HH:MM)'] || row['End Time'] || '15:30');

          let venue = String(row['Venue / Room'] || row['Venue'] || 'Classroom').trim();
          // Sanitize if venue refers to non-existent Grade 11 or 12
          if (venue.includes('Grade 11') || venue.includes('Grade 12')) {
            venue = venue.replace(/Grade\s*1[12]/gi, 'Classroom 10');
          }

          const notes = String(row['Notes / Remarks'] || row['Notes'] || '').trim();

          classes.push({
            date: cleanDate,
            gradeLevel: matchedGrade,
            subject,
            subjectDhivehi,
            title,
            teacherName,
            teacherId,
            startTime,
            endTime,
            venue,
            notes,
          });
        });

        resolve({ classes, errors });
      } catch (err: any) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and downloads an Excel Attendance sheet for a specific extra class
 */
export function downloadExtraClassAttendanceSheet(
  extraClass: ExtraClass,
  students: Student[]
) {
  const wb = XLSX.utils.book_new();

  // Filter students for this class grade
  const targetStudents =
    extraClass.gradeLevel === 'ALL'
      ? students
      : students.filter((s) => s.gradeLevel === extraClass.gradeLevel);

  const rows = targetStudents.map((st, idx) => {
    // Check if attendance already recorded for this student
    const existingRec = extraClass.attendanceRecords?.find(
      (r) => r.studentId === st.id || r.admissionNumber === st.admissionNumber
    );

    return {
      'Index': idx + 1,
      'Student ID': st.id,
      'Admission No': st.admissionNumber,
      'Student Name (English)': st.fullName,
      'Student Name (Dhivehi)': st.fullNameDhivehi,
      'Grade': st.gradeLevel,
      'Attendance Status (PRESENT / ABSENT / LATE / LEAVE)': existingRec?.status || 'PRESENT',
      'Arrival Time (HH:MM if Late)': existingRec?.arrivalTime || '',
      'Remarks': existingRec?.remarks || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 26 },
    { wch: 12 },
    { wch: 32 },
    { wch: 22 },
    { wch: 30 },
  ];

  const sheetTitle = `${extraClass.gradeLevel}_Attendance`.replace(/\s+/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const filename = `ExtraClass_Attendance_${extraClass.gradeLevel.replace(/\s+/g, '_')}_${extraClass.date}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Parses uploaded attendance Excel for an extra class
 */
export async function parseExtraClassAttendanceExcel(
  file: File,
  students: Student[]
): Promise<{
  records: Array<{
    studentId: string;
    admissionNumber: string;
    studentName: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    arrivalTime?: string;
    remarks?: string;
  }>;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];

        if (!ws) {
          return resolve({ records: [], errors: ['No sheet found in uploaded file.'] });
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const records: any[] = [];
        const errors: string[] = [];

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const admNo = String(row['Admission No'] || row['admissionNumber'] || '').trim();
          const studentId = String(row['Student ID'] || row['studentId'] || '').trim();

          const student = students.find(
            (s) => (admNo && s.admissionNumber === admNo) || (studentId && s.id === studentId)
          );

          if (!student) {
            errors.push(`Row ${rowNum}: Could not find student with Admission No "${admNo}".`);
            return;
          }

          const rawStatus = String(
            row['Attendance Status (PRESENT / ABSENT / LATE / LEAVE)'] ||
              row['Status'] ||
              row['status'] ||
              'PRESENT'
          )
            .trim()
            .toUpperCase();

          let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' = 'PRESENT';
          if (rawStatus.includes('ABS') || rawStatus === 'A') {
            status = 'ABSENT';
          } else if (rawStatus.includes('LAT') || rawStatus === 'L') {
            status = 'LATE';
          } else if (rawStatus.includes('LEAV') || rawStatus.includes('SICK') || rawStatus === 'E') {
            status = 'LEAVE';
          } else {
            status = 'PRESENT';
          }

          const arrivalTime = String(row['Arrival Time (HH:MM if Late)'] || row['arrivalTime'] || '').trim();
          const remarks = String(row['Remarks'] || row['remarks'] || '').trim();

          records.push({
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            studentName: student.fullName,
            status,
            arrivalTime: arrivalTime || undefined,
            remarks: remarks || undefined,
          });
        });

        resolve({ records, errors });
      } catch (err: any) {
        reject(new Error(`Failed to parse attendance Excel: ${err.message}`));
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
