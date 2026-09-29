// Seed Data Generator for 215 Maldivian Students, 35 Staff Members, and Academic Calendar

import { User, Student, GradeLevel, AcademicCalendarDay, AttendanceRecord, ClassDelegation } from '../src/types';

export const ALL_GRADES: GradeLevel[] = [
  'LKG', 'UKG',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
];

export const MALE_NAMES = [
  { en: 'Ahmed Zayan', dv: 'އަޙްމަދު ޒަޔާން' },
  { en: 'Mohamed Azeen', dv: 'މުޙައްމަދު އަޒީން' },
  { en: 'Ayyoosh Bin Fairooz', dv: 'ޢައްޔޫޝް ބިން ފައިރޫޒް' },
  { en: 'Ali Mifzal', dv: 'ޢަލީ މިފްޒާލް' },
  { en: 'Hassan Nabeel', dv: 'ޙަސަން ނަބީލް' },
  { en: 'Hussain Ayaan', dv: 'ޙުސައިން އަޔާން' },
  { en: 'Ismail Layaan', dv: 'އިސްމާޢީލް ލަޔާން' },
  { en: 'Abdullah Raaif', dv: 'ޢަބްދުﷲ ރާއިފް' },
  { en: 'Yoosuf Mizyaan', dv: 'ޔޫސުފް މިޒްޔާން' },
  { en: 'Umar Nahyaan', dv: 'ޢުމަރު ނަޙްޔާން' },
  { en: 'Zaidan Mohamed', dv: 'ޒައިދާން މުޙައްމަދު' },
  { en: 'Eashan Ibrahim', dv: 'އީޝާން އިބްރާހީމް' },
  { en: 'Kayan Ahmed', dv: 'ކަޔާން އަޙްމަދު' },
  { en: 'Aydin Ali', dv: 'އައިދިން ޢަލީ' },
  { en: 'Rayyan Hussain', dv: 'ރައްޔާން ޙުސައިން' },
  { en: 'Nael Hassan', dv: 'ނާއިލް ޙަސަން' },
  { en: 'Ayaan Moosa', dv: 'އަޔާން މޫސާ' },
  { en: 'Shuaib Adam', dv: 'ޝުޢައިބު އާދަމް' },
  { en: 'Daanish Zahir', dv: 'ދާނިޝް ޒާހިރު' },
  { en: 'Arham Naeem', dv: 'އަރްހަމް ނަޢީމް' },
];

export const FEMALE_NAMES = [
  { en: 'Aishath Shaba', dv: 'ޢާއިޝަތު ޝަބާ' },
  { en: 'Elin Binth Ahmed', dv: 'އީލިން ބިންތި އަޙްމަދު' },
  { en: 'Fathimath Reem', dv: 'ފާޠިމަތު ރީމް' },
  { en: 'Aminath Layan', dv: 'އާމިނަތު ލަޔާން' },
  { en: 'Hawwa Mishka', dv: 'ޙައްވާ މިޝްކާ' },
  { en: 'Zaha Mohamed', dv: 'ޒަހާ މުޙައްމަދު' },
  { en: 'Eiliya Ibrahim', dv: 'އީލިޔާ އިބްރާހީމް' },
  { en: 'Naba Hassan', dv: 'ނަބާ ޙަސަން' },
  { en: 'Yumna Ali', dv: 'ޔުމްނާ ޢަލީ' },
  { en: 'Meera Hussain', dv: 'މީރާ ޙުސައިން' },
  { en: 'Sara Ahmed', dv: 'ސާރާ އަޙްމަދު' },
  { en: 'Insha Ismail', dv: 'އިންޝާ އިސްމާޢީލް' },
  { en: 'Raya Abdullah', dv: 'ރާޔާ ޢަބްދުﷲ' },
  { en: 'Lana Yoosuf', dv: 'ލާނާ ޔޫސުފް' },
  { en: 'Ayla Umar', dv: 'އައިލާ ޢުމަރު' },
  { en: 'Tara Moosa', dv: 'ތާރާ މޫސާ' },
  { en: 'Zoya Adam', dv: 'ޒޯޔާ އާދަމް' },
  { en: 'Dua Naeem', dv: 'ދުޢާ ނަޢީމް' },
  { en: 'Liya Zahir', dv: 'ލިޔާ ޒާހިރު' },
  { en: 'Ayra Qasim', dv: 'އައިރާ ޤާސިމް' },
];

// Generate 35 Academic Staff members
export function generateStaffList(): User[] {
  const staff: User[] = [
    {
      id: 'staff-1',
      username: 'mohamed.fayaz',
      fullName: 'Mohamed Fayaz',
      fullNameDhivehi: 'މުޙައްމަދު ފަޔާޟް',
      role: 'ADMIN',
      designation: 'Principal',
      designationDhivehi: 'ޕްރިންސިޕަލް',
      phone: '+960 7900001',
      assignedGrade: undefined,
      isActive: true,
      createdAt: '2024-01-01',
    },
    {
      id: 'staff-2',
      username: 'ahmed.mujthaba',
      fullName: 'Ahmed Mujthaba',
      fullNameDhivehi: 'އަޙްމަދު މުޖްތަބާ',
      role: 'ADMIN',
      designation: 'Portal Administrator / Senior Admin Officer',
      designationDhivehi: 'ޕޯޓަލް އެޑްމިނިސްޓްރޭޓަރ / ސީނިއަރ އެޑްމިން އޮފިސަރ',
      phone: '+960 7900032',
      assignedGrade: undefined,
      isActive: true,
      createdAt: '2024-01-01',
    },
    {
      id: 'staff-3',
      username: 'ibrahim.waheed',
      fullName: 'Ibrahim Waheed',
      fullNameDhivehi: 'އިބްރާހީމް ވަޙީދު',
      role: 'ADMIN',
      designation: 'Leading Teacher (Key Stage 3 & 4)',
      phone: '+960 7623344',
      assignedGrade: 'Grade 10',
      isActive: true,
      createdAt: '2024-01-01',
    },
  ];

  const designations = [
    'Leading Teacher (Primary)',
    'Dhivehi Language Specialist',
    'Quran & Islam Teacher',
    'English Language Teacher',
    'Mathematics Specialist',
    'General Science Teacher',
    'Social Studies Teacher',
    'Computer Science & Robotics',
    'Physical Education (PE) Coach',
    'Art & Creative Development',
    'SEN & Inclusive Education Lead',
    'Preschool Specialist',
    'Homeroom Teacher',
  ];

  const teacherNames = [
    { en: 'Mariyam Nasheeda', dv: 'މަރްޔަމް ނަޝީދާ', grade: 'LKG' },
    { en: 'Fathimath Shazna', dv: 'ފާޠިމަތު ޝަޒްނާ', grade: 'UKG' },
    { en: 'Ali Rilwan', dv: 'ޢަލީ ރިޟްވާން', grade: 'Grade 1' },
    { en: 'Aishath Nuzha', dv: 'ޢާއިޝަތު ނުޒުހާ', grade: 'Grade 2' },
    { en: 'Hassan Firaz', dv: 'ޙަސަން ފިރާޒް', grade: 'Grade 3' },
    { en: 'Aminath Fazla', dv: 'އާމިނަތު ފަޒްލާ', grade: 'Grade 4' },
    { en: 'Mohamed Shamveel', dv: 'މުޙައްމަދު ޝަމްވީލް', grade: 'Grade 5' },
    { en: 'Hussain Latheef', dv: 'ޙުސައިން ލަޠީފް', grade: 'Grade 6' },
    { en: 'Zubaida Moosa', dv: 'ޒުބައިދާ މޫސާ', grade: 'Grade 7' },
    { en: 'Ismail Nisham', dv: 'އިސްމާޢީލް ނިޝާމް', grade: 'Grade 8' },
    { en: 'Khadheeja Rasheed', dv: 'ޚަދީޖާ ރަޝީދު', grade: 'Grade 9' },
    { en: 'Abdullah Hameed', dv: 'ޢަބްދުﷲ ޙަމީދު', grade: 'Grade 10' },
    { en: 'Shifa Naseem', dv: 'ޝިފާ ނަސީމް' },
    { en: 'Naushad Ahmed', dv: 'ނައުޝާދު އަޙްމަދު' },
    { en: 'Azeeza Yoosuf', dv: 'ޢަޒީޒާ ޔޫސުފް' },
    { en: 'Rishfa Mohamed', dv: 'ރިޝްފާ މުޙައްމަދު' },
    { en: 'Ilyas Adam', dv: 'އިލްޔާސް އާދަމް' },
    { en: 'Suhana Ali', dv: 'ސުހާނާ ޢަލީ' },
    { en: 'Thoriq Hussain', dv: 'ޠާރިޤު ޙުސައިން' },
    { en: 'Shahudha Ibrahim', dv: 'ޝަހުދާ އިބްރާހީމް' },
    { en: 'Moosa Anwar', dv: 'މޫސާ އަންވަރު' },
    { en: 'Fareesha Qasim', dv: 'ފަރީޝާ ޤާސިމް' },
    { en: 'Jamsheed Zahir', dv: 'ޖަމްޝީދު ޒާހިރު' },
    { en: 'Lamha Shareef', dv: 'ލަމްޙާ ޝަރީފް' },
    { en: 'Hussain Sobah', dv: 'ޙުސައިން ސޯބަޙް' },
    { en: 'Afrah Naeem', dv: 'އަފްރާޙް ނަޢީމް' },
    { en: 'Niuma Majeed', dv: 'ނިއުމާ މަޖީދު' },
    { en: 'Munavvar Shaugy', dv: 'މުނައްވަރު ޝައުޤީ' },
    { en: 'Reesha Solih', dv: 'ރީޝާ ޞާލިޙް' },
    { en: 'Zuhairath Khalid', dv: 'ޒުހައިރަތު ޚާލިދު' },
    { en: 'Fathmath Nahla', dv: 'ފާޠިމަތު ނަހުލާ' },
    { en: 'Ahmed Siraj', dv: 'އަޙްމަދު ސިރާޖް' },
  ];

  teacherNames.forEach((t, index) => {
    staff.push({
      id: `staff-${index + 4}`,
      username: t.en.toLowerCase().replace(/\s+/g, '.'),
      fullName: t.en,
      fullNameDhivehi: t.dv,
      role: 'TEACHER',
      designation: designations[index % designations.length],
      phone: `+960 7${(800000 + index * 1111).toString().slice(0, 6)}`,
      assignedGrade: (t.grade as GradeLevel) || ALL_GRADES[index % ALL_GRADES.length],
      isActive: true,
      createdAt: '2024-01-15',
    });
  });

  return staff;
}

import fs from 'fs';
import path from 'path';

// Generate exact 215 students across 12 grades (Pre-loaded from F. Magoodhoo School Directory)
export function generate215Students(): Student[] {
  try {
    const jsonPath = path.join(process.cwd(), 'server', 'magoodhooStudents.json');
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn('Could not read magoodhooStudents.json directly, falling back:', err);
  }

  const students: Student[] = [];
  const distribution: { grade: GradeLevel; count: number }[] = [
    { grade: 'LKG', count: 16 },
    { grade: 'UKG', count: 19 },
    { grade: 'Grade 1', count: 14 },
    { grade: 'Grade 2', count: 12 },
    { grade: 'Grade 3', count: 22 },
    { grade: 'Grade 4', count: 24 },
    { grade: 'Grade 5', count: 19 },
    { grade: 'Grade 6', count: 19 },
    { grade: 'Grade 7', count: 21 },
    { grade: 'Grade 8', count: 18 },
    { grade: 'Grade 9', count: 11 },
    { grade: 'Grade 10', count: 20 },
  ];

  let admCounter = 1;

  distribution.forEach(({ grade, count }) => {
    for (let i = 0; i < count; i++) {
      const isMale = (admCounter % 2 === 1);
      const namePool = isMale ? MALE_NAMES : FEMALE_NAMES;
      const baseName = namePool[(admCounter + i) % namePool.length];
      const admissionNumber = `FMS-${String(969 + admCounter).padStart(3, '0')}`;
      const suffix = Math.floor(admCounter / namePool.length) > 0 ? ` ${Math.floor(admCounter / namePool.length) + 1}` : '';

      students.push({
        id: `stu-${admCounter}`,
        admissionNumber,
        fullName: `${baseName.en}${suffix}`,
        fullNameDhivehi: `${baseName.dv}${suffix}`,
        gender: isMale ? 'MALE' : 'FEMALE',
        gradeLevel: grade,
        section: 'A',
        parentContactPhone: `+960 ${isMale ? '7' : '9'}${String(700000 + admCounter * 313).slice(0, 6)}`,
        parentEmail: `parent.${admissionNumber.toLowerCase()}@fmagoodhooschool.edu.mv`,
        status: 'ACTIVE',
        islandAddress: `Gulfaamuge, Ward ${1 + (admCounter % 4)}, F. Magoodhoo`,
        guardianName: isMale ? `Mohamed Adam (Father)` : `Mariyam Rasheeda (Mother)`,
      });

      admCounter++;
    }
  });

  return students;
}

// Generate pre-loaded Maldivian Academic Calendar (18 Official Maldives Public Holidays + Academic schedule)
export function generateAcademicCalendar(): AcademicCalendarDay[] {
  const days: AcademicCalendarDay[] = [
    {
      id: 'cal-1',
      date: '2026-01-01',
      dayType: 'PUBLIC_HOLIDAY',
      description: "New Year's Day",
      descriptionDhivehi: 'މީލާދީ އައު އަހަރު ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-2',
      date: '2026-02-18',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'First Day of Ramadan',
      descriptionDhivehi: 'ރަމަޟާން މަހުގެ ފުރަތަމަ ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-3',
      date: '2026-03-20',
      dayType: 'PUBLIC_HOLIDAY',
      description: "Eid al-Fitr (Fith'r Eid)",
      descriptionDhivehi: 'ފިޠުރު ޢީދު ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-4',
      date: '2026-03-21',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Eid al-Fitr Holiday',
      descriptionDhivehi: 'ފިޠުރު ޢީދު ބަންދު',
      isManualOverride: false,
    },
    {
      id: 'cal-5',
      date: '2026-03-22',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Eid al-Fitr Holiday',
      descriptionDhivehi: 'ފިޠުރު ޢީދު ބަންދު',
      isManualOverride: false,
    },
    {
      id: 'cal-6',
      date: '2026-05-01',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Labour Day',
      descriptionDhivehi: 'މަސައްކަތްތެރިންގެ ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-7',
      date: '2026-05-26',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Hajj Day',
      descriptionDhivehi: 'ޙައްޖު ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-8',
      date: '2026-05-27',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Eid al-Adha (Bodu Eid)',
      descriptionDhivehi: 'އަޟްޙާ ޢީދު ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-9',
      date: '2026-05-28',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Eid al-Adha Holiday',
      descriptionDhivehi: 'އަޟްޙާ ޢީދު ބަންދު',
      isManualOverride: false,
    },
    {
      id: 'cal-10',
      date: '2026-05-29',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Eid al-Adha Holiday',
      descriptionDhivehi: 'އަޟްޙާ ޢީދު ބަންދު',
      isManualOverride: false,
    },
    {
      id: 'cal-11',
      date: '2026-06-16',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Islamic New Year (1 Muharram)',
      descriptionDhivehi: 'ހިޖުރީ އައު އަހަރު ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-12',
      date: '2026-07-26',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Independence Day (Minivan Dhuvas)',
      descriptionDhivehi: 'މިނިވަން ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-13',
      date: '2026-07-27',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Independence Day Holiday',
      descriptionDhivehi: 'މިނިވަން ދުވަހުގެ ބަންދު',
      isManualOverride: false,
    },
    {
      id: 'cal-14',
      date: '2026-08-26',
      dayType: 'PUBLIC_HOLIDAY',
      description: "Prophet Muhammad's Birthday (Mawlid)",
      descriptionDhivehi: 'ކީރިތި ރަސޫލާގެ ޢީދު މީލާދު',
      isManualOverride: false,
    },
    {
      id: 'cal-16',
      date: '2026-09-13',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Day Maldives Embraced Islam',
      descriptionDhivehi: 'ރާއްޖެ އިސްލާމްވި ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-17',
      date: '2026-11-03',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Victory Day (Nasru Dhuvas)',
      descriptionDhivehi: 'ނަޞްރުގެ ދުވަސް',
      isManualOverride: false,
    },
    {
      id: 'cal-18',
      date: '2026-11-11',
      dayType: 'PUBLIC_HOLIDAY',
      description: 'Republic Day (Jumhooree Dhuvas)',
      descriptionDhivehi: 'ޖުމްހޫރީ ދުވަސް',
      isManualOverride: false,
    },
  ];

  return days;
}

// Generate historical attendance records for the past 14 days
export function generatePastAttendance(students: Student[], staff: User[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const teacherId = staff[0]?.id || 'staff-1';
  const today = new Date('2026-09-07T12:00:00Z');

  // Days to generate: past 10 school days (skip Fridays and Saturdays)
  const schoolDates: string[] = [];
  let cur = new Date(today);
  while (schoolDates.length < 10) {
    const dayOfWeek = cur.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      schoolDates.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() - 1);
  }

  schoolDates.reverse();

  schoolDates.forEach((dateStr, dayIndex) => {
    students.forEach((student, sIdx) => {
      // Create seed deterministic variability
      const seed = (sIdx * 31 + dayIndex * 17) % 100;
      
      // Morning session
      let mStatus: AttendanceRecord['status'] = 'PRESENT';
      let mLeave: AttendanceRecord['leaveReason'] = 'NONE';
      let mArrival: string | undefined = undefined;

      // Deterministic absence patterns for realistic demonstration
      if (sIdx === 0 || sIdx === 15) {
        if (dayIndex >= 6) {
          mStatus = 'ABSENT';
        }
      } else if (sIdx === 30) {
        // Island travel (Male' family trip)
        mStatus = 'LEAVE';
        mLeave = 'NOT_IN_ISLAND';
      } else if (seed < 4) {
        mStatus = 'ABSENT';
      } else if (seed < 8) {
        mStatus = 'LEAVE';
        mLeave = seed % 2 === 0 ? 'SICK_LEAVE' : 'SICK_LEAVE_MC';
      } else if (seed < 12) {
        mStatus = 'LATE';
        mArrival = '08:15';
      }

      records.push({
        id: `att-${student.id}-${dateStr}-morning`,
        studentId: student.id,
        date: dateStr,
        sessionType: 'MORNING_BEFORE_BREAK',
        status: mStatus,
        leaveReason: mLeave,
        markedByUserId: teacherId,
        arrivalTime: mArrival,
        syncStatus: 'SYNCED',
        updatedAt: `${dateStr}T08:00:00Z`,
      });

      // Post-break session
      let pStatus: AttendanceRecord['status'] = mStatus;
      let pLeave: AttendanceRecord['leaveReason'] = mLeave;
      let pArrival: string | undefined = mArrival;

      if (mStatus === 'PRESENT') {
        // Small dropout after tea-time break common in island schools
        if (seed > 95) {
          pStatus = 'ABSENT';
          pLeave = 'NONE';
        }
      }

      records.push({
        id: `att-${student.id}-${dateStr}-postbreak`,
        studentId: student.id,
        date: dateStr,
        sessionType: 'POST_BREAK',
        status: pStatus,
        leaveReason: pLeave,
        markedByUserId: teacherId,
        arrivalTime: pArrival,
        syncStatus: 'SYNCED',
        updatedAt: `${dateStr}T11:30:00Z`,
      });
    });
  });

  return records;
}
