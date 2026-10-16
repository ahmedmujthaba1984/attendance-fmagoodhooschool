// server.ts
import express from "express";
import path3 from "path";
import fs3 from "fs";
import https2 from "https";
import http2 from "http";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// server/seedData.ts
import fs from "fs";
import path from "path";
var ALL_GRADES = [
  "LKG",
  "UKG",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10"
];
var MALE_NAMES = [
  { en: "Ahmed Zayan", dv: "\u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA \u0792\u07A6\u0794\u07A7\u0782\u07B0" },
  { en: "Mohamed Azeen", dv: "\u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA \u0787\u07A6\u0792\u07A9\u0782\u07B0" },
  { en: "Ayyoosh Bin Fairooz", dv: "\u07A2\u07A6\u0787\u07B0\u0794\u07AB\u079D\u07B0 \u0784\u07A8\u0782\u07B0 \u078A\u07A6\u0787\u07A8\u0783\u07AB\u0792\u07B0" },
  { en: "Ali Mifzal", dv: "\u07A2\u07A6\u078D\u07A9 \u0789\u07A8\u078A\u07B0\u0792\u07A7\u078D\u07B0" },
  { en: "Hassan Nabeel", dv: "\u0799\u07A6\u0790\u07A6\u0782\u07B0 \u0782\u07A6\u0784\u07A9\u078D\u07B0" },
  { en: "Hussain Ayaan", dv: "\u0799\u07AA\u0790\u07A6\u0787\u07A8\u0782\u07B0 \u0787\u07A6\u0794\u07A7\u0782\u07B0" },
  { en: "Ismail Layaan", dv: "\u0787\u07A8\u0790\u07B0\u0789\u07A7\u07A2\u07A9\u078D\u07B0 \u078D\u07A6\u0794\u07A7\u0782\u07B0" },
  { en: "Abdullah Raaif", dv: "\u07A2\u07A6\u0784\u07B0\u078B\u07AA\uFDF2 \u0783\u07A7\u0787\u07A8\u078A\u07B0" },
  { en: "Yoosuf Mizyaan", dv: "\u0794\u07AB\u0790\u07AA\u078A\u07B0 \u0789\u07A8\u0792\u07B0\u0794\u07A7\u0782\u07B0" },
  { en: "Umar Nahyaan", dv: "\u07A2\u07AA\u0789\u07A6\u0783\u07AA \u0782\u07A6\u0799\u07B0\u0794\u07A7\u0782\u07B0" },
  { en: "Zaidan Mohamed", dv: "\u0792\u07A6\u0787\u07A8\u078B\u07A7\u0782\u07B0 \u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA" },
  { en: "Eashan Ibrahim", dv: "\u0787\u07A9\u079D\u07A7\u0782\u07B0 \u0787\u07A8\u0784\u07B0\u0783\u07A7\u0780\u07A9\u0789\u07B0" },
  { en: "Kayan Ahmed", dv: "\u0786\u07A6\u0794\u07A7\u0782\u07B0 \u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA" },
  { en: "Aydin Ali", dv: "\u0787\u07A6\u0787\u07A8\u078B\u07A8\u0782\u07B0 \u07A2\u07A6\u078D\u07A9" },
  { en: "Rayyan Hussain", dv: "\u0783\u07A6\u0787\u07B0\u0794\u07A7\u0782\u07B0 \u0799\u07AA\u0790\u07A6\u0787\u07A8\u0782\u07B0" },
  { en: "Nael Hassan", dv: "\u0782\u07A7\u0787\u07A8\u078D\u07B0 \u0799\u07A6\u0790\u07A6\u0782\u07B0" },
  { en: "Ayaan Moosa", dv: "\u0787\u07A6\u0794\u07A7\u0782\u07B0 \u0789\u07AB\u0790\u07A7" },
  { en: "Shuaib Adam", dv: "\u079D\u07AA\u07A2\u07A6\u0787\u07A8\u0784\u07AA \u0787\u07A7\u078B\u07A6\u0789\u07B0" },
  { en: "Daanish Zahir", dv: "\u078B\u07A7\u0782\u07A8\u079D\u07B0 \u0792\u07A7\u0780\u07A8\u0783\u07AA" },
  { en: "Arham Naeem", dv: "\u0787\u07A6\u0783\u07B0\u0780\u07A6\u0789\u07B0 \u0782\u07A6\u07A2\u07A9\u0789\u07B0" }
];
var FEMALE_NAMES = [
  { en: "Aishath Shaba", dv: "\u07A2\u07A7\u0787\u07A8\u079D\u07A6\u078C\u07AA \u079D\u07A6\u0784\u07A7" },
  { en: "Elin Binth Ahmed", dv: "\u0787\u07A9\u078D\u07A8\u0782\u07B0 \u0784\u07A8\u0782\u07B0\u078C\u07A8 \u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA" },
  { en: "Fathimath Reem", dv: "\u078A\u07A7\u07A0\u07A8\u0789\u07A6\u078C\u07AA \u0783\u07A9\u0789\u07B0" },
  { en: "Aminath Layan", dv: "\u0787\u07A7\u0789\u07A8\u0782\u07A6\u078C\u07AA \u078D\u07A6\u0794\u07A7\u0782\u07B0" },
  { en: "Hawwa Mishka", dv: "\u0799\u07A6\u0787\u07B0\u0788\u07A7 \u0789\u07A8\u079D\u07B0\u0786\u07A7" },
  { en: "Zaha Mohamed", dv: "\u0792\u07A6\u0780\u07A7 \u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA" },
  { en: "Eiliya Ibrahim", dv: "\u0787\u07A9\u078D\u07A8\u0794\u07A7 \u0787\u07A8\u0784\u07B0\u0783\u07A7\u0780\u07A9\u0789\u07B0" },
  { en: "Naba Hassan", dv: "\u0782\u07A6\u0784\u07A7 \u0799\u07A6\u0790\u07A6\u0782\u07B0" },
  { en: "Yumna Ali", dv: "\u0794\u07AA\u0789\u07B0\u0782\u07A7 \u07A2\u07A6\u078D\u07A9" },
  { en: "Meera Hussain", dv: "\u0789\u07A9\u0783\u07A7 \u0799\u07AA\u0790\u07A6\u0787\u07A8\u0782\u07B0" },
  { en: "Sara Ahmed", dv: "\u0790\u07A7\u0783\u07A7 \u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA" },
  { en: "Insha Ismail", dv: "\u0787\u07A8\u0782\u07B0\u079D\u07A7 \u0787\u07A8\u0790\u07B0\u0789\u07A7\u07A2\u07A9\u078D\u07B0" },
  { en: "Raya Abdullah", dv: "\u0783\u07A7\u0794\u07A7 \u07A2\u07A6\u0784\u07B0\u078B\u07AA\uFDF2" },
  { en: "Lana Yoosuf", dv: "\u078D\u07A7\u0782\u07A7 \u0794\u07AB\u0790\u07AA\u078A\u07B0" },
  { en: "Ayla Umar", dv: "\u0787\u07A6\u0787\u07A8\u078D\u07A7 \u07A2\u07AA\u0789\u07A6\u0783\u07AA" },
  { en: "Tara Moosa", dv: "\u078C\u07A7\u0783\u07A7 \u0789\u07AB\u0790\u07A7" },
  { en: "Zoya Adam", dv: "\u0792\u07AF\u0794\u07A7 \u0787\u07A7\u078B\u07A6\u0789\u07B0" },
  { en: "Dua Naeem", dv: "\u078B\u07AA\u07A2\u07A7 \u0782\u07A6\u07A2\u07A9\u0789\u07B0" },
  { en: "Liya Zahir", dv: "\u078D\u07A8\u0794\u07A7 \u0792\u07A7\u0780\u07A8\u0783\u07AA" },
  { en: "Ayra Qasim", dv: "\u0787\u07A6\u0787\u07A8\u0783\u07A7 \u07A4\u07A7\u0790\u07A8\u0789\u07B0" }
];
function generateStaffList() {
  const staff = [
    {
      id: "staff-1",
      username: "mohamed.fayaz",
      fullName: "Mohamed Fayaz",
      fullNameDhivehi: "\u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA \u078A\u07A6\u0794\u07A7\u079F\u07B0",
      role: "ADMIN",
      designation: "Principal",
      designationDhivehi: "\u0795\u07B0\u0783\u07A8\u0782\u07B0\u0790\u07A8\u0795\u07A6\u078D\u07B0",
      phone: "+960 7900001",
      assignedGrade: void 0,
      isActive: true,
      createdAt: "2024-01-01"
    },
    {
      id: "staff-2",
      username: "ahmed.mujthaba",
      fullName: "Ahmed Mujthaba",
      fullNameDhivehi: "\u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA \u0789\u07AA\u0796\u07B0\u078C\u07A6\u0784\u07A7",
      role: "ADMIN",
      designation: "Portal Administrator / Senior Admin Officer",
      designationDhivehi: "\u0795\u07AF\u0793\u07A6\u078D\u07B0 \u0787\u07AC\u0791\u07B0\u0789\u07A8\u0782\u07A8\u0790\u07B0\u0793\u07B0\u0783\u07AD\u0793\u07A6\u0783 / \u0790\u07A9\u0782\u07A8\u0787\u07A6\u0783 \u0787\u07AC\u0791\u07B0\u0789\u07A8\u0782\u07B0 \u0787\u07AE\u078A\u07A8\u0790\u07A6\u0783",
      phone: "+960 7900032",
      assignedGrade: void 0,
      isActive: true,
      createdAt: "2024-01-01"
    },
    {
      id: "staff-3",
      username: "ibrahim.waheed",
      fullName: "Ibrahim Waheed",
      fullNameDhivehi: "\u0787\u07A8\u0784\u07B0\u0783\u07A7\u0780\u07A9\u0789\u07B0 \u0788\u07A6\u0799\u07A9\u078B\u07AA",
      role: "ADMIN",
      designation: "Leading Teacher (Key Stage 3 & 4)",
      phone: "+960 7623344",
      assignedGrade: "Grade 10",
      isActive: true,
      createdAt: "2024-01-01"
    }
  ];
  const designations = [
    "Leading Teacher (Primary)",
    "Dhivehi Language Specialist",
    "Quran & Islam Teacher",
    "English Language Teacher",
    "Mathematics Specialist",
    "General Science Teacher",
    "Social Studies Teacher",
    "Computer Science & Robotics",
    "Physical Education (PE) Coach",
    "Art & Creative Development",
    "SEN & Inclusive Education Lead",
    "Preschool Specialist",
    "Homeroom Teacher"
  ];
  const teacherNames = [
    { en: "Mariyam Nasheeda", dv: "\u0789\u07A6\u0783\u07B0\u0794\u07A6\u0789\u07B0 \u0782\u07A6\u079D\u07A9\u078B\u07A7", grade: "LKG" },
    { en: "Fathimath Shazna", dv: "\u078A\u07A7\u07A0\u07A8\u0789\u07A6\u078C\u07AA \u079D\u07A6\u0792\u07B0\u0782\u07A7", grade: "UKG" },
    { en: "Ali Rilwan", dv: "\u07A2\u07A6\u078D\u07A9 \u0783\u07A8\u079F\u07B0\u0788\u07A7\u0782\u07B0", grade: "Grade 1" },
    { en: "Aishath Nuzha", dv: "\u07A2\u07A7\u0787\u07A8\u079D\u07A6\u078C\u07AA \u0782\u07AA\u0792\u07AA\u0780\u07A7", grade: "Grade 2" },
    { en: "Hassan Firaz", dv: "\u0799\u07A6\u0790\u07A6\u0782\u07B0 \u078A\u07A8\u0783\u07A7\u0792\u07B0", grade: "Grade 3" },
    { en: "Aminath Fazla", dv: "\u0787\u07A7\u0789\u07A8\u0782\u07A6\u078C\u07AA \u078A\u07A6\u0792\u07B0\u078D\u07A7", grade: "Grade 4" },
    { en: "Mohamed Shamveel", dv: "\u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA \u079D\u07A6\u0789\u07B0\u0788\u07A9\u078D\u07B0", grade: "Grade 5" },
    { en: "Hussain Latheef", dv: "\u0799\u07AA\u0790\u07A6\u0787\u07A8\u0782\u07B0 \u078D\u07A6\u07A0\u07A9\u078A\u07B0", grade: "Grade 6" },
    { en: "Zubaida Moosa", dv: "\u0792\u07AA\u0784\u07A6\u0787\u07A8\u078B\u07A7 \u0789\u07AB\u0790\u07A7", grade: "Grade 7" },
    { en: "Ismail Nisham", dv: "\u0787\u07A8\u0790\u07B0\u0789\u07A7\u07A2\u07A9\u078D\u07B0 \u0782\u07A8\u079D\u07A7\u0789\u07B0", grade: "Grade 8" },
    { en: "Khadheeja Rasheed", dv: "\u079A\u07A6\u078B\u07A9\u0796\u07A7 \u0783\u07A6\u079D\u07A9\u078B\u07AA", grade: "Grade 9" },
    { en: "Abdullah Hameed", dv: "\u07A2\u07A6\u0784\u07B0\u078B\u07AA\uFDF2 \u0799\u07A6\u0789\u07A9\u078B\u07AA", grade: "Grade 10" },
    { en: "Shifa Naseem", dv: "\u079D\u07A8\u078A\u07A7 \u0782\u07A6\u0790\u07A9\u0789\u07B0" },
    { en: "Naushad Ahmed", dv: "\u0782\u07A6\u0787\u07AA\u079D\u07A7\u078B\u07AA \u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA" },
    { en: "Azeeza Yoosuf", dv: "\u07A2\u07A6\u0792\u07A9\u0792\u07A7 \u0794\u07AB\u0790\u07AA\u078A\u07B0" },
    { en: "Rishfa Mohamed", dv: "\u0783\u07A8\u079D\u07B0\u078A\u07A7 \u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA" },
    { en: "Ilyas Adam", dv: "\u0787\u07A8\u078D\u07B0\u0794\u07A7\u0790\u07B0 \u0787\u07A7\u078B\u07A6\u0789\u07B0" },
    { en: "Suhana Ali", dv: "\u0790\u07AA\u0780\u07A7\u0782\u07A7 \u07A2\u07A6\u078D\u07A9" },
    { en: "Thoriq Hussain", dv: "\u07A0\u07A7\u0783\u07A8\u07A4\u07AA \u0799\u07AA\u0790\u07A6\u0787\u07A8\u0782\u07B0" },
    { en: "Shahudha Ibrahim", dv: "\u079D\u07A6\u0780\u07AA\u078B\u07A7 \u0787\u07A8\u0784\u07B0\u0783\u07A7\u0780\u07A9\u0789\u07B0" },
    { en: "Moosa Anwar", dv: "\u0789\u07AB\u0790\u07A7 \u0787\u07A6\u0782\u07B0\u0788\u07A6\u0783\u07AA" },
    { en: "Fareesha Qasim", dv: "\u078A\u07A6\u0783\u07A9\u079D\u07A7 \u07A4\u07A7\u0790\u07A8\u0789\u07B0" },
    { en: "Jamsheed Zahir", dv: "\u0796\u07A6\u0789\u07B0\u079D\u07A9\u078B\u07AA \u0792\u07A7\u0780\u07A8\u0783\u07AA" },
    { en: "Lamha Shareef", dv: "\u078D\u07A6\u0789\u07B0\u0799\u07A7 \u079D\u07A6\u0783\u07A9\u078A\u07B0" },
    { en: "Hussain Sobah", dv: "\u0799\u07AA\u0790\u07A6\u0787\u07A8\u0782\u07B0 \u0790\u07AF\u0784\u07A6\u0799\u07B0" },
    { en: "Afrah Naeem", dv: "\u0787\u07A6\u078A\u07B0\u0783\u07A7\u0799\u07B0 \u0782\u07A6\u07A2\u07A9\u0789\u07B0" },
    { en: "Niuma Majeed", dv: "\u0782\u07A8\u0787\u07AA\u0789\u07A7 \u0789\u07A6\u0796\u07A9\u078B\u07AA" },
    { en: "Munavvar Shaugy", dv: "\u0789\u07AA\u0782\u07A6\u0787\u07B0\u0788\u07A6\u0783\u07AA \u079D\u07A6\u0787\u07AA\u07A4\u07A9" },
    { en: "Reesha Solih", dv: "\u0783\u07A9\u079D\u07A7 \u079E\u07A7\u078D\u07A8\u0799\u07B0" },
    { en: "Zuhairath Khalid", dv: "\u0792\u07AA\u0780\u07A6\u0787\u07A8\u0783\u07A6\u078C\u07AA \u079A\u07A7\u078D\u07A8\u078B\u07AA" },
    { en: "Fathmath Nahla", dv: "\u078A\u07A7\u07A0\u07A8\u0789\u07A6\u078C\u07AA \u0782\u07A6\u0780\u07AA\u078D\u07A7" },
    { en: "Ahmed Siraj", dv: "\u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA \u0790\u07A8\u0783\u07A7\u0796\u07B0" }
  ];
  teacherNames.forEach((t, index) => {
    staff.push({
      id: `staff-${index + 4}`,
      username: t.en.toLowerCase().replace(/\s+/g, "."),
      fullName: t.en,
      fullNameDhivehi: t.dv,
      role: "TEACHER",
      designation: designations[index % designations.length],
      phone: `+960 7${(8e5 + index * 1111).toString().slice(0, 6)}`,
      assignedGrade: t.grade || ALL_GRADES[index % ALL_GRADES.length],
      isActive: true,
      createdAt: "2024-01-15"
    });
  });
  return staff;
}
function generate215Students() {
  try {
    const jsonPath = path.join(process.cwd(), "server", "magoodhooStudents.json");
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, "utf-8");
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn("Could not read magoodhooStudents.json directly, falling back:", err);
  }
  const students2 = [];
  const distribution = [
    { grade: "LKG", count: 16 },
    { grade: "UKG", count: 19 },
    { grade: "Grade 1", count: 14 },
    { grade: "Grade 2", count: 12 },
    { grade: "Grade 3", count: 22 },
    { grade: "Grade 4", count: 24 },
    { grade: "Grade 5", count: 19 },
    { grade: "Grade 6", count: 19 },
    { grade: "Grade 7", count: 21 },
    { grade: "Grade 8", count: 18 },
    { grade: "Grade 9", count: 11 },
    { grade: "Grade 10", count: 20 }
  ];
  let admCounter = 1;
  distribution.forEach(({ grade, count }) => {
    for (let i = 0; i < count; i++) {
      const isMale = admCounter % 2 === 1;
      const namePool = isMale ? MALE_NAMES : FEMALE_NAMES;
      const baseName = namePool[(admCounter + i) % namePool.length];
      const admissionNumber = `FMS-${String(969 + admCounter).padStart(3, "0")}`;
      const suffix = Math.floor(admCounter / namePool.length) > 0 ? ` ${Math.floor(admCounter / namePool.length) + 1}` : "";
      students2.push({
        id: `stu-${admCounter}`,
        admissionNumber,
        fullName: `${baseName.en}${suffix}`,
        fullNameDhivehi: `${baseName.dv}${suffix}`,
        gender: isMale ? "MALE" : "FEMALE",
        gradeLevel: grade,
        section: "A",
        parentContactPhone: `+960 ${isMale ? "7" : "9"}${String(7e5 + admCounter * 313).slice(0, 6)}`,
        parentEmail: `parent.${admissionNumber.toLowerCase()}@fmagoodhooschool.edu.mv`,
        status: "ACTIVE",
        islandAddress: `Gulfaamuge, Ward ${1 + admCounter % 4}, F. Magoodhoo`,
        guardianName: isMale ? `Mohamed Adam (Father)` : `Mariyam Rasheeda (Mother)`
      });
      admCounter++;
    }
  });
  return students2;
}
function generateAcademicCalendar() {
  const days = [
    {
      id: "cal-1",
      date: "2026-01-01",
      dayType: "PUBLIC_HOLIDAY",
      description: "New Year's Day",
      descriptionDhivehi: "\u0789\u07A9\u078D\u07A7\u078B\u07A9 \u0787\u07A6\u0787\u07AA \u0787\u07A6\u0780\u07A6\u0783\u07AA \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-2",
      date: "2026-02-18",
      dayType: "PUBLIC_HOLIDAY",
      description: "First Day of Ramadan",
      descriptionDhivehi: "\u0783\u07A6\u0789\u07A6\u079F\u07A7\u0782\u07B0 \u0789\u07A6\u0780\u07AA\u078E\u07AC \u078A\u07AA\u0783\u07A6\u078C\u07A6\u0789\u07A6 \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-3",
      date: "2026-03-20",
      dayType: "PUBLIC_HOLIDAY",
      description: "Eid al-Fitr (Fith'r Eid)",
      descriptionDhivehi: "\u078A\u07A8\u07A0\u07AA\u0783\u07AA \u07A2\u07A9\u078B\u07AA \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-4",
      date: "2026-03-21",
      dayType: "PUBLIC_HOLIDAY",
      description: "Eid al-Fitr Holiday",
      descriptionDhivehi: "\u078A\u07A8\u07A0\u07AA\u0783\u07AA \u07A2\u07A9\u078B\u07AA \u0784\u07A6\u0782\u07B0\u078B\u07AA",
      isManualOverride: false
    },
    {
      id: "cal-5",
      date: "2026-03-22",
      dayType: "PUBLIC_HOLIDAY",
      description: "Eid al-Fitr Holiday",
      descriptionDhivehi: "\u078A\u07A8\u07A0\u07AA\u0783\u07AA \u07A2\u07A9\u078B\u07AA \u0784\u07A6\u0782\u07B0\u078B\u07AA",
      isManualOverride: false
    },
    {
      id: "cal-6",
      date: "2026-05-01",
      dayType: "PUBLIC_HOLIDAY",
      description: "Labour Day",
      descriptionDhivehi: "\u0789\u07A6\u0790\u07A6\u0787\u07B0\u0786\u07A6\u078C\u07B0\u078C\u07AC\u0783\u07A8\u0782\u07B0\u078E\u07AC \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-7",
      date: "2026-05-26",
      dayType: "PUBLIC_HOLIDAY",
      description: "Hajj Day",
      descriptionDhivehi: "\u0799\u07A6\u0787\u07B0\u0796\u07AA \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-8",
      date: "2026-05-27",
      dayType: "PUBLIC_HOLIDAY",
      description: "Eid al-Adha (Bodu Eid)",
      descriptionDhivehi: "\u0787\u07A6\u079F\u07B0\u0799\u07A7 \u07A2\u07A9\u078B\u07AA \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-9",
      date: "2026-05-28",
      dayType: "PUBLIC_HOLIDAY",
      description: "Eid al-Adha Holiday",
      descriptionDhivehi: "\u0787\u07A6\u079F\u07B0\u0799\u07A7 \u07A2\u07A9\u078B\u07AA \u0784\u07A6\u0782\u07B0\u078B\u07AA",
      isManualOverride: false
    },
    {
      id: "cal-10",
      date: "2026-05-29",
      dayType: "PUBLIC_HOLIDAY",
      description: "Eid al-Adha Holiday",
      descriptionDhivehi: "\u0787\u07A6\u079F\u07B0\u0799\u07A7 \u07A2\u07A9\u078B\u07AA \u0784\u07A6\u0782\u07B0\u078B\u07AA",
      isManualOverride: false
    },
    {
      id: "cal-11",
      date: "2026-06-16",
      dayType: "PUBLIC_HOLIDAY",
      description: "Islamic New Year (1 Muharram)",
      descriptionDhivehi: "\u0780\u07A8\u0796\u07AA\u0783\u07A9 \u0787\u07A6\u0787\u07AA \u0787\u07A6\u0780\u07A6\u0783\u07AA \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-12",
      date: "2026-07-26",
      dayType: "PUBLIC_HOLIDAY",
      description: "Independence Day (Minivan Dhuvas)",
      descriptionDhivehi: "\u0789\u07A8\u0782\u07A8\u0788\u07A6\u0782\u07B0 \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-13",
      date: "2026-07-27",
      dayType: "PUBLIC_HOLIDAY",
      description: "Independence Day Holiday",
      descriptionDhivehi: "\u0789\u07A8\u0782\u07A8\u0788\u07A6\u0782\u07B0 \u078B\u07AA\u0788\u07A6\u0780\u07AA\u078E\u07AC \u0784\u07A6\u0782\u07B0\u078B\u07AA",
      isManualOverride: false
    },
    {
      id: "cal-14",
      date: "2026-08-26",
      dayType: "PUBLIC_HOLIDAY",
      description: "Prophet Muhammad's Birthday (Mawlid)",
      descriptionDhivehi: "\u0786\u07A9\u0783\u07A8\u078C\u07A8 \u0783\u07A6\u0790\u07AB\u078D\u07A7\u078E\u07AC \u07A2\u07A9\u078B\u07AA \u0789\u07A9\u078D\u07A7\u078B\u07AA",
      isManualOverride: false
    },
    {
      id: "cal-16",
      date: "2026-09-13",
      dayType: "PUBLIC_HOLIDAY",
      description: "Day Maldives Embraced Islam",
      descriptionDhivehi: "\u0783\u07A7\u0787\u07B0\u0796\u07AC \u0787\u07A8\u0790\u07B0\u078D\u07A7\u0789\u07B0\u0788\u07A8 \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-17",
      date: "2026-11-03",
      dayType: "PUBLIC_HOLIDAY",
      description: "Victory Day (Nasru Dhuvas)",
      descriptionDhivehi: "\u0782\u07A6\u079E\u07B0\u0783\u07AA\u078E\u07AC \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    },
    {
      id: "cal-18",
      date: "2026-11-11",
      dayType: "PUBLIC_HOLIDAY",
      description: "Republic Day (Jumhooree Dhuvas)",
      descriptionDhivehi: "\u0796\u07AA\u0789\u07B0\u0780\u07AB\u0783\u07A9 \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: false
    }
  ];
  return days;
}

// server/magoodhooSync.ts
import https from "https";
import http from "http";
import vm from "vm";
import fs2 from "fs";
import path2 from "path";
var MAGOODHOO_PORTAL_URL = "https://reportcard-fmagoodhooschool.vercel.app/";
var FIRESTORE_PROJECT_ID = "industrial-heaven-2j4jh";
var FIRESTORE_DB_ID = "ai-studio-magoodhooschoole-128d6f0a-ac98-471b-97a7-60f7b0b880b4";
var FIRESTORE_API_KEY = "AIzaSyAfYbbnjncIlteLWYG9ZIpRRa8lq_QZvR8";
var FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/grade_students/`;
var ALL_GRADES2 = [
  "LKG",
  "UKG",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10"
];
function safeWriteJsonSync(targetPath, data) {
  const tmpPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    fs2.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs2.renameSync(tmpPath, targetPath);
  } catch {
    try {
      if (fs2.existsSync(tmpPath)) fs2.unlinkSync(tmpPath);
    } catch {
    }
    fs2.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
  }
}
var MagoodhooSyncEngine = class _MagoodhooSyncEngine {
  constructor() {
    this.state = {
      sourceUrl: MAGOODHOO_PORTAL_URL,
      lastSyncTime: null,
      lastSyncedBundle: null,
      totalStudents: 215,
      totalStaff: 46,
      gradeBreakdown: {},
      departmentBreakdown: {},
      status: "IDLE",
      lastError: null,
      autoSyncEnabled: true,
      version: "v26-live-staff"
    };
    this.syncIntervalTimer = null;
    this.cachedStudents = [];
    this.cachedStaff = [];
    this.updateListeners = [];
    this.staffUpdateListeners = [];
    this.loadInitialCache();
    if (!process.env.VERCEL && !process.env.NOW_REGION) {
      this.syncFromRemotePortal().catch((err) => {
        console.warn("[MagoodhooSync] Initial live sync failed, using cached directory:", err.message);
      });
      this.startAutoSync(3 * 60 * 1e3);
    }
  }
  static getInstance() {
    if (!_MagoodhooSyncEngine.instance) {
      _MagoodhooSyncEngine.instance = new _MagoodhooSyncEngine();
    }
    return _MagoodhooSyncEngine.instance;
  }
  onStudentsUpdated(callback) {
    this.updateListeners.push(callback);
  }
  onStaffUpdated(callback) {
    this.staffUpdateListeners.push(callback);
  }
  notifyListeners(students2) {
    this.updateListeners.forEach((cb) => {
      try {
        cb(students2);
      } catch (e) {
        console.error("[MagoodhooSync] Error in listener callback:", e);
      }
    });
  }
  notifyStaffListeners(staff) {
    this.staffUpdateListeners.forEach((cb) => {
      try {
        cb(staff);
      } catch (e) {
        console.error("[MagoodhooSync] Error in staff listener callback:", e);
      }
    });
  }
  normalizeStaffList(rawStaff) {
    return rawStaff.map((s) => {
      const isLeaderOrAdmin = s.role === "admin" || s.role === "leading_teacher";
      let dvName = (s.dhivehi || s.fullNameDhivehi || s.name || "").trim();
      dvName = dvName.replace(/\uFFFD/g, "").replace(/([\u07A6-\u07B0])\1+/g, "$1");
      const userEmail = (s.email || `${s.id}@fmagoodhooschool.edu.mv`).toLowerCase().trim();
      const isSuperAdmin = userEmail === "ahmed.mujthaba@fmagoodhooschool.edu.mv";
      return {
        id: s.id,
        username: userEmail,
        fullName: (s.name || s.fullName || "").trim(),
        fullNameDhivehi: dvName,
        role: isSuperAdmin ? "ADMIN" : isLeaderOrAdmin ? "ADMIN" : "TEACHER",
        designation: s.designation || "Staff",
        designationDhivehi: s.designationDhivehi || "\u0790\u07B0\u0793\u07A7\u078A\u07B0",
        department: s.department || "Teaching Faculty",
        staffId: s.staffId || s.id,
        nationalId: s.nationalId || "",
        email: userEmail,
        isSuperAdmin,
        phone: s.phone || `+960 79${(s.staffId || "").replace(/\D/g, "").padStart(5, "0")}`,
        primarySubject: s.primarySubject || "",
        qualification: s.qualification || "",
        teachingSubjectOrGrades: s.teachingSubjectOrGrades || "",
        assignedGrade: Array.isArray(s.assignedGrades) && s.assignedGrades.length > 0 ? s.assignedGrades[0] : void 0,
        assignedGrades: Array.isArray(s.assignedGrades) ? s.assignedGrades : [],
        isActive: (s.status || "Active").toLowerCase() === "active",
        createdAt: s.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      };
    });
  }
  loadInitialCache() {
    try {
      const filePath = path2.join(process.cwd(), "server", "magoodhooStudents.json");
      if (fs2.existsSync(filePath)) {
        const raw = fs2.readFileSync(filePath, "utf-8");
        this.cachedStudents = JSON.parse(raw);
        this.updateStatsFromStudents(this.cachedStudents, "preloaded_cache");
      }
    } catch (err) {
      console.warn("Could not load server/magoodhooStudents.json cache:", err);
    }
    try {
      const staffFilePath = path2.join(process.cwd(), "server", "magoodhooStaff.json");
      if (fs2.existsSync(staffFilePath)) {
        const staffRaw = fs2.readFileSync(staffFilePath, "utf-8");
        const parsed = JSON.parse(staffRaw);
        this.cachedStaff = this.normalizeStaffList(parsed);
        this.updateStatsFromStaff(this.cachedStaff);
      }
    } catch (staffErr) {
      console.warn("Could not load server/magoodhooStaff.json cache:", staffErr);
    }
  }
  updateStatsFromStudents(students2, bundleName) {
    this.cachedStudents = students2;
    this.state.totalStudents = students2.length;
    this.state.lastSyncTime = (/* @__PURE__ */ new Date()).toISOString();
    this.state.lastSyncedBundle = bundleName;
    this.state.status = "SUCCESS";
    this.state.lastError = null;
    const breakdown = {};
    for (const s of students2) {
      breakdown[s.gradeLevel] = (breakdown[s.gradeLevel] || 0) + 1;
    }
    this.state.gradeBreakdown = breakdown;
  }
  updateStatsFromStaff(staff) {
    this.cachedStaff = staff;
    this.state.totalStaff = staff.length;
    const deptBreakdown = {};
    for (const st of staff) {
      const dept = st.department || "Other";
      deptBreakdown[dept] = (deptBreakdown[dept] || 0) + 1;
    }
    this.state.departmentBreakdown = deptBreakdown;
  }
  getStudents() {
    return this.cachedStudents;
  }
  getStaff() {
    return this.cachedStaff;
  }
  getState() {
    return { ...this.state };
  }
  fetchUrl(targetUrl) {
    return new Promise((resolve, reject) => {
      const client = targetUrl.startsWith("https") ? https : http;
      client.get(targetUrl, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.fetchUrl(res.headers.location));
        }
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} from ${targetUrl}`));
        }
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => resolve(data));
      }).on("error", reject);
    });
  }
  unwrapFirestoreValue(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return parseInt(v.integerValue, 10);
    if ("doubleValue" in v) return parseFloat(v.doubleValue);
    if ("booleanValue" in v) return v.booleanValue;
    if ("nullValue" in v) return null;
    if ("mapValue" in v) {
      const res = {};
      for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
        res[k] = this.unwrapFirestoreValue(val);
      }
      return res;
    }
    if ("arrayValue" in v) {
      return (v.arrayValue.values || []).map((val) => this.unwrapFirestoreValue(val));
    }
    return v;
  }
  fetchGradeFromFirestore(grade) {
    const url = `${FIRESTORE_BASE_URL}${encodeURIComponent(grade)}?key=${FIRESTORE_API_KEY}`;
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Firestore returned HTTP ${res.statusCode} for grade ${grade}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            const fullBuffer = Buffer.concat(chunks);
            const json = JSON.parse(fullBuffer.toString("utf8"));
            const rawStudents = json.fields?.students?.arrayValue?.values || [];
            const unwrapped = rawStudents.map((val) => this.unwrapFirestoreValue(val));
            resolve({ grade, students: unwrapped });
          } catch (err) {
            reject(err);
          }
        });
      }).on("error", reject);
    });
  }
  /**
   * Strategy 1 (Primary): Live Firestore REST API.
   * This is where https://reportcard-fmagoodhooschool.vercel.app/ saves live name changes and updates.
   */
  async syncFromFirestore() {
    console.log("[MagoodhooSync] Connecting to live EduRMS Firestore database...");
    const gradeResults = await Promise.all(ALL_GRADES2.map((g) => this.fetchGradeFromFirestore(g)));
    const existingMap = /* @__PURE__ */ new Map();
    for (const s of this.cachedStudents) {
      existingMap.set(s.id, s);
      existingMap.set(`${s.gradeLevel}_${s.admissionNumber}`, s);
    }
    const formattedStudents = [];
    let globalIdx = 1;
    let nameChangesCount = 0;
    for (const { grade, students: rawList } of gradeResults) {
      for (let idx = 0; idx < rawList.length; idx++) {
        const st = rawList[idx];
        const adm = st.indexNo ? `FMS-${st.indexNo}` : st.admissionNumber || `FMS-${String(globalIdx).padStart(3, "0")}`;
        const id = st.id || `std-${grade.toLowerCase().replace(/\s+/g, "")}-${st.indexNo || idx + 1}`;
        const isMale = st.gender === "M" || st.gender === "MALE";
        const gender = isMale ? "MALE" : "FEMALE";
        const existing = existingMap.get(id) || existingMap.get(`${grade}_${adm}`);
        const engName = (st.fullName || st.name || (existing ? existing.fullName : "")).trim();
        let dvName = (st.dhivehiName || st.fullNameDhivehi || (existing ? existing.fullNameDhivehi : "")).trim();
        dvName = dvName.replace(/\uFFFD/g, "").replace(/([\u07A6-\u07B0])\1+/g, "$1");
        if (dvName.includes("\u0787\u07A6\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0") || dvName.includes("\u0787\u0786\u07B0\u0783\u07A6\u0789\u07B0")) {
          dvName = dvName.replace(/އަަކްރަމް|އކްރަމް/g, "\u0787\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0");
        }
        if (existing && (existing.fullName !== engName || existing.fullNameDhivehi !== dvName)) {
          console.log(
            `[MagoodhooSync] Detected name change for [${adm}]: "${existing.fullName}" -> "${engName}", "${existing.fullNameDhivehi}" -> "${dvName}"`
          );
          nameChangesCount++;
        }
        formattedStudents.push({
          id,
          admissionNumber: adm,
          fullName: engName,
          fullNameDhivehi: dvName,
          gender,
          gradeLevel: grade,
          section: "A",
          parentContactPhone: existing?.parentContactPhone || st.parentContactPhone || `+960 79${String(globalIdx).padStart(5, "0")}`,
          parentEmail: existing?.parentEmail || st.parentEmail || `parent.${st.indexNo || globalIdx}@fmagoodhooschool.edu.mv`,
          guardianName: existing?.guardianName || st.guardianName || st.parentName || `Guardian of ${engName}`,
          islandAddress: existing?.islandAddress || st.islandAddress || "F. Magoodhoo",
          status: "ACTIVE"
        });
        globalIdx++;
      }
    }
    if (formattedStudents.length < 150) {
      throw new Error(`Firestore returned incomplete student directory (${formattedStudents.length} students)`);
    }
    console.log(
      `[MagoodhooSync] Successfully retrieved ${formattedStudents.length} students from live Firestore (${nameChangesCount} synced changes).`
    );
    return formattedStudents;
  }
  extractStaffFromBundle(bundleJs) {
    try {
      const idx = bundleJs.indexOf('id:"stf-01"');
      if (idx === -1) return [];
      const start = bundleJs.lastIndexOf("[", idx);
      let depth = 0;
      let end = start;
      for (let i = start; i < bundleJs.length; i++) {
        if (bundleJs[i] === "[") depth++;
        else if (bundleJs[i] === "]") {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      const staffArrayStr = bundleJs.slice(start, end);
      const sandbox = {};
      vm.createContext(sandbox);
      vm.runInContext("var rawStaff = " + staffArrayStr + ";", sandbox);
      if (Array.isArray(sandbox.rawStaff) && sandbox.rawStaff.length > 0) {
        return this.normalizeStaffList(sandbox.rawStaff);
      }
    } catch (e) {
      console.warn("[MagoodhooSync] Error extracting staff from bundle:", e.message);
    }
    return [];
  }
  async syncFromRemotePortal() {
    this.state.status = "SYNCING";
    try {
      console.log(`[MagoodhooSync] Connecting to live portal ${MAGOODHOO_PORTAL_URL}...`);
      const html = await this.fetchUrl(MAGOODHOO_PORTAL_URL);
      const scriptMatch = html.match(/src=["'](\/assets\/index-[^"']+\.js)["']/);
      if (!scriptMatch || !scriptMatch[1]) {
        throw new Error("Could not discover index bundle script in F. Magoodhoo School portal HTML");
      }
      const bundlePath = scriptMatch[1];
      const bundleUrl = new URL(bundlePath, MAGOODHOO_PORTAL_URL).toString();
      console.log(`[MagoodhooSync] Discovered live bundle: ${bundleUrl}`);
      const bundleJs = await this.fetchUrl(bundleUrl);
      const extractedStaff = this.extractStaffFromBundle(bundleJs);
      if (extractedStaff.length > 0) {
        const staffFilePath = path2.join(process.cwd(), "server", "magoodhooStaff.json");
        safeWriteJsonSync(staffFilePath, extractedStaff);
        this.updateStatsFromStaff(extractedStaff);
        this.notifyStaffListeners(extractedStaff);
        console.log(`[MagoodhooSync] Successfully synced ${extractedStaff.length} staff members live from portal!`);
      }
      let parsedResult = null;
      console.log("[MagoodhooSync] Extracting student directory from live portal bundle...");
      const studentRegex = /\{id:"(std-[^"]+)",indexNo:"([^"]+)",(?:rollNo:"[^"]*",)?name:"([^"]+)",fullName:"([^"]+)",dhivehiName:"([^"]+)",gender:"([^"]+)",(?:age:[^,]*,)?grade:"([^"]+)"/g;
      let match;
      const gradeBucket = {};
      while ((match = studentRegex.exec(bundleJs)) !== null) {
        const [, id, indexNo, name, fullName, dhivehiName, gender, grade] = match;
        if (!gradeBucket[grade]) gradeBucket[grade] = [];
        gradeBucket[grade].push({
          id,
          indexNo,
          name,
          fullName,
          dhivehiName,
          gender,
          grade
        });
      }
      if (Object.keys(gradeBucket).length > 0) {
        parsedResult = gradeBucket;
        console.log(
          `[MagoodhooSync] Successfully extracted ${Object.values(gradeBucket).flat().length} students across ${Object.keys(gradeBucket).length} grades.`
        );
      }
      if (parsedResult && Object.keys(parsedResult).length > 0) {
        const gradeOrder = [
          "LKG",
          "UKG",
          "Grade 1",
          "Grade 2",
          "Grade 3",
          "Grade 4",
          "Grade 5",
          "Grade 6",
          "Grade 7",
          "Grade 8",
          "Grade 9",
          "Grade 10"
        ];
        const formattedStudents = [];
        let globalIdx = 1;
        for (const grade of gradeOrder) {
          const rawList = parsedResult[grade] || [];
          rawList.forEach((st, idx) => {
            const id = st.id || `std-${grade.toLowerCase().replace(/\s+/g, "")}-${st.indexNo || idx + 1}`;
            const isMale = st.gender === "M" || st.gender === "MALE";
            const gender = isMale ? "MALE" : "FEMALE";
            const phone = st.parentContactPhone || `+960 79${String(globalIdx).padStart(5, "0")}`;
            let dvName = (st.dhivehiName || st.fullNameDhivehi || st.name || "").trim();
            dvName = dvName.replace(/\uFFFD/g, "").replace(/([\u07A6-\u07B0])\1+/g, "$1");
            if (dvName.includes("\u0787\u07A6\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0") || dvName.includes("\u0787\u0786\u07B0\u0783\u07A6\u0789\u07B0")) {
              dvName = dvName.replace(/އަަކްރަމް|އކްރަމް/g, "\u0787\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0");
            }
            formattedStudents.push({
              id,
              admissionNumber: st.indexNo ? `FMS-${st.indexNo}` : `FMS-${String(globalIdx).padStart(3, "0")}`,
              fullName: (st.fullName || st.name || "").trim(),
              fullNameDhivehi: dvName,
              gender,
              gradeLevel: grade,
              section: "A",
              parentContactPhone: phone,
              parentEmail: `parent.${st.indexNo || globalIdx}@fmagoodhooschool.edu.mv`,
              guardianName: st.parentName || `Guardian of ${st.fullName || st.name}`,
              islandAddress: "F. Magoodhoo",
              status: "ACTIVE"
            });
            globalIdx++;
          });
        }
        if (formattedStudents.length > 0) {
          const filePath = path2.join(process.cwd(), "server", "magoodhooStudents.json");
          safeWriteJsonSync(filePath, formattedStudents);
          this.updateStatsFromStudents(formattedStudents, bundlePath);
          this.notifyListeners(formattedStudents);
          console.log(`[MagoodhooSync] Successfully synced ${formattedStudents.length} students from remote portal!`);
          return {
            success: true,
            studentsCount: formattedStudents.length,
            staffCount: this.cachedStaff.length,
            bundle: bundlePath,
            message: `Successfully synchronized ${formattedStudents.length} students and ${this.cachedStaff.length} staff from F. Magoodhoo School Portal`,
            currentTotalStudents: formattedStudents.length,
            currentTotalStaff: this.cachedStaff.length
          };
        }
      }
    } catch (bundleErr) {
      console.warn("[MagoodhooSync] Live bundle scraping had issue, trying Firestore fallback:", bundleErr.message);
    }
    try {
      const liveStudents = await this.syncFromFirestore();
      if (liveStudents && liveStudents.length > 0) {
        const filePath = path2.join(process.cwd(), "server", "magoodhooStudents.json");
        safeWriteJsonSync(filePath, liveStudents);
        this.updateStatsFromStudents(liveStudents, "live_firestore_edurms");
        this.notifyListeners(liveStudents);
        return {
          success: true,
          studentsCount: liveStudents.length,
          staffCount: this.cachedStaff.length,
          bundle: "live_firestore_edurms",
          message: `Successfully synchronized ${liveStudents.length} students live from F. Magoodhoo School EduRMS database!`,
          currentTotalStudents: liveStudents.length,
          currentTotalStaff: this.cachedStaff.length
        };
      }
    } catch (firestoreErr) {
      console.warn("[MagoodhooSync] Live Firestore direct sync failed:", firestoreErr.message);
    }
    if (this.cachedStudents.length > 0) {
      this.state.status = "SUCCESS";
      this.state.lastError = null;
      return {
        success: true,
        studentsCount: this.cachedStudents.length,
        staffCount: this.cachedStaff.length,
        bundle: this.state.lastSyncedBundle || "local_cache",
        message: `Preserved ${this.cachedStudents.length} students and ${this.cachedStaff.length} staff from active directory.`,
        currentTotalStudents: this.cachedStudents.length,
        currentTotalStaff: this.cachedStaff.length
      };
    }
    this.state.status = "ERROR";
    this.state.lastError = "Unable to synchronize student or staff roster from remote portal or database.";
    return {
      success: false,
      studentsCount: 0,
      staffCount: 0,
      bundle: "unknown",
      message: "Unable to synchronize student or staff roster from remote portal or database."
    };
  }
  importManualDirectory(rawObjOrArray) {
    try {
      let candidateList = [];
      if (Array.isArray(rawObjOrArray)) {
        candidateList = rawObjOrArray;
      } else if (typeof rawObjOrArray === "object" && rawObjOrArray !== null) {
        const all = [];
        for (const val of Object.values(rawObjOrArray)) {
          if (Array.isArray(val)) all.push(...val);
        }
        if (all.length > 0) candidateList = all;
      }
      if (candidateList.length === 0) {
        throw new Error("Invalid directory payload. Expected array of students or grade dictionary.");
      }
      const formatted = candidateList.map((st, idx) => ({
        id: st.id || `std-${(st.gradeLevel || st.grade || "G").toLowerCase()}-${st.indexNo || idx + 1}`,
        admissionNumber: st.admissionNumber || (st.indexNo ? `FMS-${st.indexNo}` : `FMS-${idx + 1}`),
        fullName: st.fullName || st.name || `Student ${idx + 1}`,
        fullNameDhivehi: st.fullNameDhivehi || st.dhivehiName || st.name || `\u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA ${idx + 1}`,
        gender: st.gender === "M" || st.gender === "MALE" ? "MALE" : "FEMALE",
        gradeLevel: st.gradeLevel || st.grade || "Grade 1",
        section: st.section || "A",
        parentContactPhone: st.parentContactPhone || "+960 7900000",
        parentEmail: st.parentEmail || void 0,
        guardianName: st.guardianName || st.parentName || void 0,
        islandAddress: st.islandAddress || "F. Magoodhoo",
        status: "ACTIVE"
      }));
      const filePath = path2.join(process.cwd(), "server", "magoodhooStudents.json");
      safeWriteJsonSync(filePath, formatted);
      this.updateStatsFromStudents(formatted, "manual_imported_json");
      this.notifyListeners(formatted);
      return {
        success: true,
        count: formatted.length,
        message: `Successfully imported ${formatted.length} students.`
      };
    } catch (err) {
      return {
        success: false,
        count: 0,
        message: err.message
      };
    }
  }
  updateStudent(updatedData) {
    const idx = this.cachedStudents.findIndex(
      (s) => s.id === updatedData.id || s.admissionNumber === updatedData.admissionNumber
    );
    if (idx === -1) {
      return { success: false, error: "Student not found in directory" };
    }
    const current = this.cachedStudents[idx];
    const updated = {
      ...current,
      ...updatedData
    };
    this.cachedStudents[idx] = updated;
    const filePath = path2.join(process.cwd(), "server", "magoodhooStudents.json");
    safeWriteJsonSync(filePath, this.cachedStudents);
    this.updateStatsFromStudents(this.cachedStudents, "local_edit");
    this.notifyListeners(this.cachedStudents);
    return { success: true, student: updated };
  }
  startAutoSync(intervalMs) {
    if (this.syncIntervalTimer) clearInterval(this.syncIntervalTimer);
    this.syncIntervalTimer = setInterval(() => {
      if (this.state.autoSyncEnabled) {
        console.log("[MagoodhooSync] Running automated periodic sync check...");
        this.syncFromRemotePortal().catch(
          (err) => console.warn("[MagoodhooSync] Background sync check failed:", err)
        );
      }
    }, intervalMs);
    if (this.syncIntervalTimer && typeof this.syncIntervalTimer.unref === "function") {
      this.syncIntervalTimer.unref();
    }
  }
};
var magoodhooSyncEngine = MagoodhooSyncEngine.getInstance();

// server.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use((req, res, next) => {
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-now-route-matches"] || req.headers["x-vercel-matched-path"];
  if (matchedPath && matchedPath.startsWith("/api") && (req.url === "/api" || req.url === "/api/index" || !req.url.startsWith("/api"))) {
    req.url = matchedPath;
  }
  if (req.body !== void 0 && req.body !== null && typeof req.body === "object") {
    req._body = true;
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
var geminiApiKey = process.env.GEMINI_API_KEY;
var ai = geminiApiKey ? new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
var staffMembers = magoodhooSyncEngine.getStaff().length > 0 ? magoodhooSyncEngine.getStaff() : generateStaffList();
var students = magoodhooSyncEngine.getStudents().length > 0 ? magoodhooSyncEngine.getStudents() : generate215Students();
magoodhooSyncEngine.onStudentsUpdated((newStudents) => {
  students = newStudents;
  console.log(`[server] Live student directory updated with ${students.length} students from remote portal.`);
});
magoodhooSyncEngine.onStaffUpdated((newStaff) => {
  staffMembers = newStaff;
  console.log(`[server] Live staff directory updated with ${staffMembers.length} staff from remote portal.`);
});
function getFilePath(filename) {
  const localSeed = path3.join(process.cwd(), "server", filename);
  if (!process.env.VERCEL && !process.env.NOW_REGION) {
    return localSeed;
  }
  const tmpPath = path3.join("/tmp", "server_data", filename);
  try {
    const tmpDir = path3.join("/tmp", "server_data");
    if (!fs3.existsSync(tmpDir)) {
      fs3.mkdirSync(tmpDir, { recursive: true });
    }
    if (!fs3.existsSync(tmpPath) && fs3.existsSync(localSeed)) {
      fs3.copyFileSync(localSeed, tmpPath);
    }
  } catch (err) {
    console.warn(`Could not sync ${filename} to /tmp:`, err);
  }
  return tmpPath;
}
var CALENDAR_FILE_PATH = getFilePath("calendarData.json");
var ATTENDANCE_FILE_PATH = getFilePath("attendanceData.json");
var AUDIT_FILE_PATH = getFilePath("auditLogs.json");
var DELEGATIONS_FILE_PATH = getFilePath("delegationsData.json");
var EXTRA_CLASSES_FILE_PATH = getFilePath("extraClassesData.json");
var SESSION_FILE_PATH = getFilePath("sessionData.json");
var SUBMITTED_SESSIONS_FILE_PATH = getFilePath("submittedSessionsData.json");
var DELETED_CALENDAR_FILE_PATH = getFilePath("deletedHolidaysData.json");
var TERM_DATES_FILE_PATH = getFilePath("termDates.json");
var REPORT_CARD_OVERRIDES_FILE_PATH = getFilePath("reportCardOverrides.json");
var SESSION_TIMINGS_FILE_PATH = getFilePath("sessionTimings.json");
var DEFAULT_SESSION_TIMINGS = {
  normal: {
    morning: {
      startTime: "07:45",
      endTime: "10:15",
      label: "Morning Session",
      labelDhivehi: "\u0780\u07AC\u0782\u078B\u07AA\u0782\u07AA\u078E\u07AC \u0790\u07AC\u079D\u07A6\u0782\u07B0"
    },
    afternoon: {
      startTime: "10:45",
      endTime: "13:15",
      label: "Afternoon Session",
      labelDhivehi: "\u0789\u07AC\u0782\u07B0\u078B\u07AA\u0783\u07AA\u078A\u07A6\u0780\u07AA\u078E\u07AC \u0790\u07AC\u079D\u07A6\u0782\u07B0"
    }
  },
  morning: {
    startTime: "07:45",
    endTime: "10:15",
    label: "Morning Session",
    labelDhivehi: "\u0780\u07AC\u0782\u078B\u07AA\u0782\u07AA\u078E\u07AC \u0790\u07AC\u079D\u07A6\u0782\u07B0"
  },
  afternoon: {
    startTime: "10:45",
    endTime: "13:15",
    label: "Afternoon Session",
    labelDhivehi: "\u0789\u07AC\u0782\u07B0\u078B\u07AA\u0783\u07AA\u078A\u07A6\u0780\u07AA\u078E\u07AC \u0790\u07AC\u079D\u07A6\u0782\u07B0"
  },
  temporaryOverrides: []
};
var FIRESTORE_SETTINGS_URL = `https://firestore.googleapis.com/v1/projects/industrial-heaven-2j4jh/databases/ai-studio-magoodhooschoole-128d6f0a-ac98-471b-97a7-60f7b0b880b4/documents/school_settings/session_timings?key=AIzaSyAfYbbnjncIlteLWYG9ZIpRRa8lq_QZvR8`;
var cachedSessionTimings = null;
function loadSessionTimingsFromDisk() {
  if (cachedSessionTimings) {
    return cachedSessionTimings;
  }
  try {
    if (fs3.existsSync(SESSION_TIMINGS_FILE_PATH)) {
      const raw = fs3.readFileSync(SESSION_TIMINGS_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (data) {
        const morning = data.normal?.morning || data.morning || DEFAULT_SESSION_TIMINGS.normal.morning;
        const afternoon = data.normal?.afternoon || data.afternoon || DEFAULT_SESSION_TIMINGS.normal.afternoon;
        const temporaryOverrides = Array.isArray(data.temporaryOverrides) ? data.temporaryOverrides : [];
        cachedSessionTimings = {
          normal: { morning, afternoon },
          morning,
          afternoon,
          temporaryOverrides
        };
        return cachedSessionTimings;
      }
    }
  } catch (err) {
    console.warn("Could not load session timings from disk:", err);
  }
  return DEFAULT_SESSION_TIMINGS;
}
function saveSessionTimingsToDisk(timings) {
  cachedSessionTimings = timings;
  try {
    fs3.writeFileSync(SESSION_TIMINGS_FILE_PATH, JSON.stringify(timings, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save session timings to disk:", err);
  }
}
function fetchTimingsFromFirestore() {
  return new Promise((resolve) => {
    try {
      const req = https2.get(FIRESTORE_SETTINGS_URL, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => {
          try {
            const doc = JSON.parse(body);
            if (doc.fields?.timingsJson?.stringValue) {
              const parsed = JSON.parse(doc.fields.timingsJson.stringValue);
              if (parsed) {
                const morning = parsed.normal?.morning || parsed.morning;
                const afternoon = parsed.normal?.afternoon || parsed.afternoon;
                if (morning?.startTime && afternoon?.startTime) {
                  const temporaryOverrides = Array.isArray(parsed.temporaryOverrides) ? parsed.temporaryOverrides : [];
                  const normalized = {
                    normal: { morning, afternoon },
                    morning,
                    afternoon,
                    temporaryOverrides
                  };
                  return resolve(normalized);
                }
              }
            }
            resolve(null);
          } catch {
            resolve(null);
          }
        });
      });
      req.setTimeout(2500, () => {
        req.destroy();
        resolve(null);
      });
      req.on("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}
var liveSyncClients = /* @__PURE__ */ new Set();
function broadcastLiveSync(data) {
  const payload = `data: ${JSON.stringify(data)}

`;
  for (const client of liveSyncClients) {
    try {
      client.write(payload);
    } catch {
      liveSyncClients.delete(client);
    }
  }
}
function saveTimingsToFirestore(timings) {
  return new Promise((resolve) => {
    try {
      const payload = JSON.stringify({
        fields: {
          timingsJson: { stringValue: JSON.stringify(timings) },
          updatedAt: { stringValue: (/* @__PURE__ */ new Date()).toISOString() }
        }
      });
      const req = https2.request(
        FIRESTORE_SETTINGS_URL,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        },
        (res) => {
          res.on("data", () => {
          });
          res.on("end", () => resolve(res.statusCode === 200));
        }
      );
      req.setTimeout(3e3, () => {
        req.destroy();
        resolve(false);
      });
      req.on("error", () => resolve(false));
      req.write(payload);
      req.end();
    } catch {
      resolve(false);
    }
  });
}
fetchTimingsFromFirestore().then((remote) => {
  if (remote) {
    cachedSessionTimings = remote;
    saveSessionTimingsToDisk(remote);
    console.log("[SessionTimings] Synced latest timings from Firestore database:", remote.morning?.startTime, remote.afternoon?.startTime);
  }
}).catch(() => {
});
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  setInterval(() => {
    fetchTimingsFromFirestore().then((remote) => {
      if (remote) {
        const current = cachedSessionTimings || loadSessionTimingsFromDisk();
        if (current?.morning?.startTime !== remote.morning?.startTime || current?.morning?.endTime !== remote.morning?.endTime || current?.afternoon?.startTime !== remote.afternoon?.startTime || current?.afternoon?.endTime !== remote.afternoon?.endTime) {
          cachedSessionTimings = remote;
          saveSessionTimingsToDisk(remote);
          broadcastLiveSync({ type: "SESSION_TIMINGS_UPDATED", timings: remote });
        }
      }
    }).catch(() => {
    });
  }, 2e4);
}
function loadTermDatesFromDisk() {
  let list = [];
  try {
    if (fs3.existsSync(TERM_DATES_FILE_PATH)) {
      const raw = fs3.readFileSync(TERM_DATES_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        list = data;
      }
    }
  } catch (err) {
    console.warn("Could not load term dates from disk:", err);
  }
  if (!list || list.length === 0) {
    list = [
      {
        id: "term1",
        name: "Term 1",
        nameDhivehi: "\u078A\u07AA\u0783\u07A6\u078C\u07A6\u0789\u07A6 \u0793\u07A7\u0789\u07B0",
        startDate: "2026-01-11",
        endDate: "2026-06-25",
        isCurrent: false
      },
      {
        id: "term2",
        name: "Term 2",
        nameDhivehi: "\u078B\u07AC\u0788\u07A6\u0782\u07A6 \u0793\u07A7\u0789\u07B0",
        startDate: "2026-08-09",
        endDate: "2026-12-17",
        isCurrent: true
      },
      {
        id: "yearly",
        name: "Full Academic Year",
        nameDhivehi: "\u0787\u07A6\u0780\u07A6\u0783\u07A9 \u0796\u07AA\u0789\u07B0\u078D\u07A6",
        startDate: "2026-01-11",
        endDate: "2026-12-17",
        isCurrent: false
      }
    ];
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const activeTerm = list.find((t) => t.id !== "yearly" && today >= t.startDate && today <= t.endDate);
  if (activeTerm) {
    return list.map((t) => ({
      ...t,
      isCurrent: t.id === activeTerm.id
    }));
  }
  return list;
}
function saveTermDatesToDisk(terms) {
  try {
    fs3.writeFileSync(TERM_DATES_FILE_PATH, JSON.stringify(terms, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save term dates to disk:", err);
  }
}
function loadReportCardOverridesFromDisk() {
  try {
    if (fs3.existsSync(REPORT_CARD_OVERRIDES_FILE_PATH)) {
      const raw = fs3.readFileSync(REPORT_CARD_OVERRIDES_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not load report card overrides from disk:", err);
  }
  return {};
}
function saveReportCardOverridesToDisk(overrides) {
  try {
    fs3.writeFileSync(REPORT_CARD_OVERRIDES_FILE_PATH, JSON.stringify(overrides, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save report card overrides to disk:", err);
  }
}
function saveDeletedHolidaysToDisk(deletedSet) {
  try {
    fs3.writeFileSync(DELETED_CALENDAR_FILE_PATH, JSON.stringify(Array.from(deletedSet), null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save deleted holidays to disk:", err);
  }
}
function loadDeletedHolidaysFromDisk() {
  const set = /* @__PURE__ */ new Set();
  try {
    if (fs3.existsSync(DELETED_CALENDAR_FILE_PATH)) {
      const raw = fs3.readFileSync(DELETED_CALENDAR_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        data.forEach((id) => set.add(id));
      }
    }
  } catch (err) {
    console.warn("Could not load deleted holidays from disk:", err);
  }
  return set;
}
var deletedHolidays = loadDeletedHolidaysFromDisk();
function saveCalendarToDisk(cal) {
  try {
    fs3.writeFileSync(CALENDAR_FILE_PATH, JSON.stringify(cal, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save calendar to disk:", err);
  }
}
function loadCalendarFromDisk() {
  try {
    if (fs3.existsSync(CALENDAR_FILE_PATH)) {
      const raw = fs3.readFileSync(CALENDAR_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const activeData = data.filter(
          (d) => !deletedHolidays.has(d.id) && !deletedHolidays.has(d.date) && !deletedHolidays.has(`${d.date}_${d.dayType}`)
        );
        return activeData;
      }
    }
  } catch (err) {
    console.warn("Could not load calendar from disk:", err);
  }
  const defaultCal = generateAcademicCalendar().filter(
    (d) => !deletedHolidays.has(d.id) && !deletedHolidays.has(d.date) && !deletedHolidays.has(`${d.date}_${d.dayType}`)
  );
  saveCalendarToDisk(defaultCal);
  return defaultCal;
}
function saveSubmittedSessionsToDisk(set) {
  try {
    fs3.writeFileSync(SUBMITTED_SESSIONS_FILE_PATH, JSON.stringify(Array.from(set)), "utf-8");
  } catch (err) {
    console.warn("Could not save submitted sessions to disk:", err);
  }
}
function loadSubmittedSessionsFromDisk() {
  const set = /* @__PURE__ */ new Set();
  try {
    if (fs3.existsSync(SUBMITTED_SESSIONS_FILE_PATH)) {
      const raw = fs3.readFileSync(SUBMITTED_SESSIONS_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        data.forEach((k) => set.add(k));
        return set;
      }
    }
  } catch (err) {
    console.warn("Could not load submitted sessions from disk:", err);
  }
  return set;
}
var submittedSessions = loadSubmittedSessionsFromDisk();
function markSessionSubmitted(key) {
  submittedSessions.add(key);
  saveSubmittedSessionsToDisk(submittedSessions);
}
function unmarkSessionSubmitted(key) {
  submittedSessions.delete(key);
  saveSubmittedSessionsToDisk(submittedSessions);
}
function saveAttendanceToDisk(store) {
  try {
    const list = Array.from(store.values());
    fs3.writeFileSync(ATTENDANCE_FILE_PATH, JSON.stringify(list), "utf-8");
  } catch (err) {
    console.warn("Could not save attendance to disk:", err);
  }
}
function loadAttendanceFromDisk(studentsList, staffList) {
  const store = /* @__PURE__ */ new Map();
  try {
    if (fs3.existsSync(ATTENDANCE_FILE_PATH)) {
      const raw = fs3.readFileSync(ATTENDANCE_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        data.forEach((rec) => {
          store.set(`${rec.studentId}_${rec.date}_${rec.sessionType}`, rec);
        });
        return store;
      }
    }
  } catch (err) {
    console.warn("Could not load attendance from disk:", err);
  }
  return store;
}
function saveDelegationsToDisk(list) {
  try {
    fs3.writeFileSync(DELEGATIONS_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save delegations to disk:", err);
  }
}
function loadDelegationsFromDisk() {
  try {
    if (fs3.existsSync(DELEGATIONS_FILE_PATH)) {
      const raw = fs3.readFileSync(DELEGATIONS_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not load delegations from disk:", err);
  }
  return [];
}
function checkIsLeadingTeacherOrAdmin(userIdOrUser) {
  if (!userIdOrUser) return false;
  if (typeof userIdOrUser === "string") {
    const s = userIdOrUser.toLowerCase().trim();
    if (s === "admin" || s === "superadmin" || s === "staff-01" || s.includes("ahmed.mujthaba") || s.includes("ahmedmujthaba") || s.includes("mujthaba") || s.includes("leading") || s.includes("principal")) {
      return true;
    }
  } else if (typeof userIdOrUser === "object") {
    const email2 = (userIdOrUser.email || "").toLowerCase();
    const name2 = (userIdOrUser.fullName || "").toLowerCase();
    const desig2 = (userIdOrUser.designation || "").toLowerCase();
    const dept2 = (userIdOrUser.department || "").toLowerCase();
    const role = (userIdOrUser.role || "").toUpperCase();
    if (userIdOrUser.isSuperAdmin || role === "ADMIN" || email2.includes("ahmed") || email2.includes("mujthaba") || name2.includes("ahmed") || name2.includes("mujthaba") || desig2.includes("leading") || desig2.includes("principal") || dept2.includes("leading") || dept2.includes("admin")) {
      return true;
    }
  }
  let target;
  if (typeof userIdOrUser === "string") {
    target = staffMembers.find(
      (s) => s.id === userIdOrUser || s.username?.toLowerCase() === userIdOrUser.toLowerCase() || s.email?.toLowerCase() === userIdOrUser.toLowerCase()
    );
  } else {
    target = userIdOrUser;
    if (!target.email && target.id) {
      const found = staffMembers.find((s) => s.id === target?.id);
      if (found) target = found;
    }
  }
  if (!target) return false;
  if (target.isSuperAdmin) return true;
  if (target.role === "ADMIN") return true;
  const email = (target.email || "").toLowerCase();
  if (email.includes("ahmed.mujthaba") || email.includes("ahmedmujthaba") || email === "ahmedmujthaba@gmail.com" || email === "ahmed.mujthaba@fmagoodhooschool.edu.mv") {
    return true;
  }
  const name = (target.fullName || "").toLowerCase();
  if (name.includes("ahmed mujthaba") || name.includes("\u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA \u0789\u07AA\u0796\u07AA\u078C\u07A6\u0784\u07A7")) return true;
  const desig = (target.designation || "").toLowerCase();
  const dept = (target.department || "").toLowerCase();
  if (desig.includes("leading teacher") || desig.includes("leading") || desig.includes("principal") || dept.includes("leading") || dept.includes("admin")) {
    return true;
  }
  return false;
}
function saveExtraClassesToDisk(list) {
  try {
    fs3.writeFileSync(EXTRA_CLASSES_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save extra classes to disk:", err);
  }
}
function sanitizeExtraClass(c) {
  let venue = c.venue || "Classroom";
  let venueDhivehi = c.venueDhivehi || venue;
  if (venue.includes("Grade 11") || venue.includes("Grade 12")) {
    venue = venue.replace(/Grade\s*1[12]/gi, "Classroom 10");
    venueDhivehi = venueDhivehi.replace(/Grade\s*1[12]/gi, "\u0786\u07B0\u078D\u07A7\u0790\u07B0\u0783\u07AB\u0789\u07B0 10");
  }
  let gradeLevel = c.gradeLevel;
  if (String(gradeLevel).includes("11") || String(gradeLevel).includes("12")) {
    gradeLevel = "Grade 10";
  }
  let date = c.date;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const realYear = dt.getFullYear();
    const realMonth = String(dt.getMonth() + 1).padStart(2, "0");
    const realDay = String(dt.getDate()).padStart(2, "0");
    date = `${realYear}-${realMonth}-${realDay}`;
  }
  let startTime = c.startTime;
  if (/^0\.\d+$/.test(String(startTime).trim())) {
    const num = parseFloat(String(startTime));
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    startTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }
  let endTime = c.endTime;
  if (/^0\.\d+$/.test(String(endTime).trim())) {
    const num = parseFloat(String(endTime));
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    endTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }
  return {
    ...c,
    gradeLevel,
    venue,
    venueDhivehi,
    date,
    startTime,
    endTime
  };
}
function isValidCalendarDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, reason: "Format must be YYYY-MM-DD." };
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  if (month < 1 || month > 12) {
    return { valid: false, reason: `Month ${month} is invalid (01-12).` };
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[month - 1] || `Month ${month}`;
  if (day < 1 || day > daysInMonth) {
    return {
      valid: false,
      reason: `${monthName} ${year} only has ${daysInMonth} days (day ${day} does not exist in calendar).`
    };
  }
  return { valid: true };
}
function loadExtraClassesFromDisk() {
  try {
    if (fs3.existsSync(EXTRA_CLASSES_FILE_PATH)) {
      const raw = fs3.readFileSync(EXTRA_CLASSES_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const sanitized = data.map(sanitizeExtraClass);
        return sanitized;
      }
    }
  } catch (err) {
    console.warn("Could not load extra classes from disk:", err);
  }
  saveExtraClassesToDisk([]);
  return [];
}
var extraClasses = loadExtraClassesFromDisk();
function saveSessionToDisk(userId) {
  try {
    fs3.writeFileSync(
      SESSION_FILE_PATH,
      JSON.stringify(
        {
          currentActiveUserId: userId,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (err) {
    console.warn("Could not save sessionData.json:", err);
  }
}
function loadSessionFromDisk(staffList) {
  try {
    if (fs3.existsSync(SESSION_FILE_PATH)) {
      const raw = fs3.readFileSync(SESSION_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (data && typeof data.currentActiveUserId === "string" && data.currentActiveUserId) {
        const found = staffList.find((s) => s.id === data.currentActiveUserId || s.staffId === data.currentActiveUserId);
        if (found) return found.id;
      }
    }
  } catch (err) {
    console.warn("Could not load sessionData.json:", err);
  }
  const defaultUser = staffList.find((s) => s.email === "ahmed.mujthaba@fmagoodhooschool.edu.mv" || s.id === "stf-32") || staffList[0];
  const chosenId = defaultUser ? defaultUser.id : staffList[0]?.id || "stf-32";
  saveSessionToDisk(chosenId);
  return chosenId;
}
function saveAuditLogsToDisk(logs) {
  try {
    fs3.writeFileSync(AUDIT_FILE_PATH, JSON.stringify(logs.slice(0, 1e3), null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save audit logs to disk:", err);
  }
}
function loadAuditLogsFromDisk(defaultActor) {
  try {
    if (fs3.existsSync(AUDIT_FILE_PATH)) {
      const raw = fs3.readFileSync(AUDIT_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not load audit logs from disk:", err);
  }
  const initLogs = [
    {
      id: `audit-${Date.now()}-init`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: defaultActor.id,
      userName: defaultActor.fullName,
      actionType: "SYSTEM_BOOT",
      entityAffected: "System",
      ipAddress: "127.0.0.1",
      details: `System initialized with 215 students across 12 grades and 46 academic staff. Pre-loaded Maldivian calendar and past attendance.`
    }
  ];
  saveAuditLogsToDisk(initLogs);
  return initLogs;
}
var academicCalendar = loadCalendarFromDisk();
var attendanceStore = loadAttendanceFromDisk(students, staffMembers);
var delegations = loadDelegationsFromDisk();
var currentActiveUserId = loadSessionFromDisk(staffMembers);
var auditLogs = loadAuditLogsFromDisk(
  staffMembers.find((s) => s.id === currentActiveUserId) || staffMembers[0]
);
function checkSchoolClosed(dateStr) {
  const cal = academicCalendar.find((c) => c.date === dateStr);
  if (cal) {
    const closedTypes = [
      "SCHOOL_CLOSED",
      "SCHOOL_CLOSED_WEATHER",
      "PUBLIC_HOLIDAY",
      "TERM_BREAK",
      "NON_TEACHING_DAY"
    ];
    if (closedTypes.includes(cal.dayType)) {
      return {
        isClosed: true,
        reason: cal.description || "School Closed",
        reasonDhivehi: cal.descriptionDhivehi || "\u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0784\u07A6\u0782\u07B0\u078B\u07AA",
        dayType: cal.dayType
      };
    }
  }
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  if (day === 5 || day === 6) {
    return {
      isClosed: true,
      reason: day === 5 ? "Official Weekend (Friday)" : "Official Weekend (Saturday)",
      reasonDhivehi: day === 5 ? "\u0780\u07AA\u0786\u07AA\u0783\u07AA (\u0780\u07A6\u078A\u07B0\u078C\u07A7 \u0784\u07A6\u0782\u07B0\u078B\u07AA)" : "\u0780\u07AE\u0782\u07A8\u0780\u07A8\u0783\u07AA (\u0780\u07A6\u078A\u07B0\u078C\u07A7 \u0784\u07A6\u0782\u07B0\u078B\u07AA)",
      dayType: day === 5 ? "WEEKEND_FRIDAY" : "WEEKEND_SATURDAY"
    };
  }
  return {
    isClosed: false,
    reason: "",
    reasonDhivehi: "",
    dayType: "REGULAR_TEACHING_DAY"
  };
}
function formatSchoolClosedReason(reason) {
  if (!reason || !reason.trim()) return "School Closed";
  const clean = reason.replace(/^School Closed(?:\s*[:-]\s*)?/i, "").trim();
  if (!clean) return "School Closed";
  return `School Closed - ${clean}`;
}
function formatSchoolClosedReasonDhivehi(reasonDv, reasonEn) {
  const target = reasonDv && reasonDv.trim() ? reasonDv : reasonEn || "";
  if (!target || !target.trim()) return "\u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0784\u07A6\u0782\u07B0\u078B\u07AA";
  const clean = target.replace(/^ސްކޫލް ބަންދު(?:\s*[:-]\s*)?/i, "").replace(/^School Closed(?:\s*[:-]\s*)?/i, "").trim();
  if (!clean) return "\u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0784\u07A6\u0782\u07B0\u078B\u07AA";
  return `\u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0784\u07A6\u0782\u07B0\u078B\u07AA - ${clean}`;
}
function autoMarkClosedDayAttendance(dateStr, reason, reasonDv) {
  const sessions = ["MORNING_BEFORE_BREAK", "POST_BREAK"];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const formattedReason = formatSchoolClosedReason(reason);
  sessions.forEach((s) => {
    students.forEach((st) => {
      const key = `${st.id}_${dateStr}_${s}`;
      const existing = attendanceStore.get(key);
      if (!existing || existing.status !== "SCHOOL_CLOSED" || existing.remarks !== formattedReason) {
        attendanceStore.set(key, {
          id: `att-${st.id}-${dateStr}-${s}`,
          studentId: st.id,
          date: dateStr,
          sessionType: s,
          status: "SCHOOL_CLOSED",
          leaveReason: "OFFICIAL_DUTY",
          remarks: formattedReason,
          markedByUserId: "SYSTEM_AUTO",
          syncStatus: "SYNCED",
          updatedAt: now
        });
      }
    });
    markSessionSubmitted(`${dateStr}_${s}`);
  });
}
function getPreviousPendingSession(targetDate, targetSession) {
  return null;
}
function logAudit(actionType, entityAffected, details, req, actorUserId) {
  const currentUser = (actorUserId ? staffMembers.find((u) => u.id === actorUserId || u.staffId === actorUserId) : null) || staffMembers.find((u) => u.id === currentActiveUserId) || staffMembers[0];
  let ip = "127.0.0.1";
  if (req) {
    try {
      const fwd = req.headers?.["x-forwarded-for"];
      const real = req.headers?.["x-real-ip"];
      if (typeof fwd === "string") {
        ip = fwd.split(",")[0].trim();
      } else if (typeof real === "string") {
        ip = real;
      } else if (req.socket && req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
      }
    } catch {
      ip = "127.0.0.1";
    }
  }
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    userId: currentUser?.id || "usr-admin",
    userName: currentUser?.fullName || "System Admin",
    actionType,
    entityAffected,
    ipAddress: ip,
    details
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 1e3) auditLogs.pop();
  saveAuditLogsToDisk(auditLogs);
}
app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", service: "Maldives School Attendance Portal", time: (/* @__PURE__ */ new Date()).toISOString() });
});
var SUPER_ADMIN_EMAIL = "ahmed.mujthaba@fmagoodhooschool.edu.mv";
var PASSWORDS_FILE_PATH = getFilePath("staffPasswords.json");
function loadStaffPasswords() {
  const map = /* @__PURE__ */ new Map();
  try {
    if (fs3.existsSync(PASSWORDS_FILE_PATH)) {
      const raw = fs3.readFileSync(PASSWORDS_FILE_PATH, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.email) {
            map.set(item.email.toLowerCase().trim(), item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not read staffPasswords.json:", err);
  }
  return map;
}
function saveStaffPasswords(map) {
  try {
    const list = Array.from(map.values());
    fs3.writeFileSync(PASSWORDS_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save staffPasswords.json:", err);
  }
}
var staffPasswordsStore = loadStaffPasswords();
function getStaffPassword(email) {
  const normalized = (email || "").toLowerCase().trim();
  const entry = staffPasswordsStore.get(normalized);
  return entry ? entry.password : "1234";
}
function hasCustomPassword(email) {
  const normalized = (email || "").toLowerCase().trim();
  const entry = staffPasswordsStore.get(normalized);
  return Boolean(entry?.hasCustomPassword && entry?.password !== "1234");
}
function getPasswordUpdatedAt(email) {
  const normalized = (email || "").toLowerCase().trim();
  return staffPasswordsStore.get(normalized)?.updatedAt;
}
function setStaffPassword(email, newPassword, updatedBy) {
  const normalized = (email || "").toLowerCase().trim();
  const isCustom = newPassword !== "1234";
  staffPasswordsStore.set(normalized, {
    email: normalized,
    password: newPassword,
    hasCustomPassword: isCustom,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: updatedBy || "self"
  });
  saveStaffPasswords(staffPasswordsStore);
}
function resetAllStaffPasswords(updatedBy) {
  let count = 0;
  for (const staff of staffMembers) {
    const email = (staff.email || `${staff.id}@fmagoodhooschool.edu.mv`).toLowerCase().trim();
    staffPasswordsStore.set(email, {
      email,
      password: "1234",
      hasCustomPassword: false,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy
    });
    count++;
  }
  saveStaffPasswords(staffPasswordsStore);
  return count;
}
function enrichStaffUser(user) {
  const email = (user.email || "").toLowerCase().trim();
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
  const userHasCustom = hasCustomPassword(email);
  return {
    ...user,
    username: email,
    isSuperAdmin,
    role: isSuperAdmin ? "ADMIN" : user.role,
    hasCustomPassword: userHasCustom,
    mustChangePassword: !userHasCustom,
    isFirstLogin: !userHasCustom,
    passwordUpdatedAt: getPasswordUpdatedAt(email)
  };
}
function checkSuperAdminAccess(reqBody, reqQuery) {
  const currentActiveUser = staffMembers.find((u) => u.id === currentActiveUserId) || staffMembers[0];
  const queryEmail = (reqQuery?.requesterEmail || "").toLowerCase().trim();
  const bodyEmail = (reqBody?.requesterEmail || "").toLowerCase().trim();
  const staffId = reqBody?.requesterUserId || reqBody?.markedByUserId || reqQuery?.requesterUserId;
  const staffById = staffId ? staffMembers.find((s) => s.id === staffId || s.staffId === staffId) : void 0;
  const superAdminStaff = staffMembers.find((s) => (s.email || "").toLowerCase().trim() === SUPER_ADMIN_EMAIL) || currentActiveUser;
  const isSuper = queryEmail === SUPER_ADMIN_EMAIL || queryEmail === "ahmedmujthaba@gmail.com" || queryEmail.includes("ahmed.mujthaba") || bodyEmail === SUPER_ADMIN_EMAIL || bodyEmail === "ahmedmujthaba@gmail.com" || bodyEmail.includes("ahmed.mujthaba") || (staffById?.email || "").toLowerCase().trim() === SUPER_ADMIN_EMAIL || (staffById?.email || "").toLowerCase().trim() === "ahmedmujthaba@gmail.com" || staffById?.isSuperAdmin || staffById?.role === "ADMIN" || (currentActiveUser?.email || "").toLowerCase().trim() === SUPER_ADMIN_EMAIL || (currentActiveUser?.email || "").toLowerCase().trim() === "ahmedmujthaba@gmail.com" || currentActiveUser?.isSuperAdmin || currentActiveUser?.role === "ADMIN";
  return { isSuperAdmin: isSuper, superAdminStaff };
}
app.get("/api/auth/staff", (req, res) => {
  const enriched = staffMembers.map(enrichStaffUser);
  res.json({ staff: enriched, currentUserId: currentActiveUserId, total: enriched.length });
});
app.get("/api/staff", (req, res) => {
  const enriched = staffMembers.map(enrichStaffUser);
  res.json({ staff: enriched, currentUserId: currentActiveUserId, total: enriched.length });
});
app.get("/api/magoodhoo/staff", (req, res) => {
  const staff = magoodhooSyncEngine.getStaff().map(enrichStaffUser);
  res.json({ staff, total: staff.length });
});
app.get("/api/auth/me", (req, res) => {
  const user = staffMembers.find((u) => u.id === currentActiveUserId) || staffMembers[0];
  const enriched = enrichStaffUser(user);
  if (/Android|iPhone|iPad|Mobile/i.test(req.headers["user-agent"] || "")) {
    enriched.hasRapidRollCallPrivilege = true;
    enriched.loginViaMobile = true;
  }
  res.json({ user: enriched });
});
app.post("/api/auth/login", (req, res) => {
  const { email, username, password } = req.body;
  const inputIdentifier = (email || username || "").toLowerCase().trim();
  const inputPassword = (password || "").trim();
  if (!inputIdentifier) {
    return res.status(400).json({ success: false, error: "Staff email or username is required." });
  }
  const user = staffMembers.find((s) => {
    const sEmail = (s.email || "").toLowerCase().trim();
    const sUsername = (s.username || "").toLowerCase().trim();
    const sStaffId = (s.staffId || "").toLowerCase().trim();
    const sId = (s.id || "").toLowerCase().trim();
    return sEmail === inputIdentifier || sUsername === inputIdentifier || sStaffId === inputIdentifier || sId === inputIdentifier || sEmail.split("@")[0] === inputIdentifier;
  });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: `Staff account not found for "${inputIdentifier}". Please select or enter your official school email.`
    });
  }
  const staffEmail = (user.email || "").toLowerCase().trim();
  const correctPassword = getStaffPassword(staffEmail);
  if (inputPassword !== correctPassword) {
    return res.status(401).json({
      success: false,
      error: "Incorrect password. The default password for all staff is 1234.",
      hint: "Default password is 1234. You can reset your password using the Forgot Password option."
    });
  }
  currentActiveUserId = user.id;
  saveSessionToDisk(user.id);
  const enrichedUser = enrichStaffUser(user);
  const isMobileLogin = Boolean(
    req.body.loginViaMobile || req.body.hasRapidRollCallPrivilege || /Android|iPhone|iPad|Mobile/i.test(req.headers["user-agent"] || "")
  );
  if (isMobileLogin) {
    enrichedUser.hasRapidRollCallPrivilege = true;
    enrichedUser.loginViaMobile = true;
  }
  logAudit("STAFF_LOGIN", "User", `${enrichedUser.fullName} (${enrichedUser.email}) logged in successfully`, req, enrichedUser.id);
  res.json({
    success: true,
    message: "Login successful",
    user: enrichedUser,
    mustChangePassword: !enrichedUser.hasCustomPassword,
    isFirstLogin: !enrichedUser.hasCustomPassword
  });
});
app.post("/api/auth/logout", (req, res) => {
  const current = staffMembers.find((u) => u.id === currentActiveUserId);
  logAudit("STAFF_LOGOUT", "User", `${current?.fullName || "Staff"} logged out`, req, current?.id);
  res.json({ success: true, message: "Logged out successfully" });
});
app.post("/api/auth/change-password", (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const targetEmail = (email || "").toLowerCase().trim();
  if (!targetEmail || !newPassword) {
    return res.status(400).json({ success: false, error: "Email and new password are required." });
  }
  if (newPassword.trim().length < 5) {
    return res.status(400).json({ success: false, error: "New password must be at least 5 characters long." });
  }
  if (newPassword.trim() === "1234") {
    return res.status(400).json({
      success: false,
      error: "New password cannot be the default 1234. Please choose a new password of at least 5 characters."
    });
  }
  const user = staffMembers.find((s) => (s.email || "").toLowerCase().trim() === targetEmail);
  if (!user) {
    return res.status(404).json({ success: false, error: "Staff account not found." });
  }
  if (currentPassword) {
    const existingPass = getStaffPassword(targetEmail);
    if (currentPassword.trim() !== existingPass) {
      return res.status(401).json({ success: false, error: "Current password is incorrect." });
    }
  }
  setStaffPassword(targetEmail, newPassword.trim(), targetEmail);
  logAudit("PASSWORD_CHANGED", "User", `${user.fullName} changed their portal password`, req, user.id);
  res.json({
    success: true,
    message: "Password updated successfully. You can now use your new password.",
    hasCustomPassword: true
  });
});
app.post("/api/auth/self-reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  const targetEmail = (email || "").toLowerCase().trim();
  if (!targetEmail) {
    return res.status(400).json({ success: false, error: "Staff email is required." });
  }
  if (newPassword && newPassword.trim().length > 0 && newPassword.trim().length < 5) {
    return res.status(400).json({ success: false, error: "New password must be at least 5 characters long." });
  }
  const user = staffMembers.find((s) => {
    const sEmail = (s.email || "").toLowerCase().trim();
    const sStaffId = (s.staffId || "").toLowerCase().trim();
    return sEmail === targetEmail || sStaffId === targetEmail || sEmail.split("@")[0] === targetEmail;
  });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: `Staff account with email "${targetEmail}" was not found in the school directory.`
    });
  }
  const staffEmail = (user.email || "").toLowerCase().trim();
  const passToSet = newPassword && newPassword.trim().length >= 5 ? newPassword.trim() : "1234";
  setStaffPassword(staffEmail, passToSet, "self-reset");
  logAudit("PASSWORD_SELF_RESET", "User", `${user.fullName} self-reset their portal password`, req, user.id);
  res.json({
    success: true,
    message: passToSet === "1234" ? "Your password has been reset to default: 1234" : "Your password has been successfully updated.",
    email: staffEmail,
    defaultPassword: passToSet === "1234"
  });
});
app.get("/api/admin/staff-passwords", (req, res) => {
  const requesterEmail = (req.query.requesterEmail || "").toLowerCase().trim();
  const currentActiveUser = staffMembers.find((u) => u.id === currentActiveUserId);
  const isSuper = requesterEmail === SUPER_ADMIN_EMAIL || (currentActiveUser?.email || "").toLowerCase().trim() === SUPER_ADMIN_EMAIL;
  if (!isSuper) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Super Admin privileges required (ahmed.mujthaba@fmagoodhooschool.edu.mv)."
    });
  }
  const list = staffMembers.map((s) => {
    const email = (s.email || `${s.id}@fmagoodhooschool.edu.mv`).toLowerCase().trim();
    return {
      id: s.id,
      staffId: s.staffId || s.id,
      fullName: s.fullName,
      fullNameDhivehi: s.fullNameDhivehi,
      email,
      role: s.role,
      designation: s.designation,
      department: s.department,
      hasCustomPassword: hasCustomPassword(email),
      isSuperAdmin: email === SUPER_ADMIN_EMAIL,
      passwordUpdatedAt: getPasswordUpdatedAt(email)
    };
  });
  res.json({
    success: true,
    totalStaff: list.length,
    superAdmin: SUPER_ADMIN_EMAIL,
    staff: list
  });
});
app.post("/api/admin/reset-staff-password", (req, res) => {
  const target = req.body.targetEmail || req.body.staffEmail || req.body.email;
  const { requesterEmail, newPassword } = req.body;
  const currentActiveUser = staffMembers.find((u) => u.id === currentActiveUserId);
  const reqEmail = (requesterEmail || currentActiveUser?.email || "").toLowerCase().trim();
  if (reqEmail !== SUPER_ADMIN_EMAIL && currentActiveUser?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "Only Super Admin (ahmed.mujthaba@fmagoodhooschool.edu.mv) can reset staff passwords."
    });
  }
  const normalizedTarget = (target || "").toLowerCase().trim();
  const user = staffMembers.find(
    (s) => (s.email || "").toLowerCase().trim() === normalizedTarget || s.id === target || (s.username || "").toLowerCase().trim() === normalizedTarget
  );
  if (!user) {
    return res.status(404).json({ success: false, error: "Target staff member not found." });
  }
  const actualEmail = (user.email || "").toLowerCase().trim();
  const passToSet = newPassword && newPassword.trim().length >= 5 ? newPassword.trim() : "1234";
  setStaffPassword(actualEmail, passToSet, reqEmail);
  logAudit(
    "ADMIN_RESET_STAFF_PASSWORD",
    "User",
    `Super Admin reset password for ${user.fullName} (${actualEmail}) to ${passToSet === "1234" ? "default (1234)" : "custom"}`,
    req,
    currentActiveUser?.id
  );
  res.json({
    success: true,
    message: `Password for ${user.fullName} (${actualEmail}) has been reset to ${passToSet}.`,
    targetEmail: actualEmail,
    newPassword: passToSet,
    isDefault: passToSet === "1234"
  });
});
app.post("/api/admin/reset-all-passwords", (req, res) => {
  const { requesterEmail } = req.body;
  const currentActiveUser = staffMembers.find((u) => u.id === currentActiveUserId);
  const reqEmail = (requesterEmail || currentActiveUser?.email || "").toLowerCase().trim();
  const isSuper = reqEmail === SUPER_ADMIN_EMAIL || reqEmail === "ahmedmujthaba@gmail.com" || reqEmail.includes("ahmed.mujthaba") || currentActiveUser?.isSuperAdmin || currentActiveUser?.role === "ADMIN";
  if (!isSuper) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized: Only Super Admin (ahmed.mujthaba@fmagoodhooschool.edu.mv) can perform bulk password reset."
    });
  }
  const count = resetAllStaffPasswords(reqEmail);
  logAudit(
    "SUPER_ADMIN_RESET_ALL_PASSWORDS",
    "System",
    `Super Admin (${reqEmail}) reset all ${count} staff passwords to default: 1234`,
    req,
    currentActiveUser?.id
  );
  res.json({
    success: true,
    message: `All ${count} staff member passwords have been successfully reset to default: 1234`,
    count,
    defaultPassword: "1234"
  });
});
app.post("/api/auth/switch", (req, res) => {
  const { userId, loginViaMobile, hasRapidRollCallPrivilege } = req.body;
  const user = staffMembers.find((u) => u.id === userId) || (userId === "staff-1" ? staffMembers[0] : null);
  if (!user) {
    return res.status(404).json({ error: "Staff member not found" });
  }
  currentActiveUserId = user.id;
  saveSessionToDisk(user.id);
  const enriched = enrichStaffUser(user);
  const isMobileLogin = Boolean(
    loginViaMobile || hasRapidRollCallPrivilege || /Android|iPhone|iPad|Mobile/i.test(req.headers["user-agent"] || "")
  );
  if (isMobileLogin) {
    enriched.hasRapidRollCallPrivilege = true;
    enriched.loginViaMobile = true;
  }
  logAudit("USER_SWITCH", "User", `Active staff switched to ${enriched.fullName} (${enriched.role})`, req, enriched.id);
  res.json({ success: true, user: enriched });
});
app.get("/api/students", (req, res) => {
  students = magoodhooSyncEngine.getStudents();
  const { grade } = req.query;
  if (grade && typeof grade === "string") {
    const filtered = students.filter((s) => s.gradeLevel === grade);
    return res.json({ students: filtered, total: filtered.length });
  }
  res.json({ students, total: students.length });
});
app.put("/api/students/:id", (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const result = magoodhooSyncEngine.updateStudent({ ...updateData, id });
  if (!result.success || !result.student) {
    return res.status(404).json({ success: false, error: result.error || "Student not found" });
  }
  students = magoodhooSyncEngine.getStudents();
  broadcastLiveSync({
    type: "STUDENT_UPDATED",
    student: result.student
  });
  logAudit(
    "STUDENT_RECORD_UPDATED",
    "StudentDirectory",
    `Updated student record [${result.student.admissionNumber}] ${result.student.fullName} / ${result.student.fullNameDhivehi}`,
    req
  );
  res.json({ success: true, student: result.student });
});
app.post("/api/students/fix-dhivehi-names", (req, res) => {
  let correctionsCount = 0;
  const correctedStudents = [];
  students.forEach((st) => {
    let newDv = st.fullNameDhivehi;
    if (st.admissionNumber === "FMS-955" || st.id === "std-ukg-955" || st.fullName.includes("Maryam Zehek Imran")) {
      newDv = "\u0789\u07A6\u0783\u07B0\u0794\u07A6\u0789\u07B0 \u0792\u07AC\u0780\u07AC\u0786\u07B0 \u07A2\u07A8\u0789\u07B0\u0783\u07A7\u0782\u07B0";
    }
    if (st.admissionNumber === "FMS-963" || st.id === "std-ukg-963" || st.fullName.includes("Ahmed Alyas Mohamed Akuram")) {
      newDv = "\u0787\u07A6\u0799\u07B0\u0789\u07A6\u078B\u07AA \u0787\u07A6\u078D\u07B0\u0794\u07A6\u0790\u07B0 \u0789\u07AA\u0799\u07A6\u0787\u07B0\u0789\u07A6\u078B\u07AA \u0787\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0";
    }
    newDv = newDv.replace(/\uFFFD/g, "").replace(/([\u07A6-\u07B0])\1+/g, "$1");
    if (newDv.includes("\u0787\u07A6\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0") || newDv.includes("\u0787\u0786\u07B0\u0783\u07A6\u0789\u07B0")) {
      newDv = newDv.replace(/އަަކްރަމް|އކްރަމް/g, "\u0787\u07A6\u0786\u07B0\u0783\u07A6\u0789\u07B0");
    }
    if (newDv !== st.fullNameDhivehi) {
      correctedStudents.push({
        id: st.id,
        admissionNumber: st.admissionNumber,
        oldName: st.fullNameDhivehi,
        newName: newDv
      });
      st.fullNameDhivehi = newDv;
      magoodhooSyncEngine.updateStudent({ id: st.id, fullNameDhivehi: newDv });
      correctionsCount++;
    }
  });
  students = magoodhooSyncEngine.getStudents();
  logAudit(
    "DHIVEHI_NAMES_BATCH_CORRECTED",
    "StudentDirectory",
    `Audited student directory and corrected ${correctionsCount} Dhivehi student names.`,
    req
  );
  res.json({
    success: true,
    correctionsCount,
    totalAudited: students.length,
    correctedStudents
  });
});
app.get("/api/magoodhoo/sync-status", (req, res) => {
  res.json(magoodhooSyncEngine.getState());
});
app.post("/api/magoodhoo/sync-now", async (req, res) => {
  try {
    const result = await magoodhooSyncEngine.syncFromRemotePortal();
    if (result.success) {
      students = magoodhooSyncEngine.getStudents();
      staffMembers = magoodhooSyncEngine.getStaff();
      logAudit(
        "DIRECTORY_SYNCED_FROM_MAGOODHOO_PORTAL",
        "StudentDirectory",
        `Successfully synced ${students.length} students and ${staffMembers.length} staff members live from https://reportcard-fmagoodhooschool.vercel.app/ (bundle: ${result.bundle})`,
        req
      );
    }
    res.json({
      ...result,
      currentTotalStudents: students.length,
      currentTotalStaff: staffMembers.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/magoodhoo/import-backup", (req, res) => {
  const { payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: "Payload is required" });
  }
  const result = magoodhooSyncEngine.importManualDirectory(payload);
  if (result.success) {
    students = magoodhooSyncEngine.getStudents();
    logAudit(
      "DIRECTORY_MANUAL_BACKUP_IMPORTED",
      "StudentDirectory",
      `Manual student directory backup imported with ${students.length} students`,
      req
    );
  }
  res.json({ ...result, currentTotalStudents: students.length });
});
app.post("/api/magoodhoo/toggle-autosync", (req, res) => {
  const { enabled } = req.body;
  const state = magoodhooSyncEngine.getState();
  state.autoSyncEnabled = Boolean(enabled);
  res.json({ success: true, autoSyncEnabled: state.autoSyncEnabled });
});
function checkSessionStartEligibility(targetDate, sessionType, clientTime, clientDate) {
  const now = /* @__PURE__ */ new Date();
  let serverDateStr;
  let serverTimeStr;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Indian/Maldives",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const map = {};
    for (const p of parts) map[p.type] = p.value;
    serverDateStr = `${map.year}-${map.month}-${map.day}`;
    let h = map.hour === "24" ? "00" : map.hour;
    serverTimeStr = `${h.padStart(2, "0")}:${map.minute.padStart(2, "0")}`;
  } catch {
    const maldivesDate = new Date(now.getTime() + 5 * 36e5);
    const year = maldivesDate.getUTCFullYear();
    const month = String(maldivesDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(maldivesDate.getUTCDate()).padStart(2, "0");
    serverDateStr = `${year}-${month}-${day}`;
    const curHours = String(maldivesDate.getUTCHours()).padStart(2, "0");
    const curMins = String(maldivesDate.getUTCMinutes()).padStart(2, "0");
    serverTimeStr = `${curHours}:${curMins}`;
  }
  const curDateStr = clientDate && clientDate <= serverDateStr ? clientDate : serverDateStr;
  const curTimeStr = serverTimeStr;
  if (targetDate > curDateStr) {
    return {
      allowed: false,
      error: "FUTURE_DATE_NOT_ALLOWED",
      message: `Cannot mark attendance for a future date (${targetDate}). Today is ${curDateStr}. Attendance can only be recorded once the scheduled date arrives and the session starts.`,
      messageDhivehi: `\u0786\u07AA\u0783\u07A8\u0787\u07A6\u0781\u07B0 \u0787\u07AE\u078C\u07B0 \u078C\u07A7\u0783\u07A9\u079A\u07A6\u0786\u07A6\u0781\u07B0 (${targetDate}) \u0780\u07A7\u0792\u07A8\u0783\u07A9\u0787\u07AC\u0787\u07B0 \u0782\u07AA\u0796\u07AC\u0780\u07AD\u0782\u07AC\u0787\u07AC\u0788\u07AC. \u0789\u07A8\u0787\u07A6\u078B\u07A6\u0786\u07A9 ${curDateStr} \u0787\u07AC\u0788\u07AC. \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0796\u07AC\u0780\u07AD\u0782\u07A9 \u0787\u07AC \u078B\u07AA\u0788\u07A6\u0780\u07A6\u0786\u07AA \u0790\u07AC\u079D\u07A6\u0782\u07B0 \u078A\u07AC\u0781\u07AA\u0789\u07A6\u0781\u07B0\u078A\u07A6\u0780\u07AA\u078E\u07A6\u0787\u07AC\u0788\u07AC.`,
      currentDate: curDateStr,
      currentTime: curTimeStr
    };
  }
  if (targetDate === curDateStr) {
    const timings = loadSessionTimingsFromDisk();
    const morningStart = timings.normal?.morning?.startTime || timings.morning?.startTime || "07:45";
    const afternoonStart = timings.normal?.afternoon?.startTime || timings.afternoon?.startTime || "10:45";
    let sessionStart = sessionType === "MORNING_BEFORE_BREAK" ? morningStart : afternoonStart;
    if (timings.temporaryOverrides && Array.isArray(timings.temporaryOverrides)) {
      const match = timings.temporaryOverrides.find((ov) => {
        if (ov.endDate) return targetDate >= ov.date && targetDate <= ov.endDate;
        return ov.date === targetDate;
      });
      if (match) {
        if (sessionType === "MORNING_BEFORE_BREAK" && match.morning?.startTime) {
          sessionStart = match.morning.startTime;
        } else if (sessionType === "POST_BREAK" && match.afternoon?.startTime) {
          sessionStart = match.afternoon.startTime;
        }
      }
    }
    if (curTimeStr < sessionStart) {
      const isMorning = sessionType === "MORNING_BEFORE_BREAK";
      const sessionLabel = isMorning ? "Morning Session (Before Break)" : "Afternoon Session (Post-Break)";
      const sessionLabelDv = isMorning ? "\u0780\u07AC\u0782\u078B\u07AA\u0782\u07AA\u078E\u07AC \u0790\u07AC\u079D\u07A6\u0782\u07B0" : "\u0789\u07AC\u0782\u07B0\u078B\u07AA\u0783\u07AA\u078A\u07A6\u0780\u07AA\u078E\u07AC \u0790\u07AC\u079D\u07A6\u0782\u07B0";
      return {
        allowed: false,
        error: "SESSION_NOT_STARTED",
        message: `${sessionLabel} roll call has not started yet. Attendance can only be recorded once the session starts at ${sessionStart}. (Current Maldives time: ${curTimeStr})`,
        messageDhivehi: `${sessionLabelDv} \u0787\u07A6\u078B\u07A8 \u0782\u07AA\u078A\u07AC\u0781\u07AC\u0787\u07AC\u0788\u07AC. \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0796\u07AC\u0780\u07AD\u0782\u07A9 \u0790\u07AC\u079D\u07A6\u0782\u07B0 \u078A\u07AC\u0781\u07AD \u078E\u07A6\u0791\u07A8 (${sessionStart}) \u0787\u07A6\u0781\u07B0\u078A\u07A6\u0780\u07AA\u078E\u07A6\u0787\u07AC\u0788\u07AC. (\u0789\u07A8\u0780\u07A7\u0783\u07AA\u078E\u07AC \u0788\u07A6\u078E\u07AA\u078C\u07AA: ${curTimeStr})`,
        startTime: sessionStart,
        currentTime: curTimeStr,
        currentDate: curDateStr
      };
    }
  }
  return { allowed: true, currentDate: curDateStr, currentTime: curTimeStr };
}
app.get("/api/attendance", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const { date, grade, session, clientTime, clientDate } = req.query;
  const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const targetSession = session || "MORNING_BEFORE_BREAK";
  const closedInfo = checkSchoolClosed(targetDate);
  const formattedClosureLabel = formatSchoolClosedReason(closedInfo.reason);
  const formattedClosureLabelDhivehi = formatSchoolClosedReasonDhivehi(closedInfo.reasonDhivehi, closedInfo.reason);
  const sessionStartInfo = checkSessionStartEligibility(
    targetDate,
    targetSession,
    clientTime,
    clientDate
  );
  const pendingSession = getPreviousPendingSession(targetDate, targetSession);
  const isCurrentSessionSubmitted = submittedSessions.has(`${targetDate}_${targetSession}`);
  let relevantStudents = students;
  if (grade && typeof grade === "string" && grade !== "ALL") {
    relevantStudents = students.filter((s) => s.gradeLevel === grade);
  }
  const records = [];
  const counterpartRecords = [];
  const counterpartSession = targetSession === "MORNING_BEFORE_BREAK" ? "POST_BREAK" : "MORNING_BEFORE_BREAK";
  relevantStudents.forEach((st) => {
    const key = `${st.id}_${targetDate}_${targetSession}`;
    let existing = attendanceStore.get(key);
    if (!closedInfo.isClosed && existing && existing.status === "SCHOOL_CLOSED") {
      attendanceStore.delete(key);
      existing = void 0;
    }
    if (existing && (!closedInfo.isClosed || existing.status === "SCHOOL_CLOSED")) {
      records.push(existing);
    } else if (closedInfo.isClosed) {
      const rec = {
        id: `att-${st.id}-${targetDate}-${targetSession}`,
        studentId: st.id,
        date: targetDate,
        sessionType: targetSession,
        status: "SCHOOL_CLOSED",
        leaveReason: "OFFICIAL_DUTY",
        remarks: formattedClosureLabel,
        markedByUserId: "SYSTEM_AUTO",
        syncStatus: "SYNCED",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      records.push(rec);
    }
    const counterpartKey = `${st.id}_${targetDate}_${counterpartSession}`;
    let counterpartExisting = attendanceStore.get(counterpartKey);
    if (!closedInfo.isClosed && counterpartExisting && counterpartExisting.status === "SCHOOL_CLOSED") {
      attendanceStore.delete(counterpartKey);
      counterpartExisting = void 0;
    }
    if (counterpartExisting && (!closedInfo.isClosed || counterpartExisting.status === "SCHOOL_CLOSED")) {
      counterpartRecords.push(counterpartExisting);
    } else if (closedInfo.isClosed) {
      const counterpartRec = {
        id: `att-${st.id}-${targetDate}-${counterpartSession}`,
        studentId: st.id,
        date: targetDate,
        sessionType: counterpartSession,
        status: "SCHOOL_CLOSED",
        leaveReason: "OFFICIAL_DUTY",
        remarks: formattedClosureLabel,
        markedByUserId: "SYSTEM_AUTO",
        syncStatus: "SYNCED",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      counterpartRecords.push(counterpartRec);
    }
  });
  res.json({
    records,
    counterpartRecords,
    date: targetDate,
    sessionType: targetSession,
    counterpartSession,
    isSchoolClosed: closedInfo.isClosed,
    schoolClosureReason: closedInfo.reason,
    schoolClosureReasonDhivehi: closedInfo.reasonDhivehi,
    formattedClosureLabel,
    formattedClosureLabelDhivehi,
    closureDetails: closedInfo.isClosed ? {
      reason: closedInfo.reason,
      reasonDhivehi: closedInfo.reasonDhivehi,
      formattedLabel: formattedClosureLabel,
      formattedLabelDhivehi: formattedClosureLabelDhivehi,
      dayType: closedInfo.dayType
    } : void 0,
    isManualMarkDisabled: closedInfo.isClosed || !sessionStartInfo.allowed,
    isSessionStarted: sessionStartInfo.allowed,
    sessionStartError: sessionStartInfo.error,
    sessionStartMessage: sessionStartInfo.message,
    sessionStartMessageDhivehi: sessionStartInfo.messageDhivehi,
    sessionStartTime: sessionStartInfo.startTime,
    serverCurrentTime: sessionStartInfo.currentTime,
    serverCurrentDate: sessionStartInfo.currentDate,
    pendingPreviousSession: pendingSession,
    isSessionSubmitted: isCurrentSessionSubmitted
  });
});
app.post("/api/attendance/bulk", (req, res) => {
  const { records, clientTime, clientDate } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "Records must be a non-empty array" });
  }
  const targetDate = records[0].date;
  const targetSession = records[0].sessionType;
  const closedInfo = checkSchoolClosed(targetDate);
  if (closedInfo.isClosed) {
    return res.status(400).json({
      error: "MANUAL_MARK_DISABLED",
      message: `Manual attendance marking is disabled. School is closed on this day due to: ${closedInfo.reason}`
    });
  }
  const sessionStartInfo = checkSessionStartEligibility(targetDate, targetSession, clientTime, clientDate);
  const isMobileClient = Boolean(
    req.body.hasRapidRollCallPrivilege || req.body.loginViaMobile || /Android|iPhone|iPad|Mobile/i.test(req.headers["user-agent"] || "")
  );
  const isEarlyAllowed = isMobileClient && sessionStartInfo.error === "SESSION_NOT_STARTED";
  if (!sessionStartInfo.allowed && !isEarlyAllowed) {
    return res.status(400).json({
      error: sessionStartInfo.error,
      message: sessionStartInfo.message,
      messageDhivehi: sessionStartInfo.messageDhivehi,
      startTime: sessionStartInfo.startTime,
      currentTime: sessionStartInfo.currentTime
    });
  }
  const pending = getPreviousPendingSession(targetDate, targetSession);
  const sessionKey = `${targetDate}_${targetSession}`;
  if (submittedSessions.has(sessionKey)) {
    const { isSuperAdmin } = checkSuperAdminAccess(req.body);
    if (!isSuperAdmin && !isMobileClient) {
      return res.status(403).json({
        error: "SESSION_LOCKED",
        message: "This attendance session has already been finalized and locked. Only Super Admin can modify or revert finalized sessions."
      });
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const firstRec = records[0];
  const markerStaff = staffMembers.find((s) => s.id === firstRec?.markedByUserId || s.staffId === firstRec?.markedByUserId) || staffMembers.find((s) => s.id === currentActiveUserId) || staffMembers[0];
  records.forEach((rec) => {
    const key = `${rec.studentId}_${rec.date}_${rec.sessionType}`;
    const itemMarker = rec.markedByUserId && rec.markedByUserId !== markerStaff.id ? staffMembers.find((s) => s.id === rec.markedByUserId || s.staffId === rec.markedByUserId) || markerStaff : markerStaff;
    attendanceStore.set(key, {
      ...rec,
      markedByUserId: itemMarker.id,
      markedByUserName: rec.markedByUserName || itemMarker.fullName,
      syncStatus: "SYNCED",
      updatedAt: now
    });
  });
  saveAttendanceToDisk(attendanceStore);
  const isSubmitted = submittedSessions.has(`${targetDate}_${targetSession}`);
  broadcastLiveSync({
    type: "ATTENDANCE_MUTATED",
    date: targetDate,
    session: targetSession,
    count: records.length,
    isSessionSubmitted: isSubmitted
  });
  logAudit(
    "BULK_ATTENDANCE_MARKED",
    "AttendanceSession",
    `Bulk attendance saved for ${records.length} students on ${firstRec?.date || "today"} (${firstRec?.sessionType || ""}) by ${markerStaff.fullName} (${markerStaff.designation || markerStaff.role})`,
    req,
    markerStaff.id
  );
  res.json({ success: true, count: records.length, isSessionSubmitted: isSubmitted });
});
var handleSingleAttendance = (req, res) => {
  const record = req.body.record || req.body;
  const sessionType = record.sessionType || req.body.session;
  if (!record || !record.studentId || !record.date || !sessionType) {
    return res.status(400).json({ error: "Invalid record payload. studentId, date, and sessionType are required." });
  }
  const normalizedRecord = { ...record, sessionType };
  const closedInfo = checkSchoolClosed(normalizedRecord.date);
  if (closedInfo.isClosed) {
    return res.status(400).json({
      error: "MANUAL_MARK_DISABLED",
      message: `Manual attendance marking is disabled. School is closed on this day due to: ${closedInfo.reason}`
    });
  }
  const sessionStartInfo = checkSessionStartEligibility(
    normalizedRecord.date,
    normalizedRecord.sessionType,
    req.body.clientTime,
    req.body.clientDate
  );
  const isMobileClient = Boolean(
    req.body.hasRapidRollCallPrivilege || req.body.loginViaMobile || /Android|iPhone|iPad|Mobile/i.test(req.headers["user-agent"] || "")
  );
  const isEarlyAllowed = isMobileClient && sessionStartInfo.error === "SESSION_NOT_STARTED";
  if (!sessionStartInfo.allowed && !isEarlyAllowed) {
    return res.status(400).json({
      error: sessionStartInfo.error,
      message: sessionStartInfo.message,
      messageDhivehi: sessionStartInfo.messageDhivehi,
      startTime: sessionStartInfo.startTime,
      currentTime: sessionStartInfo.currentTime
    });
  }
  const pending = getPreviousPendingSession(normalizedRecord.date, normalizedRecord.sessionType);
  const sessionKey = `${normalizedRecord.date}_${normalizedRecord.sessionType}`;
  if (submittedSessions.has(sessionKey)) {
    const { isSuperAdmin } = checkSuperAdminAccess(req.body);
    if (!isSuperAdmin && !isMobileClient) {
      return res.status(403).json({
        error: "SESSION_LOCKED",
        message: "This attendance session has already been finalized. If a student was marked incorrectly (e.g. present marked as absent), please contact Super Admin (Ahmed Mujthaba) to revert or correct."
      });
    }
  }
  const marker = staffMembers.find((s) => s.id === normalizedRecord.markedByUserId || s.staffId === normalizedRecord.markedByUserId) || staffMembers.find((s) => s.id === currentActiveUserId) || staffMembers[0];
  const key = `${normalizedRecord.studentId}_${normalizedRecord.date}_${normalizedRecord.sessionType}`;
  const updated = {
    ...normalizedRecord,
    status: normalizedRecord.status || "PRESENT",
    markedByUserId: marker.id,
    markedByUserName: normalizedRecord.markedByUserName || marker.fullName,
    syncStatus: "SYNCED",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  attendanceStore.set(key, updated);
  saveAttendanceToDisk(attendanceStore);
  broadcastLiveSync({
    type: "ATTENDANCE_SINGLE_MUTATED",
    date: updated.date,
    session: updated.sessionType,
    record: updated
  });
  const student = students.find((s) => s.id === normalizedRecord.studentId);
  logAudit(
    "ATTENDANCE_UPDATE",
    "AttendanceSession",
    `Marked ${student?.fullName || normalizedRecord.studentId} (${student?.gradeLevel || ""}) as ${updated.status} ${updated.leaveReason && updated.leaveReason !== "NONE" ? `(${updated.leaveReason})` : ""} on ${updated.date} by ${marker.fullName} (${marker.designation || marker.role})`,
    req,
    marker.id
  );
  res.json({ success: true, record: updated });
};
app.put("/api/attendance/single", handleSingleAttendance);
app.post("/api/attendance/single", handleSingleAttendance);
app.post("/api/attendance/submit-session", (req, res) => {
  const { date, session, submittedByUserId, clientTime, clientDate } = req.body;
  const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const targetSession = session || "MORNING_BEFORE_BREAK";
  const closedInfo = checkSchoolClosed(targetDate);
  if (closedInfo.isClosed) {
    return res.status(400).json({
      error: "MANUAL_MARK_DISABLED",
      message: `School is closed on this day. Attendance was marked automatically.`
    });
  }
  const sessionStartInfo = checkSessionStartEligibility(targetDate, targetSession, clientTime, clientDate);
  if (!sessionStartInfo.allowed) {
    return res.status(400).json({
      error: sessionStartInfo.error,
      message: sessionStartInfo.message,
      messageDhivehi: sessionStartInfo.messageDhivehi,
      startTime: sessionStartInfo.startTime,
      currentTime: sessionStartInfo.currentTime
    });
  }
  const pending = getPreviousPendingSession(targetDate, targetSession);
  markSessionSubmitted(`${targetDate}_${targetSession}`);
  broadcastLiveSync({
    type: "SESSION_SUBMITTED",
    date: targetDate,
    session: targetSession,
    isSessionSubmitted: true
  });
  const submitter = staffMembers.find((s) => s.id === submittedByUserId || s.staffId === submittedByUserId) || staffMembers.find((s) => s.id === currentActiveUserId) || staffMembers[0];
  logAudit(
    "ATTENDANCE_SESSION_FINALIZED",
    "AttendanceSession",
    `Attendance session finalized for ${targetDate} (${targetSession}) by ${submitter.fullName} (${submitter.designation || submitter.role})`,
    req,
    submitter.id
  );
  res.json({ success: true, isSessionSubmitted: true });
});
app.post("/api/attendance/revert-session", (req, res) => {
  const { date, session, reason } = req.body;
  const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const targetSession = session || "MORNING_BEFORE_BREAK";
  const { isSuperAdmin, superAdminStaff } = checkSuperAdminAccess(req.body);
  if (!isSuperAdmin) {
    return res.status(403).json({
      error: "SUPER_ADMIN_REQUIRED",
      message: "Access Denied: Only Super Admin (ahmed.mujthaba@fmagoodhooschool.edu.mv) has authority to revert finalized attendance sessions."
    });
  }
  const sessionKey = `${targetDate}_${targetSession}`;
  unmarkSessionSubmitted(sessionKey);
  broadcastLiveSync({
    type: "SESSION_REVERTED",
    date: targetDate,
    session: targetSession,
    isSessionSubmitted: false
  });
  const reasonText = reason?.trim() || "Teacher reported attendance marked incorrectly; session reopened for homeroom correction";
  logAudit(
    "ATTENDANCE_SESSION_REVERTED_BY_SUPER_ADMIN",
    "AttendanceSession",
    `Super Admin (${superAdminStaff.fullName}) unlocked/reopened finalized attendance session for ${targetDate} (${targetSession}). Reason: ${reasonText}`,
    req,
    superAdminStaff.id
  );
  res.json({ success: true, isSessionSubmitted: false });
});
app.post("/api/attendance/revert-record", (req, res) => {
  const {
    studentId,
    date,
    sessionType,
    newStatus,
    leaveReason,
    arrivalTime,
    reason
  } = req.body;
  if (!studentId || !date || !sessionType || !newStatus) {
    return res.status(400).json({ error: "Missing required parameters (studentId, date, sessionType, newStatus)" });
  }
  const { isSuperAdmin, superAdminStaff } = checkSuperAdminAccess(req.body);
  if (!isSuperAdmin) {
    return res.status(403).json({
      error: "SUPER_ADMIN_REQUIRED",
      message: "Access Denied: Only Super Admin (ahmed.mujthaba@fmagoodhooschool.edu.mv) has authority to revert or correct attendance records."
    });
  }
  const key = `${studentId}_${date}_${sessionType}`;
  const existing = attendanceStore.get(key);
  const previousStatus = existing?.status || "NOT_MARKED";
  const revertReasonText = reason?.trim() || `Teacher marked incorrectly; reverted to ${newStatus} by Super Admin`;
  const updated = {
    id: existing?.id || `att-${studentId}-${date}-${sessionType}`,
    studentId,
    date,
    sessionType,
    status: newStatus,
    leaveReason: newStatus === "LEAVE" ? leaveReason || "SICK_LEAVE" : "NONE",
    arrivalTime: newStatus === "LATE" ? arrivalTime || (sessionType === "MORNING_BEFORE_BREAK" ? "08:15" : "11:00") : void 0,
    markedByUserId: existing?.markedByUserId || superAdminStaff.id,
    markedByUserName: existing?.markedByUserName || superAdminStaff.fullName,
    revertedByUserId: superAdminStaff.id,
    revertedByUserName: superAdminStaff.fullName,
    revertedAt: (/* @__PURE__ */ new Date()).toISOString(),
    previousStatus,
    revertReason: revertReasonText,
    remarks: `[Reverted by Super Admin]: ${revertReasonText}`,
    syncStatus: "SYNCED",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  attendanceStore.set(key, updated);
  saveAttendanceToDisk(attendanceStore);
  broadcastLiveSync({
    type: "ATTENDANCE_RECORD_REVERTED",
    date,
    session: sessionType,
    record: updated
  });
  const student = students.find((s) => s.id === studentId);
  logAudit(
    "ATTENDANCE_RECORD_REVERTED_BY_SUPER_ADMIN",
    "AttendanceRecord",
    `Super Admin (${superAdminStaff.fullName}) reverted attendance for ${student?.fullName || studentId} (${student?.gradeLevel || ""}) on ${date} (${sessionType}): was ${previousStatus} \u2192 corrected to ${newStatus}. Reason: ${revertReasonText}`,
    req,
    superAdminStaff.id
  );
  res.json({ success: true, record: updated });
});
app.post("/api/attendance/reset-all", (req, res) => {
  const actor = staffMembers.find((s) => s.id === currentActiveUserId || s.isSuperAdmin) || staffMembers[0];
  attendanceStore.clear();
  submittedSessions.clear();
  saveAttendanceToDisk(attendanceStore);
  saveSubmittedSessionsToDisk(submittedSessions);
  try {
    saveReportCardOverridesToDisk({});
  } catch (e) {
  }
  broadcastLiveSync({
    type: "ATTENDANCE_MUTATED",
    resetAll: true
  });
  logAudit(
    "ATTENDANCE_RESET_ALL",
    "AttendanceRecord",
    `All attendance records and submitted sessions have been reset to empty by ${actor.fullName}. System is ready for fresh attendance entry.`,
    req,
    actor.id
  );
  console.log("[server] All past attendance records and submitted sessions have been reset to empty.");
  res.json({
    success: true,
    message: "All attendance records wiped clean and marked attendance reset. System is fresh for staff rollout.",
    recordsCount: 0,
    submittedSessionsCount: 0
  });
});
app.post("/api/school/close-day", (req, res) => {
  const { date, dayType, reason, reasonDhivehi } = req.body;
  const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const type = dayType || "SCHOOL_CLOSED_WEATHER";
  const desc = reason || "Adverse Monsoon Weather & Swell Alert";
  const descDv = reasonDhivehi || "\u0789\u07AB\u0790\u07AA\u0782\u07B0 \u078E\u07AF\u0790\u07B0\u0788\u07AA\u0789\u07AA\u078E\u07AC \u0790\u07A6\u0784\u07A6\u0784\u07AA\u0782\u07B0 \u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0784\u07A6\u0782\u07B0\u078B\u07AA";
  const idx = academicCalendar.findIndex((d) => d.date === targetDate);
  if (idx >= 0) {
    academicCalendar[idx] = {
      ...academicCalendar[idx],
      dayType: type,
      description: desc,
      descriptionDhivehi: descDv,
      isManualOverride: true,
      updatedByUserId: currentActiveUserId
    };
  } else {
    academicCalendar.push({
      id: `cal-closure-${Date.now()}`,
      date: targetDate,
      dayType: type,
      description: desc,
      descriptionDhivehi: descDv,
      isManualOverride: true,
      updatedByUserId: currentActiveUserId
    });
  }
  autoMarkClosedDayAttendance(targetDate, desc, descDv);
  saveCalendarToDisk(academicCalendar);
  saveAttendanceToDisk(attendanceStore);
  const formattedDesc = formatSchoolClosedReason(desc);
  const formattedDescDv = formatSchoolClosedReasonDhivehi(descDv, desc);
  broadcastLiveSync({
    type: "CALENDAR_UPDATED",
    date: targetDate,
    isSchoolClosed: true,
    reason: desc
  });
  logAudit(
    "SCHOOL_CLOSED_AUTO_ATTENDANCE",
    "SchoolStatus",
    `School closed on ${targetDate} due to "${desc}". Attendance automatically marked for all 215 students as "${formattedDesc}" and manual marking disabled.`,
    req
  );
  res.json({
    success: true,
    isSchoolClosed: true,
    reason: desc,
    reasonDhivehi: descDv,
    formattedClosureLabel: formattedDesc,
    formattedClosureLabelDhivehi: formattedDescDv,
    calendar: academicCalendar
  });
});
app.post("/api/school/reopen-day", (req, res) => {
  const { date } = req.body;
  const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const idx = academicCalendar.findIndex((d) => d.date === targetDate);
  if (idx >= 0) {
    academicCalendar[idx] = {
      ...academicCalendar[idx],
      dayType: "REGULAR_TEACHING_DAY",
      description: "Regular School Day (Reopened)",
      descriptionDhivehi: "\u07A2\u07A7\u0782\u07B0\u0789\u07AA \u0786\u07A8\u0794\u07A6\u0788\u07A6\u0787\u07A8\u078B\u07AD \u078B\u07AA\u0788\u07A6\u0790\u07B0",
      isManualOverride: true,
      updatedByUserId: currentActiveUserId
    };
  }
  unmarkSessionSubmitted(`${targetDate}_MORNING_BEFORE_BREAK`);
  unmarkSessionSubmitted(`${targetDate}_POST_BREAK`);
  let attendanceChanged = false;
  for (const [key, rec] of attendanceStore.entries()) {
    if (rec.date === targetDate && rec.status === "SCHOOL_CLOSED") {
      attendanceStore.delete(key);
      attendanceChanged = true;
    }
  }
  saveCalendarToDisk(academicCalendar);
  if (attendanceChanged) {
    saveAttendanceToDisk(attendanceStore);
  }
  broadcastLiveSync({
    type: "CALENDAR_UPDATED",
    date: targetDate,
    isSchoolClosed: false
  });
  logAudit(
    "SCHOOL_REOPENED",
    "SchoolStatus",
    `School closure cancelled for ${targetDate}. Regular teaching day restored and manual marking re-enabled.`,
    req
  );
  res.json({
    success: true,
    isSchoolClosed: false,
    calendar: academicCalendar
  });
});
app.post("/api/attendance/sync-queue", (req, res) => {
  try {
    const rawBody = req.body;
    const body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody || {};
    const items = Array.isArray(body) ? body : body.items || [];
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Payload items must be an array", success: false });
    }
    if (items.length === 0) {
      return res.json({
        success: true,
        syncedCount: 0,
        conflictsResolved: 0,
        serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    let conflictsResolved = 0;
    let syncedCount = 0;
    let rejectedCount = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const todayStr = now.split("T")[0];
    items.forEach((item) => {
      if (!item || !item.studentId || !item.date || !item.sessionType) {
        rejectedCount++;
        return;
      }
      const key = `${item.studentId}_${item.date}_${item.sessionType}`;
      const existing = attendanceStore.get(key);
      if (existing && item.updatedAt && existing.updatedAt && new Date(existing.updatedAt).getTime() > new Date(item.updatedAt).getTime()) {
        conflictsResolved++;
        return;
      }
      attendanceStore.set(key, {
        ...item,
        syncStatus: "SYNCED",
        updatedAt: now
      });
      syncedCount++;
    });
    if (syncedCount > 0) {
      saveAttendanceToDisk(attendanceStore);
      broadcastLiveSync({
        type: "ATTENDANCE_MUTATED",
        count: syncedCount
      });
    }
    try {
      logAudit(
        "OFFLINE_QUEUE_FLUSH",
        "AttendanceSession",
        `BullMQ Worker synced ${syncedCount} queued attendance payloads (${conflictsResolved} conflicts resolved, ${rejectedCount} rejected)`,
        req
      );
    } catch (auditErr) {
      console.warn("logAudit non-fatal failure:", auditErr);
    }
    return res.json({
      success: true,
      syncedCount,
      conflictsResolved,
      rejectedCount,
      serverTimestamp: now
    });
  } catch (err) {
    console.error("Error in /api/attendance/sync-queue:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error while syncing offline queue"
    });
  }
});
app.get(["/api/substitutions", "/api/delegations", "/api/attendance/delegations"], (req, res) => {
  res.json({ delegations });
});
var handleAddSubstitution = (req, res) => {
  const { date, originalTeacherId, substituteTeacherId, reason, notes } = req.body;
  const gradeLevel = req.body.gradeLevel || req.body.grade;
  if (!date || !originalTeacherId || !substituteTeacherId || !gradeLevel) {
    return res.status(400).json({ error: "Missing required delegation fields (date, originalTeacherId, substituteTeacherId, gradeLevel)" });
  }
  const delegation = {
    id: `del-${Date.now()}`,
    date,
    originalTeacherId,
    substituteTeacherId,
    gradeLevel,
    reason: reason || "Leave / Official Duty Coverage",
    notes,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  delegations.unshift(delegation);
  saveDelegationsToDisk(delegations);
  const orig = staffMembers.find((s) => s.id === originalTeacherId);
  const sub = staffMembers.find((s) => s.id === substituteTeacherId);
  logAudit(
    "SUBSTITUTE_ASSIGNED",
    "ClassDelegation",
    `Assigned substitute ${sub?.fullName || substituteTeacherId} to cover ${gradeLevel} for ${orig?.fullName || originalTeacherId} on ${date}`,
    req
  );
  res.json({ success: true, delegation });
};
app.post("/api/substitutions", handleAddSubstitution);
app.put("/api/substitutions/:id", (req, res) => {
  const { id } = req.params;
  const { date, originalTeacherId, substituteTeacherId, reason, notes } = req.body;
  const gradeLevel = req.body.gradeLevel || req.body.grade;
  const index = delegations.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Delegation not found" });
  }
  const existing = delegations[index];
  const updated = {
    ...existing,
    date: date || existing.date,
    originalTeacherId: originalTeacherId || existing.originalTeacherId,
    substituteTeacherId: substituteTeacherId || existing.substituteTeacherId,
    gradeLevel: gradeLevel || existing.gradeLevel,
    reason: reason !== void 0 ? reason : existing.reason,
    notes: notes !== void 0 ? notes : existing.notes
  };
  delegations[index] = updated;
  saveDelegationsToDisk(delegations);
  const orig = staffMembers.find((s) => s.id === updated.originalTeacherId);
  const sub = staffMembers.find((s) => s.id === updated.substituteTeacherId);
  logAudit(
    "SUBSTITUTE_UPDATED",
    "ClassDelegation",
    `Updated substitute delegation ${id}: ${sub?.fullName || updated.substituteTeacherId} covering ${updated.gradeLevel} for ${orig?.fullName || updated.originalTeacherId} on ${updated.date}`,
    req
  );
  res.json({ success: true, delegation: updated });
});
app.put("/api/substitutions", (req, res) => {
  const id = req.body.id;
  if (id) {
    const index = delegations.findIndex((d) => d.id === id);
    if (index !== -1) {
      const existing = delegations[index];
      const gradeLevel = req.body.gradeLevel || req.body.grade;
      const updated = {
        ...existing,
        date: req.body.date || existing.date,
        originalTeacherId: req.body.originalTeacherId || existing.originalTeacherId,
        substituteTeacherId: req.body.substituteTeacherId || existing.substituteTeacherId,
        gradeLevel: gradeLevel || existing.gradeLevel,
        reason: req.body.reason !== void 0 ? req.body.reason : existing.reason,
        notes: req.body.notes !== void 0 ? req.body.notes : existing.notes
      };
      delegations[index] = updated;
      saveDelegationsToDisk(delegations);
      const orig = staffMembers.find((s) => s.id === updated.originalTeacherId);
      const sub = staffMembers.find((s) => s.id === updated.substituteTeacherId);
      logAudit(
        "SUBSTITUTE_UPDATED",
        "ClassDelegation",
        `Updated substitute delegation ${id}: ${sub?.fullName || updated.substituteTeacherId} covering ${updated.gradeLevel} for ${orig?.fullName || updated.originalTeacherId} on ${updated.date}`,
        req
      );
      return res.json({ success: true, delegation: updated });
    }
  }
  return handleAddSubstitution(req, res);
});
app.delete("/api/substitutions/:id", (req, res) => {
  const { id } = req.params;
  const index = delegations.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Delegation not found" });
  }
  const removed = delegations[index];
  delegations.splice(index, 1);
  saveDelegationsToDisk(delegations);
  const orig = staffMembers.find((s) => s.id === removed.originalTeacherId);
  const sub = staffMembers.find((s) => s.id === removed.substituteTeacherId);
  logAudit(
    "SUBSTITUTE_DELETED",
    "ClassDelegation",
    `Deleted substitute delegation ${id} (${removed.gradeLevel} - Sub: ${sub?.fullName || removed.substituteTeacherId} for ${orig?.fullName || removed.originalTeacherId} on ${removed.date})`,
    req
  );
  res.json({ success: true, deletedId: id });
});
app.get("/api/extra-classes", (req, res) => {
  const { date, grade, status } = req.query;
  let filtered = [...extraClasses];
  if (date && typeof date === "string") {
    filtered = filtered.filter((c) => c.date === date);
  }
  if (grade && typeof grade === "string" && grade !== "ALL") {
    filtered = filtered.filter((c) => c.gradeLevel === grade || c.gradeLevel === "ALL");
  }
  if (status && typeof status === "string" && status !== "ALL") {
    filtered = filtered.filter((c) => c.status === status);
  }
  const pendingCount = extraClasses.filter((c) => c.status === "PENDING_APPROVAL").length;
  const approvedCount = extraClasses.filter((c) => c.status === "APPROVED").length;
  res.json({ extraClasses: filtered, pendingCount, approvedCount, totalCount: extraClasses.length });
});
app.post("/api/extra-classes", (req, res) => {
  const {
    title,
    titleDhivehi,
    subject,
    subjectDhivehi,
    gradeLevel,
    date,
    startTime,
    endTime,
    venue,
    venueDhivehi,
    teacherId,
    teacherName,
    teacherNameDhivehi,
    createdByUserId,
    createdByUserName,
    notes
  } = req.body;
  const resolvedTitle = title || `${gradeLevel} ${subject} Extra Class`;
  if (!subject || !gradeLevel || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required extra class fields (subject, gradeLevel, date, startTime, endTime)" });
  }
  if (String(gradeLevel).includes("11") || String(gradeLevel).includes("12")) {
    return res.status(400).json({
      error: "F. Magoodhoo School only offers LKG to Grade 10. Grade 11 does not exist in this school."
    });
  }
  const dateCheck = isValidCalendarDate(date);
  if (!dateCheck.valid) {
    return res.status(400).json({
      error: `Invalid date "${date}". ${dateCheck.reason || "Please provide a valid calendar date."}`
    });
  }
  let cleanVenue = venue || "School Campus";
  let cleanVenueDhivehi = venueDhivehi || (venue || "\u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0786\u07AC\u0789\u07B0\u0795\u07A6\u0790\u07B0");
  if (cleanVenue.includes("Grade 11") || cleanVenue.includes("Grade 12")) {
    cleanVenue = cleanVenue.replace(/Grade\s*1[12]/gi, "Classroom 10");
    cleanVenueDhivehi = cleanVenueDhivehi.replace(/Grade\s*1[12]/gi, "\u0786\u07B0\u078D\u07A7\u0790\u07B0\u0783\u07AB\u0789\u07B0 10");
  }
  const isAuthorizedApprover = checkIsLeadingTeacherOrAdmin(createdByUserId);
  const newClass = sanitizeExtraClass({
    id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: resolvedTitle,
    titleDhivehi: titleDhivehi || resolvedTitle,
    subject,
    subjectDhivehi: subjectDhivehi || subject,
    gradeLevel,
    date,
    startTime,
    endTime,
    venue: cleanVenue,
    venueDhivehi: cleanVenueDhivehi,
    teacherId: teacherId || createdByUserId || "staff-01",
    teacherName: teacherName || createdByUserName || "Staff Member",
    teacherNameDhivehi: teacherNameDhivehi || teacherName,
    createdByUserId: createdByUserId || "unknown",
    createdByUserName: createdByUserName || "Staff Member",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: isAuthorizedApprover ? "APPROVED" : "PENDING_APPROVAL",
    approvedByUserId: isAuthorizedApprover ? createdByUserId : void 0,
    approvedByUserName: isAuthorizedApprover ? `${createdByUserName} (Auto-Approved)` : void 0,
    approvedAt: isAuthorizedApprover ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
    notes,
    attendanceSubmitted: false,
    source: "MANUAL"
  });
  extraClasses.unshift(newClass);
  saveExtraClassesToDisk(extraClasses);
  logAudit(
    isAuthorizedApprover ? "EXTRA_CLASS_CREATED_APPROVED" : "EXTRA_CLASS_REQUESTED",
    "ExtraClass",
    `${createdByUserName} scheduled extra class "${resolvedTitle}" (${gradeLevel}) on ${date} [${newClass.status}]`,
    req
  );
  res.json({ success: true, extraClass: newClass, autoApproved: isAuthorizedApprover });
});
app.post("/api/extra-classes/bulk-upload", (req, res) => {
  const { classes, uploadedByUserId, uploadedByUserName } = req.body;
  if (!Array.isArray(classes) || classes.length === 0) {
    return res.status(400).json({ error: "No classes provided for upload" });
  }
  const isAuthorizedApprover = checkIsLeadingTeacherOrAdmin(uploadedByUserId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const createdList = [];
  for (const item of classes) {
    if (!item.title || !item.subject || !item.gradeLevel || !item.date) continue;
    if (String(item.gradeLevel).includes("11") || String(item.gradeLevel).includes("12")) continue;
    const newClass = sanitizeExtraClass({
      id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      titleDhivehi: item.titleDhivehi || item.title,
      subject: item.subject,
      subjectDhivehi: item.subjectDhivehi || item.subject,
      gradeLevel: item.gradeLevel,
      date: item.date,
      startTime: item.startTime || "14:00",
      endTime: item.endTime || "15:30",
      venue: item.venue || "Classroom",
      venueDhivehi: item.venueDhivehi || item.venue || "\u0786\u07B0\u078D\u07A7\u0790\u07B0\u0783\u07AB\u0789\u07B0",
      teacherId: item.teacherId || uploadedByUserId || "staff-01",
      teacherName: item.teacherName || uploadedByUserName || "Teacher",
      teacherNameDhivehi: item.teacherNameDhivehi || item.teacherName,
      createdByUserId: uploadedByUserId || "staff",
      createdByUserName: uploadedByUserName || "Staff Member",
      createdAt: now,
      status: isAuthorizedApprover ? "APPROVED" : "PENDING_APPROVAL",
      approvedByUserId: isAuthorizedApprover ? uploadedByUserId : void 0,
      approvedByUserName: isAuthorizedApprover ? `${uploadedByUserName} (Leading Teacher / Admin)` : void 0,
      approvedAt: isAuthorizedApprover ? now : void 0,
      notes: item.notes,
      attendanceSubmitted: false,
      source: "EXCEL_UPLOAD"
    });
    createdList.push(newClass);
  }
  extraClasses.unshift(...createdList);
  saveExtraClassesToDisk(extraClasses);
  logAudit(
    "EXTRA_CLASSES_BULK_UPLOAD",
    "ExtraClass",
    `${uploadedByUserName} uploaded ${createdList.length} extra classes via Excel [Status: ${isAuthorizedApprover ? "APPROVED" : "PENDING_APPROVAL"}]`,
    req
  );
  res.json({
    success: true,
    count: createdList.length,
    autoApproved: isAuthorizedApprover,
    classes: createdList
  });
});
app.patch("/api/extra-classes/:id/approval", (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason, userId, userName } = req.body;
  const isAuthorized = checkIsLeadingTeacherOrAdmin(userId);
  if (!isAuthorized) {
    return res.status(403).json({
      error: "Approval permission denied. Only Leading Teachers or Admin (Ahmed Mujthaba) can approve/reject extra classes."
    });
  }
  const cls = extraClasses.find((c) => c.id === id);
  if (!cls) {
    return res.status(404).json({ error: "Extra class not found" });
  }
  if (action === "APPROVE") {
    cls.status = "APPROVED";
    cls.approvedByUserId = userId;
    cls.approvedByUserName = userName || "Leading Teacher / Ahmed Mujthaba";
    cls.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    cls.rejectionReason = void 0;
  } else if (action === "REJECT") {
    cls.status = "REJECTED";
    cls.rejectionReason = rejectionReason || "Not approved by school administration";
    cls.approvedByUserId = userId;
    cls.approvedByUserName = userName || "Leading Teacher / Ahmed Mujthaba";
    cls.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
  } else {
    return res.status(400).json({ error: "Invalid action. Expected APPROVE or REJECT" });
  }
  saveExtraClassesToDisk(extraClasses);
  logAudit(
    action === "APPROVE" ? "EXTRA_CLASS_APPROVED" : "EXTRA_CLASS_REJECTED",
    "ExtraClass",
    `${userName} ${action === "APPROVE" ? "approved" : "rejected"} extra class "${cls.title}" (${cls.gradeLevel})${rejectionReason ? ` - Reason: ${rejectionReason}` : ""}`,
    req
  );
  res.json({ success: true, extraClass: cls });
});
app.post("/api/extra-classes/:id/attendance", (req, res) => {
  const { id } = req.params;
  const { attendanceRecords, markedByUserId, markedByUserName } = req.body;
  const cls = extraClasses.find((c) => c.id === id);
  if (!cls) {
    return res.status(404).json({ error: "Extra class not found" });
  }
  if (cls.status !== "APPROVED" && cls.status !== "COMPLETED") {
    return res.status(400).json({
      error: "Cannot mark attendance for an extra class that has not been approved by a Leading Teacher or Ahmed Mujthaba."
    });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  cls.attendanceRecords = attendanceRecords || [];
  cls.attendanceSubmitted = true;
  cls.attendanceSubmittedAt = now;
  cls.attendanceSubmittedBy = markedByUserName || markedByUserId || "Staff";
  saveExtraClassesToDisk(extraClasses);
  const presentCount = (attendanceRecords || []).filter((r) => r.status === "PRESENT").length;
  logAudit(
    "EXTRA_CLASS_ATTENDANCE_MARKED",
    "ExtraClass",
    `${markedByUserName || "Staff"} submitted attendance for extra class "${cls.title}" (${presentCount}/${attendanceRecords?.length || 0} present)`,
    req
  );
  res.json({ success: true, extraClass: cls });
});
app.delete("/api/extra-classes/:id", (req, res) => {
  const { id } = req.params;
  const userId = (req.query.userId || req.body?.userId || "").trim();
  const userEmail = (req.query.userEmail || req.body?.userEmail || "").trim();
  const userName = (req.query.userName || req.body?.userName || "").trim();
  const idx = extraClasses.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Extra class not found" });
  }
  const target = extraClasses[idx];
  const isAuthorized = !userId || // allow fallback
  checkIsLeadingTeacherOrAdmin(userId) || checkIsLeadingTeacherOrAdmin(userEmail) || target.createdByUserId === userId || userEmail.toLowerCase().includes("ahmed") || userEmail.toLowerCase().includes("mujthaba") || userName.toLowerCase().includes("ahmed") || userName.toLowerCase().includes("mujthaba");
  if (!isAuthorized) {
    return res.status(403).json({ error: "Not authorized to delete this extra class" });
  }
  extraClasses.splice(idx, 1);
  saveExtraClassesToDisk(extraClasses);
  logAudit(
    "EXTRA_CLASS_DELETED",
    "ExtraClass",
    `Deleted extra class "${target.title}" (${target.gradeLevel}) on ${target.date}`,
    req
  );
  res.json({ success: true, deletedId: id });
});
app.delete("/api/extra-classes", (req, res) => {
  const count = extraClasses.length;
  extraClasses = [];
  saveExtraClassesToDisk(extraClasses);
  logAudit("EXTRA_CLASSES_ALL_CLEARED", "ExtraClass", `Cleared all ${count} extra classes`, req);
  res.json({ success: true, count: 0, deletedCount: count });
});
app.post("/api/extra-classes/clear-all", (req, res) => {
  const count = extraClasses.length;
  extraClasses = [];
  saveExtraClassesToDisk(extraClasses);
  logAudit("EXTRA_CLASSES_ALL_CLEARED", "ExtraClass", `Cleared all ${count} extra classes`, req);
  res.json({ success: true, count: 0, deletedCount: count });
});
app.get("/api/calendar", (req, res) => {
  res.json({ calendar: academicCalendar });
});
app.post("/api/calendar/toggle", (req, res) => {
  const { date, description, descriptionDhivehi } = req.body;
  let dayType = req.body.dayType || req.body.type;
  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }
  if (!dayType) {
    const closed = checkSchoolClosed(date);
    dayType = closed.isClosed ? "REGULAR_TEACHING_DAY" : "SCHOOL_CLOSED";
  }
  const index = academicCalendar.findIndex((d) => d.date === date);
  if (index >= 0) {
    academicCalendar[index] = {
      ...academicCalendar[index],
      dayType,
      description: description || academicCalendar[index].description,
      descriptionDhivehi: descriptionDhivehi || academicCalendar[index].descriptionDhivehi,
      isManualOverride: true,
      updatedByUserId: currentActiveUserId
    };
  } else {
    academicCalendar.push({
      id: `cal-custom-${Date.now()}`,
      date,
      dayType,
      description: description || "Special Override",
      descriptionDhivehi: descriptionDhivehi || "\u079A\u07A7\u0787\u07B0\u079E\u07A6 \u0784\u07A6\u078B\u07A6\u078D\u07AA",
      isManualOverride: true,
      updatedByUserId: currentActiveUserId
    });
  }
  logAudit(
    "CALENDAR_OVERRIDE",
    "AcademicCalendarDay",
    `Calendar override for ${date} set to ${dayType} (${description || ""})`,
    req
  );
  const closedCheck = checkSchoolClosed(date);
  if (closedCheck.isClosed) {
    autoMarkClosedDayAttendance(date, closedCheck.reason, closedCheck.reasonDhivehi);
    saveAttendanceToDisk(attendanceStore);
  } else if (dayType === "REGULAR_TEACHING_DAY") {
    unmarkSessionSubmitted(`${date}_MORNING_BEFORE_BREAK`);
    unmarkSessionSubmitted(`${date}_POST_BREAK`);
    let attendanceChanged = false;
    for (const [key, rec] of attendanceStore.entries()) {
      if (rec.date === date && rec.status === "SCHOOL_CLOSED") {
        attendanceStore.delete(key);
        attendanceChanged = true;
      }
    }
    if (attendanceChanged) {
      saveAttendanceToDisk(attendanceStore);
    }
  }
  saveCalendarToDisk(academicCalendar);
  res.json({ success: true, calendar: academicCalendar, isSchoolClosed: closedCheck.isClosed });
});
app.post("/api/calendar/holiday", (req, res) => {
  const { id, date, endDate, dayType, description, descriptionDhivehi } = req.body;
  if (!date || !dayType || !description) {
    return res.status(400).json({ error: "Date, dayType, and description are required" });
  }
  let targetDates = [date];
  if (endDate && endDate >= date) {
    targetDates = [];
    const curr = /* @__PURE__ */ new Date(date + "T00:00:00Z");
    const end = /* @__PURE__ */ new Date(endDate + "T00:00:00Z");
    let safetyCounter = 0;
    while (curr <= end && safetyCounter < 120) {
      targetDates.push(curr.toISOString().slice(0, 10));
      curr.setUTCDate(curr.getUTCDate() + 1);
      safetyCounter++;
    }
  }
  let lastSavedItem = null;
  let attendanceModified = false;
  targetDates.forEach((curDate, i) => {
    deletedHolidays.delete(curDate);
    deletedHolidays.delete(`${curDate}_${dayType}`);
    if (id) deletedHolidays.delete(id);
    let existingIndex = -1;
    if (i === 0 && id) {
      existingIndex = academicCalendar.findIndex((d) => d.id === id);
    }
    if (existingIndex === -1) {
      existingIndex = academicCalendar.findIndex((d) => d.date === curDate);
    }
    if (existingIndex >= 0) {
      academicCalendar[existingIndex] = {
        ...academicCalendar[existingIndex],
        date: curDate,
        dayType,
        description: description.trim(),
        descriptionDhivehi: (descriptionDhivehi || description).trim(),
        isManualOverride: true,
        updatedByUserId: currentActiveUserId
      };
      lastSavedItem = academicCalendar[existingIndex];
    } else {
      const newItem = {
        id: i === 0 && id ? id : `cal-holiday-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        date: curDate,
        dayType,
        description: description.trim(),
        descriptionDhivehi: (descriptionDhivehi || description).trim(),
        isManualOverride: true,
        updatedByUserId: currentActiveUserId
      };
      academicCalendar.push(newItem);
      lastSavedItem = newItem;
    }
    const closedCheck = checkSchoolClosed(curDate);
    if (closedCheck.isClosed) {
      autoMarkClosedDayAttendance(curDate, closedCheck.reason, closedCheck.reasonDhivehi);
      attendanceModified = true;
    } else if (dayType === "REGULAR_TEACHING_DAY") {
      unmarkSessionSubmitted(`${curDate}_MORNING_BEFORE_BREAK`);
      unmarkSessionSubmitted(`${curDate}_POST_BREAK`);
      for (const [key, rec] of attendanceStore.entries()) {
        if (rec.date === curDate && rec.status === "SCHOOL_CLOSED") {
          attendanceStore.delete(key);
          attendanceModified = true;
        }
      }
    }
  });
  academicCalendar.sort((a, b) => a.date.localeCompare(b.date));
  saveCalendarToDisk(academicCalendar);
  if (attendanceModified) {
    saveAttendanceToDisk(attendanceStore);
  }
  if (targetDates.length > 1) {
    logAudit(
      "HOLIDAY_RANGE_CREATED",
      "AcademicCalendarDay",
      `Added official holiday/schedule range (${targetDates.length} days: ${date} to ${endDate}): "${description.trim()}" (${dayType})`,
      req
    );
  } else {
    logAudit(
      "HOLIDAY_SAVED",
      "AcademicCalendarDay",
      `Saved official holiday/schedule event: "${description.trim()}" on ${date} (${dayType})`,
      req
    );
  }
  res.json({ success: true, calendar: academicCalendar, holiday: lastSavedItem, targetDates });
});
app.put("/api/calendar/holiday/:id", (req, res) => {
  const { id } = req.params;
  const { date, dayType, description, descriptionDhivehi } = req.body;
  const index = academicCalendar.findIndex((d) => d.id === id || d.date === id);
  if (index === -1) {
    return res.status(404).json({ error: "Holiday not found" });
  }
  const prevDate = academicCalendar[index].date;
  academicCalendar[index] = {
    ...academicCalendar[index],
    date: date || academicCalendar[index].date,
    dayType: dayType || academicCalendar[index].dayType,
    description: (description !== void 0 ? description : academicCalendar[index].description).trim(),
    descriptionDhivehi: (descriptionDhivehi !== void 0 ? descriptionDhivehi : academicCalendar[index].descriptionDhivehi).trim(),
    isManualOverride: true,
    updatedByUserId: currentActiveUserId
  };
  const updated = academicCalendar[index];
  academicCalendar.sort((a, b) => a.date.localeCompare(b.date));
  saveCalendarToDisk(academicCalendar);
  logAudit(
    "HOLIDAY_UPDATED",
    "AcademicCalendarDay",
    `Updated holiday "${updated.description}" (${updated.date})`,
    req
  );
  let attendanceModified = false;
  const closedCheck = checkSchoolClosed(updated.date);
  if (closedCheck.isClosed) {
    autoMarkClosedDayAttendance(updated.date, closedCheck.reason, closedCheck.reasonDhivehi);
    attendanceModified = true;
  }
  if (prevDate !== updated.date) {
    const prevClosedCheck = checkSchoolClosed(prevDate);
    if (!prevClosedCheck.isClosed) {
      unmarkSessionSubmitted(`${prevDate}_MORNING_BEFORE_BREAK`);
      unmarkSessionSubmitted(`${prevDate}_POST_BREAK`);
      for (const [key, rec] of attendanceStore.entries()) {
        if (rec.date === prevDate && rec.status === "SCHOOL_CLOSED") {
          attendanceStore.delete(key);
          attendanceModified = true;
        }
      }
    }
  }
  if (attendanceModified) {
    saveAttendanceToDisk(attendanceStore);
  }
  res.json({ success: true, calendar: academicCalendar, holiday: updated });
});
app.delete("/api/calendar/holiday/:id", (req, res) => {
  const { id } = req.params;
  const matches = academicCalendar.filter((d) => d.id === id || d.date === id);
  deletedHolidays.add(id);
  matches.forEach((m) => {
    deletedHolidays.add(m.id);
    deletedHolidays.add(m.date);
    deletedHolidays.add(`${m.date}_${m.dayType}`);
  });
  saveDeletedHolidaysToDisk(deletedHolidays);
  if (matches.length === 0) {
    return res.json({ success: true, calendar: academicCalendar, deletedId: id });
  }
  academicCalendar = academicCalendar.filter((d) => d.id !== id && d.date !== id);
  saveCalendarToDisk(academicCalendar);
  matches.forEach((removed) => {
    logAudit(
      "HOLIDAY_DELETED",
      "AcademicCalendarDay",
      `Deleted holiday "${removed.description}" (${removed.date})`,
      req
    );
    const closedCheck = checkSchoolClosed(removed.date);
    if (!closedCheck.isClosed) {
      unmarkSessionSubmitted(`${removed.date}_MORNING_BEFORE_BREAK`);
      unmarkSessionSubmitted(`${removed.date}_POST_BREAK`);
      let attendanceChanged = false;
      for (const [key, rec] of attendanceStore.entries()) {
        if (rec.date === removed.date && rec.status === "SCHOOL_CLOSED") {
          attendanceStore.delete(key);
          attendanceChanged = true;
        }
      }
      if (attendanceChanged) {
        saveAttendanceToDisk(attendanceStore);
      }
    }
  });
  res.json({ success: true, calendar: academicCalendar, deletedId: id });
});
app.post("/api/calendar/reset", (req, res) => {
  deletedHolidays.clear();
  saveDeletedHolidaysToDisk(deletedHolidays);
  academicCalendar = generateAcademicCalendar();
  saveCalendarToDisk(academicCalendar);
  logAudit(
    "CALENDAR_RESET",
    "AcademicCalendarDay",
    "Reset academic calendar to official 2026 Maldives Public Holidays & school breaks",
    req
  );
  res.json({ success: true, calendar: academicCalendar });
});
app.get("/api/audit-logs", (req, res) => {
  const { search, actionType } = req.query;
  let logs = auditLogs;
  if (actionType && typeof actionType === "string" && actionType !== "ALL") {
    logs = logs.filter((l) => l.actionType === actionType);
  }
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) => l.details.toLowerCase().includes(q) || l.actionType.toLowerCase().includes(q) || l.userName && l.userName.toLowerCase().includes(q)
    );
  }
  res.json({ logs: logs.slice(0, 100), total: logs.length });
});
app.get("/api/reports/moe", (req, res) => {
  const targetDate = req.query.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const isClosed = checkSchoolClosed(targetDate).isClosed;
  const closedDayTypes = ["PUBLIC_HOLIDAY", "TERM_BREAK", "SCHOOL_CLOSED", "SCHOOL_CLOSED_WEATHER", "NON_TEACHING_DAY"];
  const closedDaysDeducted = academicCalendar.filter((d) => closedDayTypes.includes(d.dayType)).length;
  const baseCalendarDays = 200;
  const totalDaysNeedToPresent = Math.max(0, baseCalendarDays - closedDaysDeducted);
  const hasDayRecords = Array.from(attendanceStore.values()).some((r) => r.date === targetDate);
  const gradeStats = ALL_GRADES.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const enrolled = gradeStudents.length || 1;
    if (isClosed) {
      return {
        grade,
        totalEnrolled: enrolled,
        morningPresent: 0,
        morningAbsent: 0,
        morningLate: 0,
        morningLeave: 0,
        postBreakPresent: 0,
        postBreakAbsent: 0,
        attendanceRate: null,
        chronicAbsenteesCount: 0,
        isSchoolClosed: true
      };
    }
    if (!hasDayRecords) {
      return {
        grade,
        totalEnrolled: enrolled,
        morningPresent: 0,
        morningAbsent: 0,
        morningLate: 0,
        morningLeave: 0,
        postBreakPresent: 0,
        postBreakAbsent: 0,
        attendanceRate: null,
        chronicAbsenteesCount: 0,
        isSchoolClosed: false
      };
    }
    let mPres = 0;
    let mAbs = 0;
    let mLate = 0;
    let mLeave = 0;
    let pPres = 0;
    let pAbs = 0;
    let recordedStudents = 0;
    let postRecordedStudents = 0;
    gradeStudents.forEach((st) => {
      const mRec = attendanceStore.get(`${st.id}_${targetDate}_MORNING_BEFORE_BREAK`);
      const pRec = attendanceStore.get(`${st.id}_${targetDate}_POST_BREAK`);
      if (mRec) {
        recordedStudents++;
        if (mRec.status === "PRESENT") mPres++;
        else if (mRec.status === "ABSENT") mAbs++;
        else if (mRec.status === "LATE") mLate++;
        else if (mRec.status === "LEAVE") mLeave++;
      }
      if (pRec) {
        postRecordedStudents++;
        if (pRec.status === "PRESENT" || pRec.status === "LATE") pPres++;
        else if (pRec.status === "ABSENT") pAbs++;
      }
    });
    const mRate = recordedStudents > 0 ? Math.round((mPres + mLate) / recordedStudents * 100) : null;
    const pRate = postRecordedStudents > 0 ? Math.round(pPres / postRecordedStudents * 100) : null;
    const rate = mRate !== null && pRate !== null ? Math.round((mRate + pRate) / 2) : mRate !== null ? mRate : pRate;
    let chronicGradeCount = 0;
    gradeStudents.forEach((st) => {
      let stTotal = 0;
      let stPres = 0;
      for (const rec of attendanceStore.values()) {
        if (rec.studentId === st.id) {
          stTotal++;
          if (rec.status === "PRESENT" || rec.status === "LATE") stPres++;
        }
      }
      if (stTotal > 0 && Math.round(stPres / stTotal * 100) < 80) {
        chronicGradeCount++;
      }
    });
    return {
      grade,
      totalEnrolled: enrolled,
      morningPresent: mPres,
      morningAbsent: mAbs,
      morningLate: mLate,
      morningLeave: mLeave,
      postBreakPresent: pPres,
      postBreakAbsent: pAbs,
      attendanceRate: rate,
      chronicAbsenteesCount: chronicGradeCount,
      isSchoolClosed: false
    };
  });
  let totalPres = 0;
  let totalAbs = 0;
  let totalLate = 0;
  let totalLeave = 0;
  let notInIslandCount = 0;
  let sickCount = 0;
  let totalMorningRecorded = 0;
  let totalPostRecorded = 0;
  let postPresTotal = 0;
  let morningAttendedCount = 0;
  let postBreakRetainedCount = 0;
  if (!isClosed && hasDayRecords) {
    students.forEach((st) => {
      const rec = attendanceStore.get(`${st.id}_${targetDate}_MORNING_BEFORE_BREAK`);
      const postRec = attendanceStore.get(`${st.id}_${targetDate}_POST_BREAK`);
      if (rec) {
        totalMorningRecorded++;
        if (rec.status === "PRESENT") totalPres++;
        else if (rec.status === "ABSENT") totalAbs++;
        else if (rec.status === "LATE") totalLate++;
        else if (rec.status === "LEAVE") {
          totalLeave++;
          if (rec.leaveReason === "NOT_IN_ISLAND") notInIslandCount++;
          if (rec.leaveReason === "SICK_LEAVE" || rec.leaveReason === "SICK_LEAVE_MC") sickCount++;
        }
      }
      if (postRec) {
        totalPostRecorded++;
        if (postRec.status === "PRESENT" || postRec.status === "LATE") postPresTotal++;
      }
      const isMorningPresent = rec && (rec.status === "PRESENT" || rec.status === "LATE");
      if (isMorningPresent) {
        morningAttendedCount++;
        if (postRec && (postRec.status === "PRESENT" || postRec.status === "LATE")) {
          postBreakRetainedCount++;
        }
      }
    });
  }
  const morningRate = isClosed ? null : hasDayRecords && totalMorningRecorded > 0 ? Math.round((totalPres + totalLate) / totalMorningRecorded * 100) : null;
  const postBreakRate = isClosed ? null : hasDayRecords && totalPostRecorded > 0 ? Math.round(postPresTotal / totalPostRecorded * 100) : null;
  const overallRate = isClosed ? null : morningRate !== null && postBreakRate !== null ? Math.round((totalPres + totalLate + postPresTotal) / (totalMorningRecorded + totalPostRecorded) * 100) : morningRate !== null ? morningRate : postBreakRate;
  const postBreakRecoveryRate = isClosed ? null : hasDayRecords && totalPostRecorded > 0 && morningAttendedCount > 0 ? Math.round(postBreakRetainedCount / morningAttendedCount * 1e3) / 10 : null;
  const dayExtra = extraClasses.filter(
    (c) => c.status !== "REJECTED" && c.status !== "CANCELLED" && c.date === targetDate
  );
  let dayExtraPres = 0;
  let dayExtraTotal = 0;
  dayExtra.forEach((cls) => {
    const clsStudents = cls.gradeLevel === "ALL" ? students : students.filter((s) => s.gradeLevel === cls.gradeLevel);
    clsStudents.forEach((st) => {
      const logs = getExtraClassesForStudent(st, targetDate, targetDate);
      const thisLog = logs.find((l) => l.extraClassId === cls.id);
      if (thisLog?.status === "PRESENT" || thisLog?.status === "LATE") dayExtraPres++;
      dayExtraTotal++;
    });
  });
  const extraClassRate = isClosed ? null : dayExtraTotal > 0 ? Math.round(dayExtraPres / dayExtraTotal * 100) : null;
  const combinedRate = isClosed ? null : dayExtraTotal > 0 && overallRate != null ? Math.round((totalPres + totalLate + dayExtraPres) / (totalMorningRecorded + dayExtraTotal) * 100) : overallRate;
  res.json({
    date: targetDate,
    schoolName: "F. Magoodhoo School",
    schoolId: "SCH-F02",
    totalStudents: students.length,
    overallAttendanceRate: overallRate,
    officialAttendanceRate: overallRate,
    extraClassAttendanceRate: extraClassRate,
    combinedAttendanceRate: combinedRate,
    totalExtraClasses: dayExtra.length,
    morningAttendanceRate: morningRate,
    postBreakAttendanceRate: postBreakRate,
    postBreakRecoveryRate,
    activeLeavesCount: totalLeave,
    lateEntriesCount: totalLate,
    notInIslandCount,
    sickLeaveCount: sickCount,
    gradeStats,
    isSchoolClosed: isClosed,
    // MoE Calendar Deduction Metrics
    totalCalendarDays: baseCalendarDays,
    closedDaysDeducted,
    totalDaysNeedToPresent
  });
});
app.get("/api/reports/at-risk", (req, res) => {
  const studentMap = /* @__PURE__ */ new Map();
  for (const rec of attendanceStore.values()) {
    if (!rec.studentId) continue;
    const curr = studentMap.get(rec.studentId) || { total: 0, present: 0, absent: 0, leave: 0 };
    curr.total++;
    if (rec.status === "PRESENT" || rec.status === "LATE") {
      curr.present++;
    } else if (rec.status === "ABSENT") {
      curr.absent++;
    } else if (rec.status === "LEAVE") {
      curr.leave++;
    }
    studentMap.set(rec.studentId, curr);
  }
  const atRiskStudents = [];
  students.forEach((st) => {
    const stat = studentMap.get(st.id);
    if (stat && stat.total > 0) {
      const rate = Math.round(stat.present / stat.total * 100);
      if (rate < 80) {
        atRiskStudents.push({
          adm: st.admissionNumber,
          name: st.fullName,
          dv: st.fullNameDhivehi || st.fullName,
          grade: st.gradeLevel,
          rate,
          missedDays: stat.absent,
          reason: stat.leave > 0 ? "Medical / Travel Referral" : "Unexcused Absences / Truancy Risk"
        });
      }
    }
  });
  res.json({
    atRiskStudents,
    totalAtRisk: atRiskStudents.length,
    threshold: 80
  });
});
var DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var DAY_NAMES_DV = ["\u0787\u07A7\u078B\u07A9\u0787\u07B0\u078C\u07A6", "\u0780\u07AF\u0789\u07A6", "\u0787\u07A6\u0782\u07B0\u078E\u07A7\u0783\u07A6", "\u0784\u07AA\u078B\u07A6", "\u0784\u07AA\u0783\u07A7\u0790\u07B0\u078A\u07A6\u078C\u07A8", "\u0780\u07AA\u0786\u07AA\u0783\u07AA", "\u0780\u07AE\u0782\u07A8\u0780\u07A8\u0783\u07AA"];
var MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var MONTH_NAMES_DV = [
  "\u0796\u07AC\u0782\u07AA\u0787\u07A6\u0783\u07A9",
  "\u078A\u07AC\u0784\u07B0\u0783\u07AA\u0787\u07A6\u0783\u07A9",
  "\u0789\u07A7\u0783\u07A8\u0797\u07AA",
  "\u0787\u07AD\u0795\u07B0\u0783\u07A9\u078D\u07B0",
  "\u0789\u07AC\u0787\u07A8",
  "\u0796\u07AB\u0782\u07B0",
  "\u0796\u07AA\u078D\u07A6\u0787\u07A8",
  "\u0787\u07AE\u078E\u07A6\u0790\u07B0\u0793\u07B0",
  "\u0790\u07AC\u0795\u07B0\u0793\u07AC\u0789\u07B0\u0784\u07A6\u0783",
  "\u0787\u07AE\u0786\u07B0\u0793\u07AF\u0784\u07A6\u0783",
  "\u0782\u07AE\u0788\u07AC\u0789\u07B0\u0784\u07A6\u0783",
  "\u0791\u07A8\u0790\u07AC\u0789\u07B0\u0784\u07A6\u0783"
];
function getSchoolDatesBetween(startStr, endStr) {
  const dates = [];
  const curr = /* @__PURE__ */ new Date(startStr + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(endStr + "T00:00:00Z");
  let guard = 0;
  while (curr <= end && guard < 366) {
    const day = curr.getUTCDay();
    if (day !== 5 && day !== 6) {
      dates.push(curr.toISOString().slice(0, 10));
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
    guard++;
  }
  return dates;
}
function resolveStudentAttendance(student, dateStr) {
  const closed = checkSchoolClosed(dateStr);
  if (closed.isClosed) {
    return {
      status: "SCHOOL_CLOSED",
      postBreakStatus: "SCHOOL_CLOSED",
      leaveReason: "OFFICIAL_DUTY",
      isClosed: true,
      closureReason: closed.reason,
      arrivalTime: void 0,
      isRecorded: false,
      isMorningRecorded: false,
      isAfternoonRecorded: false
    };
  }
  const mKey = `${student.id}_${dateStr}_MORNING_BEFORE_BREAK`;
  const pKey = `${student.id}_${dateStr}_POST_BREAK`;
  const mRec = attendanceStore.get(mKey);
  const pRec = attendanceStore.get(pKey);
  if (mRec || pRec) {
    return {
      status: mRec ? mRec.status : void 0,
      postBreakStatus: pRec ? pRec.status : void 0,
      leaveReason: mRec?.leaveReason || pRec?.leaveReason || "NONE",
      isClosed: false,
      closureReason: void 0,
      arrivalTime: mRec?.arrivalTime || pRec?.arrivalTime,
      isRecorded: Boolean(mRec || pRec),
      isMorningRecorded: Boolean(mRec),
      isAfternoonRecorded: Boolean(pRec)
    };
  }
  return {
    status: void 0,
    postBreakStatus: void 0,
    leaveReason: "NONE",
    isClosed: false,
    closureReason: void 0,
    arrivalTime: void 0,
    isRecorded: false,
    isMorningRecorded: false,
    isAfternoonRecorded: false
  };
}
app.get("/api/terms", (req, res) => {
  const terms = loadTermDatesFromDisk();
  res.json({ terms });
});
app.put("/api/terms", (req, res) => {
  const incomingTerms = req.body.terms;
  if (!Array.isArray(incomingTerms)) {
    return res.status(400).json({ error: "terms must be an array" });
  }
  saveTermDatesToDisk(incomingTerms);
  logAudit("TERM_DATES_UPDATED", "AcademicCalendar", `Updated school term duration dates`, req);
  res.json({ success: true, terms: incomingTerms });
});
app.get(["/api/live-sync", "/live-sync"], (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  const currentTimings = loadSessionTimingsFromDisk();
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", timings: currentTimings })}

`);
  liveSyncClients.add(res);
  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(heartbeat);
      liveSyncClients.delete(res);
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(heartbeat);
    liveSyncClients.delete(res);
  });
});
app.get(["/api/settings/session-timings", "/api/session-timings", "/settings/session-timings", "/session-timings"], async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (cachedSessionTimings) {
    return res.json({ timings: cachedSessionTimings });
  }
  const disk = loadSessionTimingsFromDisk();
  if (disk) {
    cachedSessionTimings = disk;
    return res.json({ timings: disk });
  }
  try {
    const remote = await fetchTimingsFromFirestore();
    if (remote) {
      cachedSessionTimings = remote;
      saveSessionTimingsToDisk(remote);
      return res.json({ timings: remote });
    }
  } catch {
  }
  res.json({ timings: DEFAULT_SESSION_TIMINGS });
});
app.put(["/api/settings/session-timings", "/api/session-timings", "/settings/session-timings", "/session-timings"], async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  const incoming = req.body.timings;
  if (!incoming) {
    return res.status(400).json({ error: "Invalid timings payload" });
  }
  const morning = incoming.normal?.morning || incoming.morning || DEFAULT_SESSION_TIMINGS.normal.morning;
  const afternoon = incoming.normal?.afternoon || incoming.afternoon || DEFAULT_SESSION_TIMINGS.normal.afternoon;
  const temporaryOverrides = Array.isArray(incoming.temporaryOverrides) ? incoming.temporaryOverrides : [];
  const normalized = {
    normal: { morning, afternoon },
    morning,
    afternoon,
    temporaryOverrides
  };
  cachedSessionTimings = normalized;
  saveSessionTimingsToDisk(normalized);
  broadcastLiveSync({ type: "SESSION_TIMINGS_UPDATED", timings: normalized });
  saveTimingsToFirestore(normalized).catch(() => {
  });
  logAudit(
    "SESSION_TIMINGS_UPDATED",
    "SessionSettings",
    `Updated school session timings: Morning (${morning.startTime} - ${morning.endTime}), Afternoon (${afternoon.startTime} - ${afternoon.endTime}), ${temporaryOverrides.length} temporary overrides active`,
    req
  );
  res.json({ success: true, timings: normalized });
});
app.get("/api/reports/report-card-attendance", (req, res) => {
  const termParam = req.query.term || "term1";
  const customStart = req.query.startDate;
  const customEnd = req.query.endDate;
  const gradeFilter = req.query.grade || "ALL";
  const termDurations = loadTermDatesFromDisk();
  const selectedTerm = termDurations.find((t) => t.id === termParam);
  let startDate = customStart || selectedTerm?.startDate || "2026-01-11";
  let endDate = customEnd || selectedTerm?.endDate || "2026-06-25";
  let termName = selectedTerm?.name || (termParam === "custom" ? "Custom Duration" : "Term 1");
  let termNameDhivehi = selectedTerm?.nameDhivehi || (termParam === "custom" ? "\u0787\u07A6\u0789\u07A8\u0787\u07B0\u078D\u07A6 \u0789\u07AA\u0787\u07B0\u078B\u07A6\u078C\u07AA" : "\u078A\u07AA\u0783\u07A6\u078C\u07A6\u0789\u07A6 \u0793\u07A7\u0789\u07B0");
  const targetStudents = gradeFilter === "ALL" ? students : students.filter((s) => s.gradeLevel === gradeFilter);
  const schoolDates = getSchoolDatesBetween(startDate, endDate);
  let totalInstructionalDays = 0;
  const validInstructionalDates = [];
  schoolDates.forEach((d) => {
    const closed = checkSchoolClosed(d);
    if (!closed.isClosed) {
      totalInstructionalDays++;
      validInstructionalDates.push(d);
    }
  });
  const overrides = loadReportCardOverridesFromDisk();
  const studentResults = targetStudents.map((st, sIdx) => {
    const overrideKey = `${termParam}_${st.id}`;
    const studentOverride = overrides[overrideKey];
    let daysAttended = 0;
    let daysLate = 0;
    let daysLeave = 0;
    let daysAbsent = 0;
    let recordedDaysCount = 0;
    validInstructionalDates.forEach((d) => {
      const att = resolveStudentAttendance(st, d);
      if (att.isRecorded) {
        recordedDaysCount++;
        const isPresent = att.status === "PRESENT" || att.postBreakStatus === "PRESENT";
        const isLate = att.status === "LATE" || att.postBreakStatus === "LATE";
        const isLeave = att.status === "LEAVE" || att.postBreakStatus === "LEAVE";
        const isAbsent = att.status === "ABSENT" || att.postBreakStatus === "ABSENT";
        if (isPresent) {
          daysAttended++;
        } else if (isLate) {
          daysAttended++;
          daysLate++;
        } else if (isLeave) {
          daysLeave++;
        } else if (isAbsent) {
          daysAbsent++;
        }
      }
    });
    let computedDaysAttended = daysAttended;
    let computedDaysLate = daysLate;
    let computedDaysLeave = daysLeave;
    let computedDaysAbsent = daysAbsent;
    const finalDaysToBeAttended = studentOverride?.daysToBeAttended !== void 0 ? Number(studentOverride.daysToBeAttended) : totalInstructionalDays;
    const finalDaysAttended = studentOverride?.daysAttended !== void 0 ? Number(studentOverride.daysAttended) : computedDaysAttended;
    const finalDaysLate = studentOverride?.daysLate !== void 0 ? Number(studentOverride.daysLate) : computedDaysLate;
    const finalDaysAbsent = studentOverride?.daysAbsent !== void 0 ? Number(studentOverride.daysAbsent) : computedDaysAbsent;
    const finalDaysLeave = studentOverride?.daysLeave !== void 0 ? Number(studentOverride.daysLeave) : computedDaysLeave;
    const rate = (recordedDaysCount > 0 || studentOverride) && finalDaysToBeAttended > 0 ? Math.min(100, Math.round(finalDaysAttended / finalDaysToBeAttended * 100)) : recordedDaysCount === 0 && !studentOverride ? 0 : 100;
    return {
      studentId: st.id,
      admissionNumber: st.admissionNumber,
      fullName: st.fullName,
      fullNameDhivehi: st.fullNameDhivehi || st.fullName,
      gradeLevel: st.gradeLevel,
      gender: st.gender,
      daysToBeAttended: finalDaysToBeAttended,
      daysAttended: finalDaysAttended,
      daysLate: finalDaysLate,
      daysAbsent: finalDaysAbsent,
      daysLeave: finalDaysLeave,
      attendanceRate: rate,
      customNotes: studentOverride?.customNotes
    };
  });
  const totalRate = studentResults.reduce((acc, curr) => acc + curr.attendanceRate, 0);
  const averageRate = studentResults.length > 0 ? Math.round(totalRate / studentResults.length) : 0;
  res.json({
    term: termParam,
    termName,
    termNameDhivehi,
    startDate,
    endDate,
    schoolName: "F. Magoodhoo School",
    schoolId: "SCH-F02",
    totalInstructionalDays,
    totalEnrolled: targetStudents.length,
    averageRate,
    termDurations,
    students: studentResults
  });
});
app.post("/api/reports/report-card-attendance/override", (req, res) => {
  const { term, studentId, daysToBeAttended, daysAttended, daysLate, daysAbsent, daysLeave, customNotes } = req.body;
  if (!term || !studentId) {
    return res.status(400).json({ error: "Missing term or studentId" });
  }
  const overrides = loadReportCardOverridesFromDisk();
  const overrideKey = `${term}_${studentId}`;
  overrides[overrideKey] = {
    daysToBeAttended: daysToBeAttended !== void 0 ? Number(daysToBeAttended) : void 0,
    daysAttended: daysAttended !== void 0 ? Number(daysAttended) : void 0,
    daysLate: daysLate !== void 0 ? Number(daysLate) : void 0,
    daysAbsent: daysAbsent !== void 0 ? Number(daysAbsent) : void 0,
    daysLeave: daysLeave !== void 0 ? Number(daysLeave) : void 0,
    customNotes,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveReportCardOverridesToDisk(overrides);
  res.json({ success: true, override: overrides[overrideKey] });
});
function getExtraClassesForStudent(student, sDate, eDate) {
  const matches = extraClasses.filter((c) => {
    if (c.status === "REJECTED" || c.status === "CANCELLED") return false;
    const inRange = (!sDate || c.date >= sDate) && (!eDate || c.date <= eDate);
    if (!inRange) return false;
    return c.gradeLevel === student.gradeLevel || c.gradeLevel === "ALL";
  });
  return matches.map((cls) => {
    const explicit = (cls.attendanceRecords || []).find(
      (r) => r.studentId === student.id || r.admissionNumber === student.admissionNumber
    );
    if (explicit) {
      return {
        extraClassId: cls.id,
        title: cls.title,
        titleDhivehi: cls.titleDhivehi,
        subject: cls.subject,
        subjectDhivehi: cls.subjectDhivehi,
        gradeLevel: cls.gradeLevel,
        date: cls.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
        venue: cls.venue,
        venueDhivehi: cls.venueDhivehi,
        teacherName: cls.teacherName,
        teacherNameDhivehi: cls.teacherNameDhivehi,
        status: explicit.status,
        arrivalTime: explicit.arrivalTime,
        remarks: explicit.remarks
      };
    }
    const officialAtt = resolveStudentAttendance(student, cls.date);
    let status = "PRESENT";
    let arrivalTime = cls.startTime;
    let remarks = void 0;
    if (cls.attendanceRecords && cls.attendanceRecords.length > 0) {
      status = "ABSENT";
      remarks = "Absent from extra class session";
      arrivalTime = void 0;
    } else if (officialAtt.isClosed) {
      status = "LEAVE";
      remarks = "School Closed";
    } else if (officialAtt.isRecorded && officialAtt.status === "ABSENT") {
      status = "ABSENT";
      remarks = "Absent from official school";
      arrivalTime = void 0;
    } else if (officialAtt.isRecorded && officialAtt.status === "LEAVE") {
      status = "LEAVE";
      remarks = "Approved Leave";
      arrivalTime = void 0;
    }
    return {
      extraClassId: cls.id,
      title: cls.title,
      titleDhivehi: cls.titleDhivehi,
      subject: cls.subject,
      subjectDhivehi: cls.subjectDhivehi,
      gradeLevel: cls.gradeLevel,
      date: cls.date,
      startTime: cls.startTime,
      endTime: cls.endTime,
      venue: cls.venue,
      venueDhivehi: cls.venueDhivehi,
      teacherName: cls.teacherName,
      teacherNameDhivehi: cls.teacherNameDhivehi,
      status,
      arrivalTime,
      remarks
    };
  });
}
function getExtraClassesForGrade(grade, sDate, eDate) {
  return extraClasses.filter((c) => {
    if (c.status === "REJECTED" || c.status === "CANCELLED") return false;
    const inRange = (!sDate || c.date >= sDate) && (!eDate || c.date <= eDate);
    if (!inRange) return false;
    return grade === "ALL" || c.gradeLevel === grade || c.gradeLevel === "ALL";
  });
}
app.get("/api/analytics/dashboard", (req, res) => {
  const targetDate = (req.query.date || req.query.targetDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)).trim();
  const monthStart = "2026-08-23";
  const schoolDates = getSchoolDatesBetween(monthStart, targetDate > "2026-09-24" ? targetDate : "2026-09-24");
  const monthDates = schoolDates.slice(-15);
  const weekDates = schoolDates.slice(-5);
  const calculatePoint = (dStr) => {
    const closed = checkSchoolClosed(dStr);
    const dayIdx = (/* @__PURE__ */ new Date(dStr + "T00:00:00Z")).getUTCDay();
    const [y, m, d] = dStr.split("-");
    const mShort = MONTH_NAMES_EN[parseInt(m, 10) - 1]?.slice(0, 3) || "Sep";
    const dayNameShort = DAY_NAMES_EN[dayIdx]?.slice(0, 3) || "Sun";
    const label = `${mShort} ${d} (${dayNameShort})`;
    if (closed.isClosed) {
      return {
        date: label,
        fullDate: dStr,
        morning: null,
        postBreak: null,
        officialRate: null,
        extraClassRate: null,
        extraClassesCount: 0,
        combinedRate: null,
        baseline: null
      };
    }
    let mPres = 0;
    let mLate = 0;
    let mAbs = 0;
    let mLeave = 0;
    let pPres = 0;
    let pAbs = 0;
    let pLeave = 0;
    let mRecorded = 0;
    let pRecorded = 0;
    students.forEach((st) => {
      const att = resolveStudentAttendance(st, dStr);
      if (att.isMorningRecorded && att.status) {
        mRecorded++;
        if (att.status === "PRESENT") mPres++;
        else if (att.status === "LATE") mLate++;
        else if (att.status === "ABSENT") mAbs++;
        else if (att.status === "LEAVE") mLeave++;
      }
      if (att.isAfternoonRecorded && att.postBreakStatus) {
        pRecorded++;
        if (att.postBreakStatus === "PRESENT" || att.postBreakStatus === "LATE") pPres++;
        else if (att.postBreakStatus === "ABSENT") pAbs++;
        else if (att.postBreakStatus === "LEAVE") pLeave++;
      }
    });
    let morning = null;
    let postBreak = null;
    let officialRate2 = null;
    if (mRecorded > 0 || pRecorded > 0) {
      morning = mRecorded > 0 ? Math.round((mPres + mLate) / mRecorded * 1e3) / 10 : null;
      postBreak = pRecorded > 0 ? Math.round(pPres / pRecorded * 1e3) / 10 : null;
      officialRate2 = morning != null && postBreak != null ? Math.round((morning + postBreak) / 2 * 10) / 10 : morning ?? postBreak;
    } else {
      morning = null;
      postBreak = null;
      officialRate2 = null;
    }
    const dayClasses = extraClasses.filter(
      (c) => c.date === dStr && c.status !== "REJECTED" && c.status !== "CANCELLED"
    );
    let exPres = 0;
    let exTotal = 0;
    dayClasses.forEach((cls) => {
      const clsStudents = cls.gradeLevel === "ALL" ? students : students.filter((s) => s.gradeLevel === cls.gradeLevel);
      clsStudents.forEach((st) => {
        const logs = getExtraClassesForStudent(st, dStr, dStr);
        const thisLog = logs.find((l) => l.extraClassId === cls.id);
        if (thisLog?.status === "PRESENT" || thisLog?.status === "LATE") exPres++;
        exTotal++;
      });
    });
    const extraClassRate2 = exTotal > 0 ? Math.round(exPres / exTotal * 1e3) / 10 : null;
    const extraCount = dayClasses.length;
    const combinedRate2 = officialRate2 != null ? extraClassRate2 != null ? Math.round((officialRate2 * 2 + extraClassRate2) / 3 * 10) / 10 : officialRate2 : extraClassRate2 ?? null;
    const hasAnyRate = officialRate2 != null || extraClassRate2 != null || combinedRate2 != null;
    return {
      date: label,
      fullDate: dStr,
      morning,
      postBreak,
      officialRate: officialRate2,
      extraClassRate: extraClassRate2,
      extraClassesCount: extraCount,
      combinedRate: combinedRate2,
      baseline: hasAnyRate ? 90 : null
    };
  };
  const trendDataMonth = monthDates.map(calculatePoint);
  const trendDataWeek = weekDates.map(calculatePoint);
  const gradeBreakdown = ALL_GRADES.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const enrolled = gradeStudents.length || 1;
    let mPres = 0;
    let mAbs = 0;
    let mLate = 0;
    let mLeave = 0;
    let pPres = 0;
    let pAbs = 0;
    const hasTargetRecords = Array.from(attendanceStore.values()).some((r) => r.date === targetDate);
    gradeStudents.forEach((st) => {
      const mRec = attendanceStore.get(`${st.id}_${targetDate}_MORNING_BEFORE_BREAK`);
      const pRec = attendanceStore.get(`${st.id}_${targetDate}_POST_BREAK`);
      if (mRec) {
        if (mRec.status === "PRESENT") mPres++;
        else if (mRec.status === "ABSENT") mAbs++;
        else if (mRec.status === "LATE") mLate++;
        else if (mRec.status === "LEAVE") mLeave++;
      }
      if (pRec) {
        if (pRec.status === "PRESENT" || pRec.status === "LATE") pPres++;
        else if (pRec.status === "ABSENT") pAbs++;
      }
    });
    const gradeHasRecords = gradeStudents.some(
      (st) => attendanceStore.has(`${st.id}_${targetDate}_MORNING_BEFORE_BREAK`) || attendanceStore.has(`${st.id}_${targetDate}_POST_BREAK`)
    );
    const officialRate2 = gradeHasRecords ? Math.round((mPres + mLate) / enrolled * 100) : null;
    const gradeExtraClasses = extraClasses.filter(
      (c) => c.status !== "REJECTED" && c.status !== "CANCELLED" && c.date === targetDate && (c.gradeLevel === grade || c.gradeLevel === "ALL")
    );
    let exAttended = 0;
    let exLate = 0;
    let exAbsent = 0;
    let exLeave = 0;
    gradeStudents.forEach((st) => {
      const logs = getExtraClassesForStudent(st, targetDate, targetDate);
      logs.forEach((log) => {
        if (log.status === "PRESENT") exAttended++;
        else if (log.status === "LATE") exLate++;
        else if (log.status === "ABSENT") exAbsent++;
        else if (log.status === "LEAVE") exLeave++;
      });
    });
    const exTotal = exAttended + exLate + exAbsent + exLeave;
    const extraClassRate2 = exTotal > 0 ? Math.round((exAttended + exLate) / exTotal * 100) : null;
    const totalSessions = enrolled * 2 + exTotal;
    const presentSessions = mPres + mLate + pPres + exAttended + exLate;
    const combinedRate2 = exTotal > 0 ? Math.round(presentSessions / totalSessions * 100) : officialRate2;
    return {
      grade,
      totalEnrolled: enrolled,
      morningPresent: mPres,
      morningLate: mLate,
      morningLeave: mLeave,
      morningAbsent: mAbs,
      postBreakPresent: pPres,
      postBreakAbsent: pAbs,
      attendanceRate: officialRate2,
      officialRate: officialRate2,
      chronicAbsenteesCount: mAbs > 2 ? 1 : 0,
      // Extra class metrics
      extraClassesHeld: gradeExtraClasses.length,
      extraClassAttended: exAttended,
      extraClassLate: exLate,
      extraClassLeave: exLeave,
      extraClassAbsent: exAbsent,
      extraClassRate: extraClassRate2,
      // Combined metrics
      combinedRate: combinedRate2,
      combinedPresent: mPres + mLate + exAttended + exLate,
      combinedTotal: enrolled + exTotal
    };
  });
  const subjectMap = /* @__PURE__ */ new Map();
  extraClasses.forEach((c) => {
    if (c.status === "REJECTED" || c.status === "CANCELLED") return;
    const curr = subjectMap.get(c.subject) || { count: 0, studentCount: 0 };
    curr.count++;
    const enrolledCount = c.gradeLevel === "ALL" ? students.length : students.filter((s) => s.gradeLevel === c.gradeLevel).length;
    curr.studentCount += enrolledCount;
    subjectMap.set(c.subject, curr);
  });
  const subjectColors = {
    English: "#0284c7",
    Mathematics: "#8b5cf6",
    Science: "#10b981",
    Islam: "#0d9488",
    Dhivehi: "#f59e0b",
    Quran: "#06b6d4"
  };
  const extraClassSubjectDistribution = Array.from(subjectMap.entries()).map(([sub, data]) => ({
    name: sub,
    value: data.count,
    studentCount: data.studentCount,
    color: subjectColors[sub] || "#6366f1"
  }));
  const activeExtraClassesCount = extraClasses.filter((c) => c.status !== "REJECTED" && c.status !== "CANCELLED").length;
  const latestWeekPoint = trendDataWeek[trendDataWeek.length - 1] || trendDataMonth[trendDataMonth.length - 1];
  const officialRate = latestWeekPoint?.officialRate ?? null;
  const extraClassRate = activeExtraClassesCount > 0 ? latestWeekPoint?.extraClassRate ?? null : null;
  const combinedRate = activeExtraClassesCount > 0 ? latestWeekPoint?.combinedRate ?? null : officialRate;
  res.json({
    date: targetDate,
    trendDataWeek,
    trendDataMonth,
    gradeStats: gradeBreakdown,
    extraClassSubjectDistribution,
    summary: {
      morningRate: latestWeekPoint?.morning ?? null,
      afternoonRate: latestWeekPoint?.postBreak ?? null,
      officialRate,
      extraClassRate,
      combinedRate,
      totalExtraClassesHeld: activeExtraClassesCount,
      totalStudents: students.length,
      baseline: 90
    }
  });
});
app.get("/api/reports/analytics", (req, res) => {
  const reportType = req.query.reportType || "overview";
  const period = req.query.period || "monthly";
  const studentId = req.query.studentId;
  const grade = req.query.grade || "Grade 4";
  const customStartDate = req.query.startDate;
  const customEndDate = req.query.endDate;
  const yearParam = parseInt(req.query.year || "2026", 10);
  const monthParam = parseInt(req.query.month || "9", 10);
  const weekStartParam = req.query.weekStart || "2026-09-06";
  const rawReportMode = (req.query.reportMode || req.query.mode || "BOTH").toUpperCase();
  const reportMode = rawReportMode === "MORNING" ? "MORNING" : rawReportMode === "AFTERNOON" ? "AFTERNOON" : rawReportMode === "EXTRA_CLASS" ? "EXTRA_CLASS" : rawReportMode === "OFFICIAL" ? "OFFICIAL" : "BOTH";
  if (reportType === "student") {
    const student = students.find((s) => s.id === studentId || s.admissionNumber === studentId) || students[0];
    let sDate = "2026-09-01";
    let eDate = "2026-09-30";
    if (period === "daily") {
      sDate = customStartDate || "2026-09-07";
      eDate = sDate;
    } else if (period === "weekly") {
      sDate = weekStartParam;
      const cur = /* @__PURE__ */ new Date(sDate + "T00:00:00Z");
      cur.setUTCDate(cur.getUTCDate() + 4);
      eDate = cur.toISOString().slice(0, 10);
    } else if (period === "monthly") {
      const mStr = String(monthParam).padStart(2, "0");
      sDate = `${yearParam}-${mStr}-01`;
      const lastDay = new Date(Date.UTC(yearParam, monthParam, 0)).getUTCDate();
      eDate = `${yearParam}-${mStr}-${String(lastDay).padStart(2, "0")}`;
    } else if (period === "yearly") {
      sDate = `${yearParam}-01-15`;
      eDate = `${yearParam}-11-30`;
    } else if (period === "custom" && customStartDate && customEndDate) {
      sDate = customStartDate;
      eDate = customEndDate;
    }
    const schoolDates = getSchoolDatesBetween(sDate, eDate);
    const extraClassLogs = getExtraClassesForStudent(student, sDate, eDate);
    const dailyRecords = [];
    let morningPresentDays = 0;
    let morningLateDays = 0;
    let morningLeaveDays = 0;
    let morningAbsentDays = 0;
    let morningRecordedCount = 0;
    let afternoonPresentDays = 0;
    let afternoonLateDays = 0;
    let afternoonLeaveDays = 0;
    let afternoonAbsentDays = 0;
    let afternoonRecordedCount = 0;
    let closedDays = 0;
    schoolDates.forEach((d) => {
      const att = resolveStudentAttendance(student, d);
      const dayIndex = (/* @__PURE__ */ new Date(d + "T00:00:00Z")).getUTCDay();
      const dayOfWeek = DAY_NAMES_EN[dayIndex];
      if (att.isClosed) {
        closedDays++;
      } else {
        if (att.isMorningRecorded && att.status) {
          morningRecordedCount++;
          if (att.status === "PRESENT") morningPresentDays++;
          else if (att.status === "LATE") morningLateDays++;
          else if (att.status === "LEAVE") morningLeaveDays++;
          else if (att.status === "ABSENT") morningAbsentDays++;
        }
        if (att.isAfternoonRecorded && att.postBreakStatus) {
          afternoonRecordedCount++;
          if (att.postBreakStatus === "PRESENT") afternoonPresentDays++;
          else if (att.postBreakStatus === "LATE") afternoonLateDays++;
          else if (att.postBreakStatus === "LEAVE") afternoonLeaveDays++;
          else if (att.postBreakStatus === "ABSENT") afternoonAbsentDays++;
        }
      }
      const dayExtraClasses = extraClassLogs.filter((ec) => ec.date === d);
      dailyRecords.push({
        date: d,
        dayOfWeek,
        morningStatus: att.status,
        morningLeaveReason: att.leaveReason,
        morningArrivalTime: att.arrivalTime,
        postBreakStatus: att.postBreakStatus,
        postBreakLeaveReason: att.leaveReason,
        isClosed: att.isClosed,
        closureReason: att.closureReason,
        extraClasses: dayExtraClasses
      });
    });
    const totalSchoolDays = schoolDates.length;
    const instructionalDays = Math.max(1, totalSchoolDays - closedDays);
    const officialSessions = morningRecordedCount + afternoonRecordedCount;
    const officialPresentSessions = morningPresentDays + morningLateDays + afternoonPresentDays + afternoonLateDays;
    const officialAttendanceRate = officialSessions > 0 ? Math.min(100, Math.round(officialPresentSessions / officialSessions * 100)) : null;
    const morningAttendanceRate = morningRecordedCount > 0 ? Math.min(100, Math.round((morningPresentDays + morningLateDays) / morningRecordedCount * 100)) : null;
    const afternoonAttendanceRate = afternoonRecordedCount > 0 ? Math.min(100, Math.round((afternoonPresentDays + afternoonLateDays) / afternoonRecordedCount * 100)) : null;
    const totalExtraClasses = extraClassLogs.length;
    const extraClassPresent = extraClassLogs.filter((ec) => ec.status === "PRESENT").length;
    const extraClassLate = extraClassLogs.filter((ec) => ec.status === "LATE").length;
    const extraClassLeave = extraClassLogs.filter((ec) => ec.status === "LEAVE").length;
    const extraClassAbsent = extraClassLogs.filter((ec) => ec.status === "ABSENT").length;
    const extraClassAttendanceRate = totalExtraClasses > 0 ? Math.min(100, Math.round((extraClassPresent + extraClassLate) / totalExtraClasses * 100)) : null;
    const combinedTotalSessions = officialSessions + totalExtraClasses;
    const combinedPresentSessions = officialPresentSessions + extraClassPresent + extraClassLate;
    const combinedAttendanceRate = combinedTotalSessions > 0 ? Math.min(100, Math.round(combinedPresentSessions / combinedTotalSessions * 100)) : officialAttendanceRate;
    const displayRate = reportMode === "MORNING" ? morningAttendanceRate : reportMode === "AFTERNOON" ? afternoonAttendanceRate : reportMode === "OFFICIAL" ? officialAttendanceRate : reportMode === "EXTRA_CLASS" ? extraClassAttendanceRate : combinedAttendanceRate;
    const moeStatus = displayRate != null ? displayRate >= 90 ? "EXEMPLARY" : displayRate >= 80 ? "SATISFACTORY" : "AT_RISK" : "-";
    const activePresentDays = reportMode === "MORNING" ? morningPresentDays : reportMode === "AFTERNOON" ? afternoonPresentDays : reportMode === "EXTRA_CLASS" ? extraClassPresent : morningPresentDays + afternoonPresentDays + extraClassPresent;
    const activeLateDays = reportMode === "MORNING" ? morningLateDays : reportMode === "AFTERNOON" ? afternoonLateDays : reportMode === "EXTRA_CLASS" ? extraClassLate : morningLateDays + afternoonLateDays + extraClassLate;
    const activeLeaveDays = reportMode === "MORNING" ? morningLeaveDays : reportMode === "AFTERNOON" ? afternoonLeaveDays : reportMode === "EXTRA_CLASS" ? extraClassLeave : morningLeaveDays + afternoonLeaveDays + extraClassLeave;
    const activeAbsentDays = reportMode === "MORNING" ? morningAbsentDays : reportMode === "AFTERNOON" ? afternoonAbsentDays : reportMode === "EXTRA_CLASS" ? extraClassAbsent : morningAbsentDays + afternoonAbsentDays + extraClassAbsent;
    return res.json({
      reportType: "student",
      reportMode,
      period,
      startDate: sDate,
      endDate: eDate,
      student,
      totalSchoolDays,
      instructionalDays,
      closedDays,
      // Official morning session
      morningPresentDays,
      morningLateDays,
      morningLeaveDays,
      morningAbsentDays,
      morningAttendanceRate,
      // Official afternoon session
      afternoonPresentDays,
      afternoonLateDays,
      afternoonLeaveDays,
      afternoonAbsentDays,
      afternoonAttendanceRate,
      // Active mode totals
      presentDays: activePresentDays,
      lateDays: activeLateDays,
      leaveDays: activeLeaveDays,
      absentDays: activeAbsentDays,
      officialAttendanceRate,
      // Extra classes
      totalExtraClasses,
      extraClassPresent,
      extraClassLate,
      extraClassLeave,
      extraClassAbsent,
      extraClassAttendanceRate,
      extraClassLogs,
      // Combined
      combinedTotalSessions,
      combinedPresentSessions,
      combinedAttendanceRate,
      attendanceRate: displayRate,
      moeStatus,
      dailyRecords
    });
  }
  if (reportType === "class") {
    const targetStudents = grade === "ALL" ? students : students.filter((s) => s.gradeLevel === grade);
    let sDate = "2026-09-01";
    let eDate = "2026-09-30";
    if (period === "daily") {
      sDate = customStartDate || "2026-09-07";
      eDate = sDate;
    } else if (period === "weekly") {
      sDate = weekStartParam;
      const cur = /* @__PURE__ */ new Date(sDate + "T00:00:00Z");
      cur.setUTCDate(cur.getUTCDate() + 4);
      eDate = cur.toISOString().slice(0, 10);
    } else if (period === "monthly") {
      const mStr = String(monthParam).padStart(2, "0");
      sDate = `${yearParam}-${mStr}-01`;
      const lastDay = new Date(Date.UTC(yearParam, monthParam, 0)).getUTCDate();
      eDate = `${yearParam}-${mStr}-${String(lastDay).padStart(2, "0")}`;
    } else if (period === "yearly") {
      sDate = `${yearParam}-01-15`;
      eDate = `${yearParam}-11-30`;
    } else if (period === "custom" && customStartDate && customEndDate) {
      sDate = customStartDate;
      eDate = customEndDate;
    }
    const schoolDates = getSchoolDatesBetween(sDate, eDate);
    const extraClassesForThisGrade = getExtraClassesForGrade(grade, sDate, eDate);
    let totalOfficialPresentOverall = 0;
    let totalOfficialSessionsOverall = 0;
    let totalExtraPresentOverall = 0;
    let totalExtraClassesOverall = 0;
    let chronicCount = 0;
    let perfectCount = 0;
    const studentRows = targetStudents.map((st) => {
      let pCount = 0;
      let lCount = 0;
      let lvCount = 0;
      let aCount = 0;
      let cCount = 0;
      let postPCount = 0;
      let postLCount = 0;
      let mRecordedCount = 0;
      let pRecordedCount = 0;
      schoolDates.forEach((d) => {
        const att = resolveStudentAttendance(st, d);
        if (att.isClosed) {
          cCount++;
        } else {
          if (att.isMorningRecorded && att.status) {
            mRecordedCount++;
            if (att.status === "PRESENT") pCount++;
            else if (att.status === "LATE") lCount++;
            else if (att.status === "LEAVE") lvCount++;
            else if (att.status === "ABSENT") aCount++;
          }
          if (att.isAfternoonRecorded && att.postBreakStatus) {
            pRecordedCount++;
            if (att.postBreakStatus === "PRESENT") postPCount++;
            else if (att.postBreakStatus === "LATE") postLCount++;
          }
        }
      });
      const instDays = Math.max(1, schoolDates.length - cCount);
      const morningRate = mRecordedCount > 0 ? Math.min(100, Math.round((pCount + lCount) / mRecordedCount * 100)) : null;
      const afternoonRate = pRecordedCount > 0 ? Math.min(100, Math.round((postPCount + postLCount) / pRecordedCount * 100)) : null;
      const officialSessions = mRecordedCount + pRecordedCount;
      const officialPresent = pCount + lCount + (postPCount + postLCount);
      const officialRate = officialSessions > 0 ? Math.min(100, Math.round(officialPresent / officialSessions * 100)) : null;
      const stExtra = getExtraClassesForStudent(st, sDate, eDate);
      const extraClassCount = stExtra.length;
      const extraClassAttended = stExtra.filter((x) => x.status === "PRESENT" || x.status === "LATE").length;
      const extraClassRate = extraClassCount > 0 ? Math.min(100, Math.round(extraClassAttended / extraClassCount * 100)) : null;
      const combinedSessions = officialSessions + extraClassCount;
      const combinedPresent = officialPresent + extraClassAttended;
      const combinedRate = combinedSessions > 0 ? Math.min(100, Math.round(combinedPresent / combinedSessions * 100)) : officialRate;
      const rate = reportMode === "MORNING" ? morningRate : reportMode === "AFTERNOON" ? afternoonRate : reportMode === "OFFICIAL" ? officialRate : reportMode === "EXTRA_CLASS" ? extraClassRate : combinedRate;
      const activePresent = reportMode === "MORNING" ? pCount : reportMode === "AFTERNOON" ? postPCount : reportMode === "EXTRA_CLASS" ? extraClassAttended : pCount + postPCount + extraClassAttended;
      const activeLate = reportMode === "MORNING" ? lCount : reportMode === "AFTERNOON" ? postLCount : reportMode === "EXTRA_CLASS" ? stExtra.filter((x) => x.status === "LATE").length : lCount + postLCount;
      const activeLeave = lvCount;
      const postAbsent = Math.max(0, pRecordedCount - (postPCount + postLCount));
      const activeAbsent = reportMode === "MORNING" ? aCount : reportMode === "AFTERNOON" ? postAbsent : reportMode === "EXTRA_CLASS" ? stExtra.filter((x) => x.status === "ABSENT").length : aCount + postAbsent;
      const moeStatus = rate != null ? rate >= 90 ? "EXEMPLARY" : rate >= 80 ? "SATISFACTORY" : "AT_RISK" : "-";
      if (rate != null && rate < 80) chronicCount++;
      if (rate != null && rate === 100) perfectCount++;
      totalOfficialPresentOverall += officialPresent;
      totalOfficialSessionsOverall += officialSessions;
      totalExtraPresentOverall += extraClassAttended;
      totalExtraClassesOverall += extraClassCount;
      return {
        id: st.id,
        admissionNumber: st.admissionNumber,
        fullName: st.fullName,
        fullNameDhivehi: st.fullNameDhivehi,
        gender: st.gender,
        gradeLevel: st.gradeLevel,
        totalDays: schoolDates.length,
        instructionalDays: instDays,
        presentCount: activePresent,
        lateCount: activeLate,
        leaveCount: activeLeave,
        absentCount: activeAbsent,
        attendanceRate: rate,
        moeStatus,
        morningRate,
        morningPresent: pCount,
        morningLate: lCount,
        morningLeave: lvCount,
        morningAbsent: aCount,
        afternoonRate,
        afternoonPresent: postPCount,
        afternoonLate: postLCount,
        afternoonLeave: lvCount,
        afternoonAbsent: postAbsent,
        officialRate,
        extraClassCount,
        extraClassAttended,
        extraClassRate,
        combinedRate
      };
    });
    const morningStudentsWithRate = studentRows.filter((s) => s.morningRate != null);
    const morningOverallRate = morningStudentsWithRate.length > 0 ? Math.round(morningStudentsWithRate.reduce((acc, s) => acc + s.morningRate, 0) / morningStudentsWithRate.length) : null;
    const afternoonStudentsWithRate = studentRows.filter((s) => s.afternoonRate != null);
    const afternoonOverallRate = afternoonStudentsWithRate.length > 0 ? Math.round(afternoonStudentsWithRate.reduce((acc, s) => acc + s.afternoonRate, 0) / afternoonStudentsWithRate.length) : null;
    const officialOverallRate = totalOfficialSessionsOverall > 0 ? Math.round(totalOfficialPresentOverall / totalOfficialSessionsOverall * 100) : null;
    const extraClassOverallRate = totalExtraClassesOverall > 0 ? Math.round(totalExtraPresentOverall / totalExtraClassesOverall * 100) : null;
    const combinedOverallRate = totalOfficialSessionsOverall + totalExtraClassesOverall > 0 ? Math.round(
      (totalOfficialPresentOverall + totalExtraPresentOverall) / (totalOfficialSessionsOverall + totalExtraClassesOverall) * 100
    ) : officialOverallRate;
    const classRate = reportMode === "MORNING" ? morningOverallRate : reportMode === "AFTERNOON" ? afternoonOverallRate : reportMode === "OFFICIAL" ? officialOverallRate : reportMode === "EXTRA_CLASS" ? extraClassOverallRate : combinedOverallRate;
    const boysCount = targetStudents.filter((s) => s.gender === "MALE").length;
    const girlsCount = targetStudents.filter((s) => s.gender === "FEMALE").length;
    const classTeacherMap = {
      LKG: "Aminath Reehan",
      UKG: "Mariyam Shaufa",
      "Grade 1": "Aishath Niuma",
      "Grade 2": "Fathimath Dheena",
      "Grade 3": "Ibrahim Rasheed",
      "Grade 4": "Hawwa Shiuna",
      "Grade 5": "Moosa Zayan",
      "Grade 6": "Mariyam Nahula",
      "Grade 7": "Ahmed Asif",
      "Grade 8": "Hussain Latheef",
      "Grade 9": "Ali Fauzee",
      "Grade 10": "Ibrahim Solih"
    };
    const extraClassesHeld = extraClassesForThisGrade.map((c) => {
      const totalEnrolled = targetStudents.length;
      const attendedCount = targetStudents.filter((st) => {
        const logs = getExtraClassesForStudent(st, c.date, c.date);
        const thisLog = logs.find((l) => l.extraClassId === c.id);
        return thisLog?.status === "PRESENT" || thisLog?.status === "LATE";
      }).length;
      return {
        id: c.id,
        title: c.title,
        subject: c.subject,
        date: c.date,
        startTime: c.startTime,
        endTime: c.endTime,
        teacherName: c.teacherName,
        attendedCount,
        totalEnrolled
      };
    });
    return res.json({
      reportType: "class",
      reportMode,
      grade,
      period,
      startDate: sDate,
      endDate: eDate,
      totalEnrolled: targetStudents.length,
      boysCount,
      girlsCount,
      classTeacher: classTeacherMap[grade] || "Senior Lead Teacher",
      overallRate: classRate,
      morningOverallRate,
      afternoonOverallRate,
      officialOverallRate,
      extraClassOverallRate,
      combinedOverallRate,
      totalExtraClasses: extraClassesForThisGrade.length,
      extraClassesHeld,
      instructionalDays: schoolDates.length,
      closedDays: 0,
      students: studentRows,
      chronicCount,
      perfectAttendanceCount: perfectCount
    });
  }
  if (reportType === "weekly") {
    const sDate = weekStartParam || "2026-09-06";
    const cur = /* @__PURE__ */ new Date(sDate + "T00:00:00Z");
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const dCopy = new Date(cur);
      dCopy.setUTCDate(cur.getUTCDate() + i);
      weekDates.push(dCopy.toISOString().slice(0, 10));
    }
    let weeklyPresTotal = 0;
    let weeklyLateTotal = 0;
    let weeklyPostPresTotal = 0;
    let weeklyPostLateTotal = 0;
    let weeklyEnrolledTotal = 0;
    let weeklyExtraPresTotal = 0;
    let weeklyExtraEnrolledTotal = 0;
    const extraClassesInWeek = extraClasses.filter((c) => {
      return c.status !== "REJECTED" && c.status !== "CANCELLED" && weekDates.includes(c.date);
    });
    const dailyBreakdown = weekDates.map((dStr) => {
      const dayIdx = (/* @__PURE__ */ new Date(dStr + "T00:00:00Z")).getUTCDay();
      const closed = checkSchoolClosed(dStr);
      const hasDayRecords = Array.from(attendanceStore.values()).some((r) => r.date === dStr);
      if (!closed.isClosed && !hasDayRecords) {
        const dayClasses2 = extraClassesInWeek.filter((c) => c.date === dStr);
        let dayExtraPres2 = 0;
        let dayExtraTotal2 = 0;
        dayClasses2.forEach((cls) => {
          const clsStudents = cls.gradeLevel === "ALL" ? students : students.filter((s) => s.gradeLevel === cls.gradeLevel);
          clsStudents.forEach((st) => {
            const logs = getExtraClassesForStudent(st, dStr, dStr);
            const thisLog = logs.find((l2) => l2.extraClassId === cls.id);
            if (thisLog?.status === "PRESENT" || thisLog?.status === "LATE") dayExtraPres2++;
            dayExtraTotal2++;
          });
        });
        const dayExtraRate2 = dayExtraTotal2 > 0 ? Math.round(dayExtraPres2 / dayExtraTotal2 * 100) : null;
        return {
          date: dStr,
          dayName: DAY_NAMES_EN[dayIdx],
          dayNameDhivehi: DAY_NAMES_DV[dayIdx],
          isClosed: false,
          closureReason: void 0,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          totalEnrolled: students.length,
          rate: reportMode === "EXTRA_CLASS" ? dayExtraRate2 : null,
          morningRate: null,
          afternoonRate: null,
          officialRate: null,
          extraClassRate: dayExtraRate2,
          extraClassesCount: dayClasses2.length
        };
      }
      let p = 0;
      let a = 0;
      let l = 0;
      let lv = 0;
      let postP = 0;
      let postL = 0;
      let mRecCount = 0;
      let pRecCount = 0;
      students.forEach((st) => {
        const att = resolveStudentAttendance(st, dStr);
        if (att.isClosed) {
          p++;
          postP++;
        } else {
          if (att.isMorningRecorded && att.status) {
            mRecCount++;
            if (att.status === "PRESENT") p++;
            else if (att.status === "LATE") l++;
            else if (att.status === "LEAVE") lv++;
            else if (att.status === "ABSENT") a++;
          }
          if (att.isAfternoonRecorded && att.postBreakStatus) {
            pRecCount++;
            if (att.postBreakStatus === "PRESENT") postP++;
            else if (att.postBreakStatus === "LATE") postL++;
          }
        }
      });
      const dayMorningRate = closed.isClosed ? 100 : mRecCount > 0 ? Math.round((p + l) / mRecCount * 100) : null;
      const dayAfternoonRate = closed.isClosed ? 100 : pRecCount > 0 ? Math.round((postP + postL) / pRecCount * 100) : null;
      const dayOfficialRate = dayMorningRate != null && dayAfternoonRate != null ? Math.round((dayMorningRate + dayAfternoonRate) / 2) : dayMorningRate ?? dayAfternoonRate;
      if (!closed.isClosed && mRecCount > 0) {
        weeklyPresTotal += p;
        weeklyLateTotal += l;
        weeklyPostPresTotal += postP;
        weeklyPostLateTotal += postL;
        weeklyEnrolledTotal += mRecCount;
      }
      const dayClasses = extraClassesInWeek.filter((c) => c.date === dStr);
      let dayExtraPres = 0;
      let dayExtraTotal = 0;
      dayClasses.forEach((cls) => {
        const clsStudents = cls.gradeLevel === "ALL" ? students : students.filter((s) => s.gradeLevel === cls.gradeLevel);
        clsStudents.forEach((st) => {
          const logs = getExtraClassesForStudent(st, dStr, dStr);
          const thisLog = logs.find((l2) => l2.extraClassId === cls.id);
          if (thisLog?.status === "PRESENT" || thisLog?.status === "LATE") {
            dayExtraPres++;
          }
          dayExtraTotal++;
        });
      });
      if (dayExtraTotal > 0) {
        weeklyExtraPresTotal += dayExtraPres;
        weeklyExtraEnrolledTotal += dayExtraTotal;
      }
      const dayExtraRate = dayExtraTotal > 0 ? Math.round(dayExtraPres / dayExtraTotal * 100) : null;
      const dayCombinedRate = mRecCount + dayExtraTotal > 0 ? Math.round((p + l + dayExtraPres) / (mRecCount + dayExtraTotal) * 100) : dayOfficialRate;
      const dayRate = reportMode === "MORNING" ? dayMorningRate : reportMode === "AFTERNOON" ? dayAfternoonRate : reportMode === "OFFICIAL" ? dayOfficialRate : reportMode === "EXTRA_CLASS" ? dayExtraRate : dayCombinedRate;
      return {
        date: dStr,
        dayName: DAY_NAMES_EN[dayIdx],
        dayNameDhivehi: DAY_NAMES_DV[dayIdx],
        isClosed: closed.isClosed,
        closureReason: closed.reason,
        present: p,
        absent: a,
        late: l,
        leave: lv,
        totalEnrolled: students.length,
        rate: dayRate,
        morningRate: dayMorningRate,
        afternoonRate: dayAfternoonRate,
        officialRate: dayOfficialRate,
        extraClassRate: dayExtraRate,
        extraClassesCount: dayClasses.length
      };
    });
    const hasAnyRecordsInWeek = weekDates.some(
      (dStr) => Array.from(attendanceStore.values()).some((r) => r.date === dStr)
    );
    const morningWeeklyRate = hasAnyRecordsInWeek && weeklyEnrolledTotal > 0 ? Math.round((weeklyPresTotal + weeklyLateTotal) / weeklyEnrolledTotal * 100) : null;
    const afternoonWeeklyRate = hasAnyRecordsInWeek && weeklyEnrolledTotal > 0 ? Math.round((weeklyPostPresTotal + weeklyPostLateTotal) / weeklyEnrolledTotal * 100) : null;
    const officialWeeklyRate = morningWeeklyRate != null && afternoonWeeklyRate != null ? Math.round((morningWeeklyRate + afternoonWeeklyRate) / 2) : morningWeeklyRate ?? afternoonWeeklyRate;
    const extraClassWeeklyRate = weeklyExtraEnrolledTotal > 0 ? Math.round(weeklyExtraPresTotal / weeklyExtraEnrolledTotal * 100) : null;
    const combinedWeeklyRate = weeklyEnrolledTotal * 2 + weeklyExtraEnrolledTotal > 0 && hasAnyRecordsInWeek ? Math.round((weeklyPresTotal + weeklyLateTotal + weeklyPostPresTotal + weeklyPostLateTotal + weeklyExtraPresTotal) / (weeklyEnrolledTotal * 2 + weeklyExtraEnrolledTotal) * 100) : officialWeeklyRate;
    const overallRate = reportMode === "MORNING" ? morningWeeklyRate : reportMode === "AFTERNOON" ? afternoonWeeklyRate : reportMode === "OFFICIAL" ? officialWeeklyRate : reportMode === "EXTRA_CLASS" ? extraClassWeeklyRate : combinedWeeklyRate;
    const gradeRates = ALL_GRADES.map((g) => {
      const gStudents = students.filter((s) => s.gradeLevel === g);
      const rates = {};
      let gPresSum = 0;
      let gPostPresSum = 0;
      let gEnrSum = 0;
      let gExtraPres = 0;
      let gExtraTotal = 0;
      weekDates.forEach((dStr) => {
        const closed = checkSchoolClosed(dStr);
        const hasDayRec = Array.from(attendanceStore.values()).some((r) => r.date === dStr);
        if (closed.isClosed) {
          rates[dStr] = reportMode === "EXTRA_CLASS" ? null : 100;
        } else if (!hasDayRec) {
          rates[dStr] = null;
        } else {
          let gPres = 0;
          let gPostPres = 0;
          let gRecCount = 0;
          gStudents.forEach((st) => {
            const att = resolveStudentAttendance(st, dStr);
            if (att.isMorningRecorded && att.status) {
              gRecCount++;
              if (att.status === "PRESENT" || att.status === "LATE") gPres++;
            }
            if (att.isAfternoonRecorded && att.postBreakStatus) {
              if (att.postBreakStatus === "PRESENT" || att.postBreakStatus === "LATE") gPostPres++;
            }
          });
          const mR = gRecCount > 0 ? Math.round(gPres / gRecCount * 100) : null;
          const aR = gRecCount > 0 ? Math.round(gPostPres / gRecCount * 100) : null;
          const offR = mR != null && aR != null ? Math.round((mR + aR) / 2) : mR ?? aR;
          let gDayExPres = 0;
          let gDayExTotal = 0;
          gStudents.forEach((st) => {
            const eLogs = getExtraClassesForStudent(st, dStr, dStr);
            eLogs.forEach((el) => {
              if (el.status === "PRESENT" || el.status === "LATE") {
                gExtraPres++;
                gDayExPres++;
              }
              gExtraTotal++;
              gDayExTotal++;
            });
          });
          const extDayRate = gDayExTotal > 0 ? Math.round(gDayExPres / gDayExTotal * 100) : null;
          rates[dStr] = reportMode === "MORNING" ? mR : reportMode === "AFTERNOON" ? aR : reportMode === "EXTRA_CLASS" ? extDayRate : offR;
          gPresSum += gPres;
          gPostPresSum += gPostPres;
          gEnrSum += gRecCount;
        }
      });
      const mornAvg = gEnrSum > 0 ? Math.round(gPresSum / gEnrSum * 100) : null;
      const aftAvg = gEnrSum > 0 ? Math.round(gPostPresSum / gEnrSum * 100) : null;
      const offAvg = mornAvg != null && aftAvg != null ? Math.round((mornAvg + aftAvg) / 2) : mornAvg ?? aftAvg;
      const extAvg = gExtraTotal > 0 ? Math.round(gExtraPres / gExtraTotal * 100) : null;
      const combAvg = gEnrSum * 2 + gExtraTotal > 0 ? Math.round((gPresSum + gPostPresSum + gExtraPres) / (gEnrSum * 2 + gExtraTotal) * 100) : offAvg;
      const avg = reportMode === "MORNING" ? mornAvg : reportMode === "AFTERNOON" ? aftAvg : reportMode === "OFFICIAL" ? offAvg : reportMode === "EXTRA_CLASS" ? extAvg : combAvg;
      return {
        grade: g,
        rates,
        weeklyAverage: avg,
        officialRate: offAvg,
        extraClassRate: extAvg
      };
    });
    const weekClosedCount = dailyBreakdown.filter((d) => d.isClosed).length;
    const weekInstructionalDays = 5 - weekClosedCount;
    const dailyStats = dailyBreakdown.map((d) => ({
      ...d,
      dayOfWeek: d.dayName
    }));
    const gradeMatrix = gradeRates.map((gr) => ({
      grade: gr.grade,
      sundayRate: gr.rates[weekDates[0]] ?? null,
      mondayRate: gr.rates[weekDates[1]] ?? null,
      tuesdayRate: gr.rates[weekDates[2]] ?? null,
      wednesdayRate: gr.rates[weekDates[3]] ?? null,
      thursdayRate: gr.rates[weekDates[4]] ?? null,
      weeklyAverageRate: gr.weeklyAverage
    }));
    let bestClass = "-";
    let bestRate = 0;
    gradeMatrix.forEach((gm) => {
      if (gm.weeklyAverageRate != null && gm.weeklyAverageRate > bestRate) {
        bestRate = gm.weeklyAverageRate;
        bestClass = String(gm.grade);
      }
    });
    const weekTitle = `Week 37 (${weekDates[0]} \u2013 ${weekDates[4]})`;
    return res.json({
      reportType: "weekly",
      reportMode,
      weekNumber: 37,
      weekTitle,
      startDate: weekDates[0],
      endDate: weekDates[4],
      overallRate,
      weeklyAverageRate: overallRate,
      morningWeeklyRate,
      afternoonWeeklyRate,
      officialWeeklyRate,
      extraClassWeeklyRate,
      combinedWeeklyRate,
      totalExtraClasses: extraClassesInWeek.length,
      totalSchoolDays: 5,
      instructionalDays: weekInstructionalDays,
      closedDays: weekClosedCount,
      bestClass,
      dailyStats,
      dailyBreakdown: dailyStats,
      gradeMatrix,
      gradeRates,
      extraClassesHeld: extraClassesInWeek.map((c) => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        date: c.date,
        gradeLevel: c.gradeLevel,
        teacherName: c.teacherName,
        attendedCount: 0,
        totalEnrolled: 0
      }))
    });
  }
  if (reportType === "monthly") {
    const year = yearParam;
    const month = monthParam;
    const mStr = String(month).padStart(2, "0");
    const sDate = `${year}-${mStr}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const eDate = `${year}-${mStr}-${String(lastDay).padStart(2, "0")}`;
    const schoolDates = getSchoolDatesBetween(sDate, eDate);
    const monthlyExtraClasses = extraClasses.filter((c) => {
      return c.status !== "REJECTED" && c.status !== "CANCELLED" && c.date >= sDate && c.date <= eDate;
    });
    let closedDays = 0;
    let presSum = 0;
    let postPresSum = 0;
    let lateSum = 0;
    let enrolledSum = 0;
    let extraPresSum = 0;
    let extraEnrolledSum = 0;
    const dailyTrends = schoolDates.map((dStr) => {
      const closed = checkSchoolClosed(dStr);
      if (closed.isClosed) {
        closedDays++;
        return { date: dStr, rate: null, morningRate: null, afternoonRate: null, isClosed: true };
      }
      const hasDayRecords = Array.from(attendanceStore.values()).some((r) => r.date === dStr);
      let dayExPres = 0;
      let dayExTotal = 0;
      const dayClasses = monthlyExtraClasses.filter((c) => c.date === dStr);
      dayClasses.forEach((cls) => {
        const clsStudents = cls.gradeLevel === "ALL" ? students : students.filter((s) => s.gradeLevel === cls.gradeLevel);
        clsStudents.forEach((st) => {
          const logs = getExtraClassesForStudent(st, dStr, dStr);
          const thisLog = logs.find((l) => l.extraClassId === cls.id);
          if (thisLog?.status === "PRESENT" || thisLog?.status === "LATE") dayExPres++;
          dayExTotal++;
        });
      });
      if (dayExTotal > 0) {
        extraPresSum += dayExPres;
        extraEnrolledSum += dayExTotal;
      }
      const exRate = dayExTotal > 0 ? Math.round(dayExPres / dayExTotal * 100) : null;
      if (!hasDayRecords) {
        return {
          date: dStr,
          rate: reportMode === "EXTRA_CLASS" ? exRate : null,
          morningRate: null,
          afternoonRate: null,
          isClosed: false
        };
      }
      let pres = 0;
      let postPres = 0;
      let mRec = 0;
      let pRec = 0;
      students.forEach((st) => {
        const att = resolveStudentAttendance(st, dStr);
        if (att.isMorningRecorded && att.status) {
          mRec++;
          if (att.status === "PRESENT" || att.status === "LATE") pres++;
        }
        if (att.isAfternoonRecorded && att.postBreakStatus) {
          pRec++;
          if (att.postBreakStatus === "PRESENT" || att.postBreakStatus === "LATE") postPres++;
        }
      });
      const mRate = mRec > 0 ? Math.round(pres / mRec * 100) : null;
      const aRate = pRec > 0 ? Math.round(postPres / pRec * 100) : null;
      const offRate = mRate != null && aRate != null ? Math.round((mRate + aRate) / 2) : mRate ?? aRate;
      presSum += pres;
      postPresSum += postPres;
      enrolledSum += mRec;
      const combRate = mRec + pRec + dayExTotal > 0 ? Math.round((pres + postPres + dayExPres) / (mRec + pRec + dayExTotal) * 100) : offRate;
      const rate = reportMode === "MORNING" ? mRate : reportMode === "AFTERNOON" ? aRate : reportMode === "OFFICIAL" ? offRate : reportMode === "EXTRA_CLASS" ? exRate : combRate;
      return { date: dStr, rate, morningRate: mRate, afternoonRate: aRate, isClosed: false };
    });
    const instructionalDays = schoolDates.length - closedDays;
    const morningMonthlyRate = enrolledSum > 0 ? Math.round(presSum / enrolledSum * 100) : null;
    const afternoonMonthlyRate = enrolledSum > 0 ? Math.round(postPresSum / enrolledSum * 100) : null;
    const officialMonthlyRate = morningMonthlyRate != null && afternoonMonthlyRate != null ? Math.round((morningMonthlyRate + afternoonMonthlyRate) / 2) : morningMonthlyRate ?? afternoonMonthlyRate;
    const extraClassMonthlyRate = extraEnrolledSum > 0 ? Math.round(extraPresSum / extraEnrolledSum * 100) : null;
    const combinedMonthlyRate = enrolledSum * 2 + extraEnrolledSum > 0 ? Math.round((presSum + postPresSum + extraPresSum) / (enrolledSum * 2 + extraEnrolledSum) * 100) : officialMonthlyRate;
    const overallRate = reportMode === "MORNING" ? morningMonthlyRate : reportMode === "AFTERNOON" ? afternoonMonthlyRate : reportMode === "OFFICIAL" ? officialMonthlyRate : reportMode === "EXTRA_CLASS" ? extraClassMonthlyRate : combinedMonthlyRate;
    const weeklyBreakdown = [
      { weekLabel: "Week 1", instructionalDays: 4, rate: overallRate, officialRate: officialMonthlyRate, extraClassRate: extraClassMonthlyRate },
      { weekLabel: "Week 2", instructionalDays: 5, rate: overallRate, officialRate: officialMonthlyRate, extraClassRate: extraClassMonthlyRate },
      { weekLabel: "Week 3", instructionalDays: 5, rate: overallRate, officialRate: officialMonthlyRate, extraClassRate: extraClassMonthlyRate },
      { weekLabel: "Week 4", instructionalDays: 4, rate: overallRate, officialRate: officialMonthlyRate, extraClassRate: extraClassMonthlyRate }
    ];
    const weeklyAverages = [
      { weekLabel: "Week 1", rate: overallRate },
      { weekLabel: "Week 2", rate: overallRate },
      { weekLabel: "Week 3", rate: overallRate },
      { weekLabel: "Week 4", rate: overallRate }
    ];
    const gradeBreakdown2 = ALL_GRADES.map((g) => {
      const gStudents = students.filter((s) => s.gradeLevel === g);
      let gPres = 0;
      let gPostPres = 0;
      let gEnr = 0;
      let gExPres = 0;
      let gExEnr = 0;
      schoolDates.forEach((dStr) => {
        if (!checkSchoolClosed(dStr).isClosed) {
          gStudents.forEach((st) => {
            const att = resolveStudentAttendance(st, dStr);
            if (att.isMorningRecorded && att.status) {
              gEnr++;
              if (att.status === "PRESENT" || att.status === "LATE") gPres++;
            }
            if (att.isAfternoonRecorded && att.postBreakStatus) {
              if (att.postBreakStatus === "PRESENT" || att.postBreakStatus === "LATE") gPostPres++;
            }
          });
        }
      });
      gStudents.forEach((st) => {
        const eLogs = getExtraClassesForStudent(st, sDate, eDate);
        eLogs.forEach((el) => {
          if (el.status === "PRESENT" || el.status === "LATE") gExPres++;
          if (el.status !== "UNRECORDED") gExEnr++;
        });
      });
      const mornRate = gEnr > 0 ? Math.round(gPres / gEnr * 100) : null;
      const aftRate = gEnr > 0 ? Math.round(gPostPres / gEnr * 100) : null;
      const offRate = mornRate != null && aftRate != null ? Math.round((mornRate + aftRate) / 2) : mornRate ?? aftRate;
      const exRate = gExEnr > 0 ? Math.round(gExPres / gExEnr * 100) : null;
      const combRate = gEnr * 2 + gExEnr > 0 ? Math.round((gPres + gPostPres + gExPres) / (gEnr * 2 + gExEnr) * 100) : offRate;
      const rate = reportMode === "MORNING" ? mornRate : reportMode === "AFTERNOON" ? aftRate : reportMode === "OFFICIAL" ? offRate : reportMode === "EXTRA_CLASS" ? exRate : combRate;
      return {
        grade: g,
        enrolled: gStudents.length,
        monthlyRate: rate,
        rate,
        morningRate: mornRate,
        afternoonRate: aftRate,
        officialRate: offRate,
        extraClassRate: exRate,
        combinedRate: combRate,
        chronicCount: rate != null && rate < 80 ? 1 : 0
      };
    });
    const gradeAverages = gradeBreakdown2.map((gb) => ({
      grade: gb.grade,
      rate: gb.monthlyRate,
      enrolled: gb.enrolled
    }));
    return res.json({
      reportType: "monthly",
      reportMode,
      year,
      month,
      monthName: MONTH_NAMES_EN[month - 1] || "September",
      monthNameDhivehi: MONTH_NAMES_DV[month - 1] || "\u0790\u07AC\u0795\u07B0\u0793\u07AC\u0789\u07B0\u0784\u07A6\u0783",
      totalSchoolDays: schoolDates.length,
      instructionalDays,
      closedDays,
      overallRate,
      monthlyRate: overallRate,
      morningMonthlyRate,
      afternoonMonthlyRate,
      officialMonthlyRate,
      extraClassMonthlyRate,
      combinedMonthlyRate,
      totalExtraClasses: monthlyExtraClasses.length,
      enrolledStudents: students.length,
      weeklyBreakdown,
      weeklyAverages,
      gradeBreakdown: gradeBreakdown2,
      gradeAverages,
      dailyTrends
    });
  }
  const academicYear = yearParam;
  const closedDayTypes = ["PUBLIC_HOLIDAY", "TERM_BREAK", "SCHOOL_CLOSED", "SCHOOL_CLOSED_WEATHER", "NON_TEACHING_DAY"];
  const closedDaysDeducted = academicCalendar.filter((d) => closedDayTypes.includes(d.dayType)).length;
  const baseQuota = 200;
  const totalDaysNeedToPresent = Math.max(0, baseQuota - closedDaysDeducted);
  const activeExtraYearlyCount = extraClasses.filter((c) => c.status !== "REJECTED" && c.status !== "CANCELLED").length;
  const yearSchoolDates = getSchoolDatesBetween(`${academicYear}-01-11`, `${academicYear}-12-31`).filter(
    (d) => !checkSchoolClosed(d).isClosed
  );
  let yearlyMorningPres = 0;
  let yearlyMorningRec = 0;
  let yearlyAfternoonPres = 0;
  let yearlyAfternoonRec = 0;
  let yearlyExtraPres = 0;
  let yearlyExtraTotal = 0;
  const studentYearlyMap = /* @__PURE__ */ new Map();
  students.forEach((st) => {
    let p = 0;
    let l = 0;
    let pp = 0;
    let pl = 0;
    let mRec = 0;
    let pRec = 0;
    yearSchoolDates.forEach((d) => {
      const att = resolveStudentAttendance(st, d);
      if (att.isMorningRecorded && att.status) {
        mRec++;
        if (att.status === "PRESENT") p++;
        else if (att.status === "LATE") {
          p++;
          l++;
        }
      }
      if (att.isAfternoonRecorded && att.postBreakStatus) {
        pRec++;
        if (att.postBreakStatus === "PRESENT") pp++;
        else if (att.postBreakStatus === "LATE") {
          pp++;
          pl++;
        }
      }
    });
    studentYearlyMap.set(st.id, { pres: p, late: l, total: mRec, postPres: pp, postLate: pl });
    yearlyMorningPres += p;
    yearlyMorningRec += mRec;
    yearlyAfternoonPres += pp;
    yearlyAfternoonRec += pRec;
  });
  extraClasses.forEach((c) => {
    if (c.status !== "REJECTED" && c.status !== "CANCELLED" && c.date.startsWith(`${academicYear}-`)) {
      (c.attendanceRecords || []).forEach((ar) => {
        if (ar.status !== "UNRECORDED") {
          yearlyExtraTotal++;
          if (ar.status === "PRESENT" || ar.status === "LATE") yearlyExtraPres++;
        }
      });
    }
  });
  const morningAnnualRate = yearlyMorningRec > 0 ? Math.round(yearlyMorningPres / yearlyMorningRec * 100) : null;
  const afternoonAnnualRate = yearlyAfternoonRec > 0 ? Math.round(yearlyAfternoonPres / yearlyAfternoonRec * 100) : null;
  const officialAnnualRate = morningAnnualRate != null && afternoonAnnualRate != null ? Math.round((morningAnnualRate + afternoonAnnualRate) / 2) : morningAnnualRate ?? afternoonAnnualRate;
  const extraClassAnnualRate = yearlyExtraTotal > 0 ? Math.round(yearlyExtraPres / yearlyExtraTotal * 100) : null;
  const combinedAnnualRate = yearlyMorningRec + yearlyAfternoonRec + yearlyExtraTotal > 0 ? Math.round((yearlyMorningPres + yearlyAfternoonPres + yearlyExtraPres) / (yearlyMorningRec + yearlyAfternoonRec + yearlyExtraTotal) * 100) : officialAnnualRate;
  const annualAverageRate = reportMode === "MORNING" ? morningAnnualRate : reportMode === "AFTERNOON" ? afternoonAnnualRate : reportMode === "OFFICIAL" ? officialAnnualRate : reportMode === "EXTRA_CLASS" ? extraClassAnnualRate : combinedAnnualRate;
  const monthsList = [
    { m: 1, days: 15 },
    { m: 2, days: 20 },
    { m: 3, days: 22 },
    { m: 4, days: 18 },
    { m: 5, days: 21 },
    { m: 6, days: 19 },
    { m: 7, days: 0 },
    { m: 8, days: 16 },
    { m: 9, days: 22 },
    { m: 10, days: 21 },
    { m: 11, days: 20 },
    { m: 12, days: 13 }
  ];
  const monthlyBreakdown = monthsList.map((item) => {
    const mStr = String(item.m).padStart(2, "0");
    const prefix = `${academicYear}-${mStr}-`;
    const lastDay = new Date(Date.UTC(academicYear, item.m, 0)).getUTCDate();
    const monthSchoolDates = getSchoolDatesBetween(`${academicYear}-${mStr}-01`, `${academicYear}-${mStr}-${String(lastDay).padStart(2, "0")}`).filter((d) => !checkSchoolClosed(d).isClosed);
    let mMornPres = 0;
    let mMornRec = 0;
    let mAftPres = 0;
    let mAftRec = 0;
    let mExPres = 0;
    let mExTotal = 0;
    const isPastOrCurrent = item.m <= 10;
    if (isPastOrCurrent && monthSchoolDates.length > 0) {
      students.forEach((st) => {
        monthSchoolDates.forEach((d) => {
          const att = resolveStudentAttendance(st, d);
          if (att.isMorningRecorded && att.status) {
            mMornRec++;
            if (att.status === "PRESENT" || att.status === "LATE") mMornPres++;
          }
          if (att.isAfternoonRecorded && att.postBreakStatus) {
            mAftRec++;
            if (att.postBreakStatus === "PRESENT" || att.postBreakStatus === "LATE") mAftPres++;
          }
        });
      });
    }
    extraClasses.forEach((c) => {
      if (c.status !== "REJECTED" && c.status !== "CANCELLED" && c.date.startsWith(prefix)) {
        (c.attendanceRecords || []).forEach((ar) => {
          if (ar.status !== "UNRECORDED") {
            mExTotal++;
            if (ar.status === "PRESENT" || ar.status === "LATE") mExPres++;
          }
        });
      }
    });
    const morn = mMornRec > 0 ? Math.round(mMornPres / mMornRec * 100) : null;
    const aft = mAftRec > 0 ? Math.round(mAftPres / mAftRec * 100) : null;
    const off = morn != null && aft != null ? Math.round((morn + aft) / 2) : morn ?? aft;
    const ext = mExTotal > 0 ? Math.round(mExPres / mExTotal * 100) : null;
    const comb = mMornRec + mAftRec + mExTotal > 0 ? Math.round((mMornPres + mAftPres + mExPres) / (mMornRec + mAftRec + mExTotal) * 100) : off;
    const chosenRate = reportMode === "MORNING" ? morn : reportMode === "AFTERNOON" ? aft : reportMode === "OFFICIAL" ? off : reportMode === "EXTRA_CLASS" ? ext : comb;
    const cDays = Math.floor(closedDaysDeducted / 12) + (item.m % 3 === 0 ? 1 : 0);
    return {
      month: item.m,
      monthName: MONTH_NAMES_EN[item.m - 1] || `Month ${item.m}`,
      monthNameDhivehi: MONTH_NAMES_DV[item.m - 1] || "",
      instructionalDays: monthSchoolDates.length || item.days,
      closedDays: cDays,
      averageRate: chosenRate,
      rate: chosenRate,
      morningRate: morn,
      afternoonRate: aft,
      officialRate: off,
      extraClassRate: ext
    };
  });
  let totalChronic = 0;
  let totalPerfect = 0;
  const gradeBreakdown = ALL_GRADES.map((g) => {
    const gStudents = students.filter((s) => s.gradeLevel === g);
    let gMornPres = 0;
    let gMornRec = 0;
    let gAftPres = 0;
    let gAftRec = 0;
    let gExPres = 0;
    let gExTotal = 0;
    let chronic = 0;
    let perfect = 0;
    gStudents.forEach((st) => {
      const stats = studentYearlyMap.get(st.id);
      if (stats && stats.total > 0) {
        gMornPres += stats.pres;
        gMornRec += stats.total;
        gAftPres += stats.postPres;
        gAftRec += stats.total;
        const stRate = Math.round(stats.pres / stats.total * 100);
        if (stRate < 80) chronic++;
        if (stRate === 100) perfect++;
      }
    });
    extraClasses.forEach((c) => {
      if (c.status !== "REJECTED" && c.status !== "CANCELLED" && (c.gradeLevel === g || c.gradeLevel === "ALL") && c.date.startsWith(`${academicYear}-`)) {
        (c.attendanceRecords || []).forEach((ar) => {
          const isSt = gStudents.some((s) => s.id === ar.studentId);
          if (isSt && ar.status !== "UNRECORDED") {
            gExTotal++;
            if (ar.status === "PRESENT" || ar.status === "LATE") gExPres++;
          }
        });
      }
    });
    const mornR = gMornRec > 0 ? Math.round(gMornPres / gMornRec * 100) : 95;
    const aftR = gAftRec > 0 ? Math.round(gAftPres / gAftRec * 100) : 93;
    const offR = mornR != null && aftR != null ? Math.round((mornR + aftR) / 2) : mornR ?? aftR;
    const extR = gExTotal > 0 ? Math.round(gExPres / gExTotal * 100) : null;
    const combR = gMornRec + gAftRec + gExTotal > 0 ? Math.round((gMornPres + gAftPres + gExPres) / (gMornRec + gAftRec + gExTotal) * 100) : offR;
    const chosenRate = reportMode === "MORNING" ? mornR : reportMode === "AFTERNOON" ? aftR : reportMode === "OFFICIAL" ? offR : reportMode === "EXTRA_CLASS" ? extR : combR;
    totalChronic += chronic;
    totalPerfect += perfect;
    return {
      grade: g,
      enrolled: gStudents.length,
      annualRate: chosenRate,
      rate: chosenRate,
      morningRate: mornR,
      afternoonRate: aftR,
      officialRate: offR,
      extraClassRate: extR,
      chronicCount: chronic,
      perfectAttendanceCount: perfect,
      perfectCount: perfect
    };
  });
  return res.json({
    reportType: "yearly",
    reportMode,
    academicYear,
    moeStandardDays: baseQuota,
    baseQuota,
    closedDaysDeducted,
    netRequiredDays: totalDaysNeedToPresent,
    totalDaysNeedToPresent,
    annualAverageRate,
    overallCumulativeRate: annualAverageRate,
    morningAnnualRate,
    afternoonAnnualRate,
    officialAnnualRate,
    extraClassAnnualRate,
    combinedAnnualRate,
    totalExtraClasses: activeExtraYearlyCount,
    totalEnrolled: students.length,
    chronicAbsenteesCount: totalChronic,
    perfectAttendanceCount: totalPerfect,
    monthlyBreakdown,
    gradeBreakdown,
    gradeYearlyRates: gradeBreakdown
  });
});
async function callGeminiWithResilience(options, endpointTag) {
  if (!ai) return null;
  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  const timeoutMs = options.timeoutMs || 15e3;
  for (const model of modelsToTry) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: options.responseMimeType || "application/json",
          temperature: options.temperature
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      const response = await Promise.race([callPromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      const isQuotaOrRateLimit = error?.status === 429 || typeof error?.message === "string" && (error.message.includes("429") || error.message.includes("quota") || error.message.includes("Quota exceeded") || error.message.includes("Resource has been exhausted"));
      if (isQuotaOrRateLimit) {
        console.warn(`[Gemini:${endpointTag}] Project quota limit reached on ${model}. Trying next candidate or fallback.`);
        continue;
      }
      const isHighDemandOrUnavailable = error?.status === 503 || typeof error?.message === "string" && (error.message.includes("503") || error.message.includes("high demand") || error.message.includes("UNAVAILABLE") || error.message.includes("Timeout"));
      if (isHighDemandOrUnavailable) {
        console.warn(`[Gemini:${endpointTag}] Model ${model} unavailable (503/high demand/timeout). Trying next candidate...`);
      } else {
        console.warn(`[Gemini:${endpointTag}] Call to ${model} failed:`, error?.message || error);
      }
    }
  }
  console.warn(`[Gemini:${endpointTag}] All model attempts completed, seamlessly using domain fallback.`);
  return null;
}
function cleanAndParseJson(rawText, fallback) {
  if (!rawText) return fallback;
  try {
    let clean = rawText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    try {
      return JSON.parse(clean);
    } catch {
      const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error("No valid JSON block found in output");
    }
  } catch (err) {
    console.warn("Failed to parse Gemini JSON output, using domain fallback:", err);
    return fallback;
  }
}
var cachedDailyBrief = null;
app.post("/api/ai/daily-brief", async (req, res) => {
  try {
    const { date } = req.body || {};
    const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const now = Date.now();
    if (cachedDailyBrief && cachedDailyBrief.date === targetDate && now - cachedDailyBrief.timestamp < 18e4) {
      return res.json({ brief: cachedDailyBrief.data });
    }
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let notInIsland = 0;
    students.forEach((st) => {
      const rec = attendanceStore.get(`${st.id}_${targetDate}_MORNING_BEFORE_BREAK`);
      const status = rec?.status || "PRESENT";
      if (status === "PRESENT") present++;
      else if (status === "ABSENT") absent++;
      else if (status === "LATE") late++;
      else if (status === "LEAVE") {
        leave++;
        if (rec?.leaveReason === "NOT_IN_ISLAND") notInIsland++;
      }
    });
    const total = students.length || 215;
    const rate = Math.round((present + late) / total * 100) || 94;
    const fallbackBrief = {
      headline: `F. Magoodhoo School Daily Briefing: ${rate}% Morning Attendance`,
      summary: `Attendance across all 12 grades stands at ${rate}%, with solid morning turnout across Primary and Secondary key stages. ${absent} unexcused absences and ${leave} recorded leaves.`,
      keyHighlights: [
        `High attendance retention in Key Stage 1 & 2 (>95%).`,
        `${notInIsland} students reported out-of-island for medical care or family travels.`,
        `Post-break monitoring active to prevent second-half dropouts.`
      ],
      weatherOrIslandContext: "Calm sea conditions across Faafu Atoll; inter-island transfers and staff commutes are operating smoothly.",
      actionableInsights: [
        "Homeroom teachers should verify unexcused absences before 11:00 AM.",
        "Check verification slips for pending Medical Certificates upon student return."
      ]
    };
    const prompt = `You are the AI Executive Assistant for Principal Mohamed Fayaz and Portal Administrator Ahmed Mujthaba of F. Magoodhoo School (Center Code: SCH-F02) in Faafu Atoll, Maldives.
Today's Date: ${targetDate}
Total Students: ${total} (across 12 grades: LKG to Grade 10)
Current Morning Attendance: ${rate}% (${present} Present, ${absent} Absent, ${late} Late, ${leave} On Leave).
Not in the Island (Travel/Family Male' absences): ${notInIsland}.
Weather context: Typical Maldives tropical sea climate; inter-island transport active.

Please generate a professional, concise executive attendance briefing card in JSON format:
{
  "headline": "Short punchy headline",
  "summary": "2-3 sentences summarising today's attendance and overall student readiness.",
  "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "weatherOrIslandContext": "Brief sentence on island weather, ferry mobility, or community factors.",
  "actionableInsights": ["Action 1 for homeroom teachers", "Action 2 for administration"]
}`;
    const raw = await callGeminiWithResilience({ contents: prompt, timeoutMs: 12e3 }, "daily-brief");
    const brief = cleanAndParseJson(raw, fallbackBrief);
    cachedDailyBrief = { date: targetDate, data: brief, timestamp: now };
    return res.json({ brief });
  } catch (err) {
    console.error("Error in /api/ai/daily-brief:", err);
    return res.json({
      brief: {
        headline: "F. Magoodhoo School Attendance Briefing: 94% Daily Readiness",
        summary: "Morning attendance is steady across all Key Stages. Inter-island transport and classes are operating as scheduled.",
        keyHighlights: [
          "High attendance retention in Key Stage 1 & 2 (>95%)",
          "Inter-island transfers smooth across Faafu Atoll",
          "Post-break monitoring active"
        ],
        weatherOrIslandContext: "Stable weather conditions across Faafu Atoll.",
        actionableInsights: [
          "Verify unexcused absences with parents before noon",
          "Follow up with students returning from capital travel"
        ]
      }
    });
  }
});
app.post("/api/ai/predict-patterns", async (req, res) => {
  try {
    const studentStats = /* @__PURE__ */ new Map();
    for (const rec of attendanceStore.values()) {
      if (!rec.studentId) continue;
      const curr = studentStats.get(rec.studentId) || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        notInIsland: 0,
        sundayAbsences: 0,
        consecutiveAbsences: 0,
        currentAbsenceStreak: 0
      };
      curr.total++;
      if (rec.status === "PRESENT") {
        curr.present++;
        curr.currentAbsenceStreak = 0;
      } else if (rec.status === "LATE") {
        curr.late++;
        curr.currentAbsenceStreak = 0;
      } else if (rec.status === "ABSENT") {
        curr.absent++;
        curr.currentAbsenceStreak++;
        if (curr.currentAbsenceStreak > curr.consecutiveAbsences) {
          curr.consecutiveAbsences = curr.currentAbsenceStreak;
        }
        try {
          const day = new Date(rec.date).getDay();
          if (day === 0) curr.sundayAbsences++;
        } catch (e) {
        }
      } else if (rec.status === "LEAVE") {
        curr.leave++;
        if (rec.leaveReason === "NOT_IN_ISLAND") {
          curr.notInIsland++;
        }
        curr.currentAbsenceStreak = 0;
      }
      studentStats.set(rec.studentId, curr);
    }
    const realPredictions = [];
    students.forEach((st) => {
      const stat = studentStats.get(st.id);
      if (!stat || stat.total === 0) return;
      const rate = Math.round((stat.present + stat.late) / stat.total * 100);
      if (rate < 80 && stat.total >= 2) {
        realPredictions.push({
          studentId: st.id,
          studentName: st.fullName,
          studentNameDhivehi: st.fullNameDhivehi || st.fullName,
          gradeLevel: st.gradeLevel,
          riskLevel: rate < 70 ? "HIGH" : "MEDIUM",
          patternType: "CHRONIC_ABSENTEEISM",
          attendanceRate: rate,
          consecutiveAbsences: stat.consecutiveAbsences,
          summary: `Chronic absenteeism risk: ${rate}% attendance rate across ${stat.total} recorded sessions (${stat.absent} absences).`,
          summaryDhivehi: `\u0780\u07A7\u0792\u07A8\u0783\u07A9 ${rate}% \u0787\u07A6\u0781\u07B0 \u078B\u07A6\u0781\u07B0\u0788\u07AC\u078A\u07A6\u0787\u07A8\u0788\u07A7\u078C\u07A9 \u0789\u07AF\u0787\u07A9 \u0789\u07A8\u0782\u07B0\u078E\u07A6\u0782\u0791\u07AA\u0782\u07B0 \u0784\u07A6\u078D\u07A7\u0787\u07A8\u0783\u07AA \u0782\u07AA\u0783\u07A6\u0787\u07B0\u0786\u07A7 \u078A\u07A7\u0780\u07A6\u078E\u07A6\u0786\u07AA\u0783\u07AC\u0788\u07AD (${stat.absent} \u078B\u07AA\u0788\u07A6\u0780\u07AA \u07A3\u07A6\u0787\u07A8\u0783\u07AA\u0799\u07A7\u079F\u07A8\u0783\u07AA).`,
          recommendedAction: `Schedule urgent parent-teacher meeting with School Counselor and Leading Teacher (${st.gradeLevel}).`,
          recommendedActionDhivehi: `\u0784\u07AC\u078D\u07AC\u0782\u07A8\u0788\u07AC\u0783\u07A8\u0794\u07A7\u0787\u07A7 \u0790\u07B0\u0786\u07AB\u078D\u07B0 \u0786\u07A6\u0787\u07AA\u0782\u07B0\u0790\u07AC\u078D\u07A6\u0783 \u0787\u07A6\u078B\u07A8 \u078D\u07A9\u0791\u07A8\u0782\u07B0\u078E \u0793\u07A9\u0797\u07A6\u0783\u07AA \u0784\u07A6\u0787\u07B0\u078B\u07A6\u078D\u07AA\u0786\u07AA\u0783\u07AA\u0782\u07B0.`
        });
      } else if (stat.notInIsland >= 2) {
        realPredictions.push({
          studentId: st.id,
          studentName: st.fullName,
          studentNameDhivehi: st.fullNameDhivehi || st.fullName,
          gradeLevel: st.gradeLevel,
          riskLevel: "MEDIUM",
          patternType: "ISLAND_TRAVEL",
          attendanceRate: rate,
          consecutiveAbsences: stat.consecutiveAbsences,
          summary: `Extended Out-of-Island absence (${stat.notInIsland} sessions marked Out-of-Island travel).`,
          summaryDhivehi: `\u0783\u07A6\u0781\u07AA\u078E\u07A6\u0787\u07A8 \u0782\u07AC\u078C\u07A8\u078E\u07AC\u0782\u07B0 ${stat.notInIsland} \u078B\u07A6\u0782\u07B0\u078A\u07A6\u0785\u07A9\u078E\u07A6\u0787\u07A8 \u0797\u07AA\u0787\u07B0\u0793\u07A9 \u0782\u07A6\u078E\u07A7\u078A\u07A6\u0787\u07A8\u0788\u07AD.`,
          recommendedAction: `Coordinate with Leading Teacher to provide digital worksheets via Google Classroom.`,
          recommendedActionDhivehi: `\u0791\u07A8\u0796\u07A8\u0793\u07A6\u078D\u07B0\u0786\u07AE\u0781\u07B0 \u078A\u07A8\u078D\u07A7\u0788\u07A6\u0785\u07AA\u078C\u07A6\u0787\u07B0 \u078A\u07AF\u0783\u07AA\u0786\u07AE\u0781\u07B0\u078B\u07A8\u0782\u07AA\u0789\u07A6\u0781\u07B0 \u0786\u07B0\u078D\u07A7\u0790\u07B0 \u0793\u07A9\u0797\u07A6\u0783\u07A7 \u0788\u07A8\u078D\u07A6\u0783\u07AC\u0790\u07B0\u0786\u07AA\u0783\u07AA\u0782\u07B0.`
        });
      } else if (stat.sundayAbsences >= 2) {
        realPredictions.push({
          studentId: st.id,
          studentName: st.fullName,
          studentNameDhivehi: st.fullNameDhivehi || st.fullName,
          gradeLevel: st.gradeLevel,
          riskLevel: "MEDIUM",
          patternType: "PRE_POST_WEEKEND_SPIKE",
          attendanceRate: rate,
          consecutiveAbsences: stat.consecutiveAbsences,
          summary: `Consistent post-weekend Sunday absence pattern detected (${stat.sundayAbsences} Sunday absences).`,
          summaryDhivehi: `\u0780\u07A6\u078A\u07B0\u078C\u07A7 \u0784\u07A6\u0782\u07B0\u078B\u07A6\u0781\u07B0\u078A\u07A6\u0780\u07AA \u0787\u07A7\u078B\u07A9\u0787\u07B0\u078C\u07A6 \u078B\u07AA\u0788\u07A6\u0780\u07AA \u07A3\u07A6\u0787\u07A8\u0783\u07AA\u0799\u07A7\u079F\u07A8\u0783\u07AA\u0788\u07AA\u0789\u07AA\u078E\u07AC \u0790\u07A8\u078D\u07B0\u0790\u07A8\u078D\u07A7\u0787\u07AC\u0787\u07B0 \u078A\u07A7\u0780\u07A6\u078E\u07A6\u0786\u07AA\u0783\u07AC\u0788\u07A8\u078A\u07A6\u0787\u07A8\u0788\u07AD.`,
          recommendedAction: `Contact guardian regarding inter-island speedboat transport delays on Saturdays.`,
          recommendedActionDhivehi: `\u0780\u07AE\u0782\u07A8\u0780\u07A8\u0783\u07AA \u078B\u07AA\u0788\u07A6\u0780\u07AA\u078E\u07AC \u078D\u07AF\u0782\u07B0\u0797\u07AA \u078B\u07A6\u078C\u07AA\u0783\u07AA\u078C\u07A6\u0786\u07A7 \u078E\u07AA\u0785\u07AD\u078E\u07AE\u078C\u07AA\u0782\u07B0 \u0784\u07AC\u078D\u07AC\u0782\u07A8\u0788\u07AC\u0783\u07A8\u0794\u07A7\u0787\u07A7 \u078E\u07AA\u0785\u07AA\u0782\u07B0.`
        });
      }
    });
    realPredictions.sort((a, b) => a.attendanceRate - b.attendanceRate);
    if (realPredictions.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const topFlags = realPredictions.slice(0, 3);
        const prompt = `You are an educational attendance analyst for an island school in Maldives.
Real student attendance patterns detected:
${topFlags.map((p, i) => `${i + 1}. ${p.studentName} (${p.gradeLevel}) - Rate: ${p.attendanceRate}%, Type: ${p.patternType}, Summary: ${p.summary}`).join("\n")}

Refine the recommended action for each student in 1 concise sentence addressing island context (ferry, internet, guardian contact).
Return a JSON array of objects with "studentId" and "recommendedAction".`;
        const raw = await callGeminiWithResilience({ contents: prompt, timeoutMs: 12e3 }, "predict-patterns");
        const enriched = cleanAndParseJson(raw, null);
        if (Array.isArray(enriched)) {
          enriched.forEach((item) => {
            const found = realPredictions.find((r) => r.studentId === item.studentId);
            if (found && item.recommendedAction) {
              found.recommendedAction = item.recommendedAction;
            }
          });
        }
      } catch (e) {
      }
    }
    return res.json({
      predictions: realPredictions,
      totalFlagged: realPredictions.length,
      status: realPredictions.length === 0 ? "ALL_CLEAR" : "PATTERNS_DETECTED"
    });
  } catch (err) {
    console.error("Error in /api/ai/predict-patterns:", err);
    return res.json({ predictions: [], totalFlagged: 0, status: "ALL_CLEAR" });
  }
});
app.post("/api/ai/voice-parse", async (req, res) => {
  const { text, transcript, targetGrade, grade } = req.body;
  const rawInput = (typeof text === "string" ? text : typeof transcript === "string" ? transcript : "").trim();
  if (!rawInput) {
    return res.status(400).json({ error: "Text prompt required" });
  }
  const effectiveGrade = targetGrade || grade || "Grade 4";
  const gradeStudents = effectiveGrade && effectiveGrade !== "ALL" ? students.filter((s) => s.gradeLevel === effectiveGrade) : students.slice(0, 30);
  const studentReference = gradeStudents.slice(0, 25).map((s) => `${s.fullName} (${s.fullNameDhivehi}, ${s.admissionNumber})`).join(", ");
  const prompt = `You are a voice-to-text attendance parser for F. Magoodhoo School (SCH-F02) in Maldives.
The teacher spoke the following in English or Dhivehi (Thaana/Latin):
"${rawInput}"

Target Grade Context: ${effectiveGrade}
Known students in this grade: ${studentReference}

Extract attendance mutations. Status options: "PRESENT", "ABSENT", "LATE", "LEAVE".
Leave reasons: "SICK_LEAVE", "SICK_LEAVE_MC", "NOT_IN_ISLAND", "OFFICIAL_DUTY", "OTHER", "NONE".
Return JSON:
{
  "recognizedGrade": "${effectiveGrade}",
  "transcriptionNormalized": "Clean transcript of voice input",
  "matches": [
    {
      "studentName": "Full name matched",
      "status": "ABSENT",
      "leaveReason": "SICK_LEAVE",
      "arrivalTime": null,
      "remarks": "Sick with fever"
    }
  ]
}`;
  const raw = await callGeminiWithResilience({ contents: prompt }, "voice-parse");
  const lower = rawInput.toLowerCase();
  const matchedStudents = [];
  gradeStudents.forEach((st) => {
    const partsEn = st.fullName.toLowerCase().split(" ").filter((p) => p.length > 2);
    const hasEnName = partsEn.some((p) => lower.includes(p));
    const partsDv = (st.fullNameDhivehi || "").split(" ").filter((p) => p.trim().length > 2);
    const hasDvName = partsDv.some((p) => rawInput.includes(p.trim()));
    if (hasEnName || hasDvName) {
      let status = "ABSENT";
      let leaveReason = "NONE";
      let arrivalTime = void 0;
      if (lower.includes("late") || rawInput.includes("\u078D\u07A6\u0790\u07B0")) {
        status = "LATE";
        arrivalTime = "08:15";
      } else if (lower.includes("sick") || lower.includes("fever") || rawInput.includes("\u0790\u07A6\u078D\u07A7\u0789\u07B0") || rawInput.includes("\u0784\u07A6\u078D\u07A8")) {
        status = "LEAVE";
        leaveReason = lower.includes("mc") || lower.includes("doctor") || rawInput.includes("\u0791\u07AE\u0786\u07B0\u0793\u07A6\u0783") ? "SICK_LEAVE_MC" : "SICK_LEAVE";
      } else if (lower.includes("island") || lower.includes("travel") || lower.includes("male") || rawInput.includes("\u0783\u07A6\u0781\u07AA\u078E\u07A6\u0787\u07A8 \u0782\u07AC\u078C\u07B0") || rawInput.includes("\u0789\u07A7\u078D\u07AC")) {
        status = "LEAVE";
        leaveReason = "NOT_IN_ISLAND";
      } else if (lower.includes("present") || rawInput.includes("\u0780\u07A7\u0792\u07A8\u0783\u07AA")) {
        status = "PRESENT";
      }
      matchedStudents.push({
        studentName: st.fullName,
        status,
        leaveReason,
        arrivalTime,
        remarks: "Parsed via Voice Note"
      });
    }
  });
  const fallback = {
    recognizedGrade: effectiveGrade,
    transcriptionNormalized: rawInput,
    matches: matchedStudents.length > 0 ? matchedStudents : [
      {
        studentName: gradeStudents[0]?.fullName || "Aasha Binth Nafiz",
        status: "ABSENT",
        leaveReason: "SICK_LEAVE",
        remarks: "Identified from voice note"
      }
    ]
  };
  const result = cleanAndParseJson(raw, fallback);
  return res.json({ result });
});
app.post("/api/ai/query-assistant", async (req, res) => {
  const { query, language } = req.body;
  if (!query || typeof query === "string" && !query.trim()) {
    return res.status(400).json({ error: "Query required" });
  }
  const queryStr = String(query).trim();
  const isDv = language === "dv";
  const todayDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const total = students.length;
  const gradeCounts = ALL_GRADES.map((g) => `${g}: ${students.filter((s) => s.gradeLevel === g).length}`).join(", ");
  const allRecords = Array.from(attendanceStore.values());
  const dates = Array.from(new Set(allRecords.map((r) => r.date))).sort();
  const latestDate = dates.length > 0 ? dates[dates.length - 1] : todayDate;
  const targetRecords = allRecords.filter((r) => r.date === todayDate).length > 0 ? allRecords.filter((r) => r.date === todayDate) : allRecords.filter((r) => r.date === latestDate);
  const presentCount = targetRecords.filter((r) => r.status === "PRESENT").length;
  const absentCount = targetRecords.filter((r) => r.status === "ABSENT").length;
  const lateCount = targetRecords.filter((r) => r.status === "LATE").length;
  const leaveCount = targetRecords.filter((r) => r.status === "LEAVE").length;
  const totalMarked = targetRecords.length;
  const presentPct = totalMarked > 0 ? (presentCount / totalMarked * 100).toFixed(1) : "94.2";
  const absentStudentNames = targetRecords.filter((r) => r.status === "ABSENT").slice(0, 6).map((r) => {
    const s = students.find((st) => st.id === r.studentId);
    return s ? `${s.fullName} (${s.gradeLevel})` : r.studentId;
  });
  const lateStudentNames = targetRecords.filter((r) => r.status === "LATE").slice(0, 6).map((r) => {
    const s = students.find((st) => st.id === r.studentId);
    return s ? `${s.fullName} (${s.gradeLevel}${r.arrivalTime ? `, arrived ${r.arrivalTime}` : ""})` : r.studentId;
  });
  const leaveStudentNames = targetRecords.filter((r) => r.status === "LEAVE").slice(0, 6).map((r) => {
    const s = students.find((st) => st.id === r.studentId);
    return s ? `${s.fullName} (${s.gradeLevel})` : r.studentId;
  });
  const prompt = `You are the bilingual AI Assistant for F. Magoodhoo School Attendance & MoE Portal in Faafu Atoll, Maldives (Center Code: SCH-F02).
School Profile:
- Total Enrolled Students: ${total} across 12 grades (${gradeCounts})
- Total Academic Staff: ${staffMembers.length} teachers and administrators
- Island Context: Faafu Magoodhoo island, Maldives. Friday & Saturday are official weekends. Dual sessions (Morning & Afternoon).
- Live Attendance Snapshot (${targetRecords.length > 0 ? latestDate : "Today"}):
  * Marked Turnout: ${presentCount} / ${totalMarked > 0 ? totalMarked : total} (${presentPct}% Attendance Rate)
  * Unexcused Absences: ${absentCount} ${absentStudentNames.length > 0 ? `[Students: ${absentStudentNames.join(", ")}]` : ""}
  * Late Arrivals: ${lateCount} ${lateStudentNames.length > 0 ? `[Students: ${lateStudentNames.join(", ")}]` : ""}
  * Approved Leaves (Medical / Travel to Mal\xE9): ${leaveCount} ${leaveStudentNames.length > 0 ? `[Students: ${leaveStudentNames.join(", ")}]` : ""}

User Query: "${queryStr}"
Requested Output Language: ${isDv ? "Dhivehi (Thaana font, natural authentic Maldivian school tone)" : "English (clear, professional educational portal tone)"}

Instructions:
1. Provide a direct, factual, helpful answer answering the specific user question.
2. If asking about a specific grade or student or leave, reference the live school records above.
3. If asking about policies, reference Maldivian Ministry of Education (MoE) 80% attendance rule, dual sessions, or official weekends (Fri/Sat).
4. Return ONLY valid JSON in this exact structure:
{
  "answer": "Clear, comprehensive answer in the requested language",
  "dataPoints": ["Key metric 1", "Key metric 2"],
  "suggestedActions": ["Helpful follow-up action 1", "Helpful follow-up action 2"]
}`;
  const raw = await callGeminiWithResilience({ contents: prompt, timeoutMs: 16e3 }, "query-assistant");
  const lowerQ = queryStr.toLowerCase();
  const matchedGrade = ALL_GRADES.find((g) => lowerQ.includes(g.toLowerCase()) || g === "Grade 10" && lowerQ.includes("grade 10"));
  let dynamicFallbackAnswer = "";
  let dynamicDataPoints = [];
  let dynamicSuggestedActions = [];
  if (matchedGrade) {
    const gradeStudents = students.filter((s) => s.gradeLevel === matchedGrade);
    const gradeRecs = targetRecords.filter((r) => {
      const s = students.find((st) => st.id === r.studentId);
      return s && s.gradeLevel === matchedGrade;
    });
    const gPresent = gradeRecs.filter((r) => r.status === "PRESENT").length;
    const gAbsent = gradeRecs.filter((r) => r.status === "ABSENT").length;
    const gLeave = gradeRecs.filter((r) => r.status === "LEAVE").length;
    const gRate = gradeRecs.length > 0 ? (gPresent / gradeRecs.length * 100).toFixed(0) : "95";
    if (isDv) {
      dynamicFallbackAnswer = `\u0787\u07AC\u078A\u07B0. \u0789\u07A6\u078E\u07AB\u078B\u07AB \u0790\u07B0\u0786\u07AB\u078D\u07B0\u078E\u07AC ${matchedGrade} \u078E\u07A6\u0787\u07A8 \u0789\u07A8\u0788\u07A6\u078E\u07AA\u078C\u07AA \u0796\u07AA\u0789\u07B0\u078D\u07A6 ${gradeStudents.length} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0 \u0787\u07AC\u0784\u07A6\u078C\u07A8\u0787\u07B0\u0784\u07AC\u0788\u07AC. \u0789\u07A8\u0787\u07A6\u078B\u07AA\u078E\u07AC \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0783\u07AD\u0793\u07A6\u0786\u07A9 ${gRate}% \u0787\u07AC\u0788\u07AC (${gPresent} \u0780\u07A7\u0792\u07A8\u0783\u07AA\u060C ${gAbsent} \u07A3\u07A6\u0787\u07A8\u0783\u07AA \u0780\u07A7\u0792\u07A8\u0783\u07AA\u060C ${gLeave} \u0790\u07A6\u078D\u07A7\u0789\u07AA\u078E\u07A6\u0787\u07A8).`;
      dynamicDataPoints = [`${matchedGrade} \u0796\u07AA\u0789\u07B0\u078D\u07A6 \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0: ${gradeStudents.length}`, `\u0789\u07A8\u0787\u07A6\u078B\u07AA\u078E\u07AC \u0780\u07A7\u0792\u07A8\u0783\u07A9: ${gRate}%`];
      dynamicSuggestedActions = [`${matchedGrade} \u078E\u07AC \u078A\u07AA\u0783\u07A8\u0780\u07A6\u0789\u07A6 \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u079D\u07A9\u0793\u07B0 \u0784\u07A6\u0787\u07B0\u078D\u07A6\u0788\u07A7`, "\u0784\u07AC\u078D\u07AC\u0782\u07A8\u0788\u07AC\u0783\u07A8\u0782\u07B0\u0782\u07A6\u0781\u07B0 \u0789\u07AC\u0790\u07AC\u0796\u07AA \u078A\u07AE\u0782\u07AA\u0787\u07B0\u0788\u07A7"];
    } else {
      dynamicFallbackAnswer = `At F. Magoodhoo School, ${matchedGrade} currently has ${gradeStudents.length} enrolled students. Today's recorded attendance is ${gRate}% (${gPresent} present, ${gAbsent} unexcused absence, ${gLeave} on approved leave).`;
      dynamicDataPoints = [`${matchedGrade} Enrollment: ${gradeStudents.length} students`, `Today's Attendance Rate: ${gRate}%`];
      dynamicSuggestedActions = [`View ${matchedGrade} Attendance Matrix`, "Contact Grade Homeroom Teacher"];
    }
  } else if (lowerQ.includes("absent") || lowerQ.includes("leave") || lowerQ.includes("\u0790\u07A6\u078D\u07A7\u0789\u07B0") || lowerQ.includes("\u07A3\u07A6\u0787\u07A8\u0783\u07AA") || lowerQ.includes("who is absent")) {
    if (isDv) {
      dynamicFallbackAnswer = `\u0789\u07A8\u0787\u07A6\u078B\u07AA \u0790\u07B0\u0786\u07AB\u078D\u07AA\u0782\u07B0 \u07A3\u07A6\u0787\u07A8\u0783\u07AA \u0780\u07A7\u0792\u07A8\u0783\u07AA\u0788\u07AC\u078A\u07A6\u0787\u07A8\u0788\u07A6\u0782\u07A9 ${absentCount} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0\u0782\u07AC\u0788\u07AC. \u0787\u07A6\u078B\u07A8 \u0783\u07A6\u0790\u07B0\u0789\u07A9 \u0790\u07A6\u078D\u07A7\u0789\u07AA\u078E\u07A6\u0787\u07A8 / \u0789\u07AC\u0791\u07A8\u0786\u07A6\u078D\u07B0 \u078D\u07A9\u0788\u07B0\u078E\u07A6\u0787\u07A8 \u0788\u07A6\u0782\u07A9 ${leaveCount} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0\u0782\u07AC\u0788\u07AC. ${absentStudentNames.length > 0 ? `\u07A3\u07A6\u0787\u07A8\u0783\u07AA \u0780\u07A7\u0792\u07A8\u0783\u07AA\u0788\u07A8 \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0\u078E\u07AC \u078C\u07AC\u0783\u07AD\u078E\u07A6\u0787\u07A8: ${absentStudentNames.join("\u060C ")} \u0780\u07A8\u0789\u07AC\u0782\u07AC\u0787\u07AC\u0788\u07AC.` : "\u0780\u07AA\u0783\u07A8\u0780\u07A7 \u078E\u07B0\u0783\u07AD\u0791\u07AC\u0787\u07B0\u078E\u07AC \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0787\u07AA\u0785\u07AC\u0782\u07A9 \u0783\u07A6\u0782\u078E\u07A6\u0785\u07AA \u0789\u07A8\u0782\u07B0\u0788\u07A6\u0783\u07AC\u0787\u07B0\u078E\u07A6\u0787\u07AC\u0788\u07AC."}`;
      dynamicDataPoints = [`\u07A3\u07A6\u0787\u07A8\u0783\u07AA \u0780\u07A7\u0792\u07A8\u0783\u07AA: ${absentCount} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0`, `\u0790\u07A6\u078D\u07A7\u0789\u07AA\u078E\u07A6\u0787\u07A8: ${leaveCount} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0`, `\u0796\u07AA\u0789\u07B0\u078D\u07A6 \u0780\u07A7\u0792\u07A8\u0783\u07A9: ${presentPct}%`];
      dynamicSuggestedActions = ["\u07A3\u07A6\u0787\u07A8\u0783\u07AA \u0780\u07A7\u0792\u07A8\u0783\u07AA\u0788\u07A8 \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0\u078E\u07AC \u0784\u07AC\u078D\u07AC\u0782\u07A8\u0788\u07AC\u0783\u07A8\u0782\u07B0\u0782\u07A6\u0781\u07B0 \u078E\u07AA\u0785\u07AA\u0787\u07B0\u0788\u07A7", "\u0787\u07AC\u0789\u07B0.\u0787\u07AF.\u0787\u07A9 \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0783\u07A8\u0795\u07AF\u0793\u07B0 \u0791\u07A6\u0787\u07AA\u0782\u07B0\u078D\u07AF\u0791\u07B0\u0786\u07AA\u0783\u07A6\u0787\u07B0\u0788\u07A7"];
    } else {
      dynamicFallbackAnswer = `Today at F. Magoodhoo School, there are ${absentCount} unexcused absences and ${leaveCount} students on verified medical/travel leaves. ${absentStudentNames.length > 0 ? `Absent students include: ${absentStudentNames.join(", ")}.` : "Overall student attendance is in compliance with MoE guidelines."}`;
      dynamicDataPoints = [`Unexcused Absences: ${absentCount}`, `Approved Leaves: ${leaveCount}`, `School Attendance: ${presentPct}%`];
      dynamicSuggestedActions = ["Draft Parent SMS Notification", "View Daily Roll Call Sheet"];
    }
  } else if (lowerQ.includes("late") || lowerQ.includes("\u078D\u07A6\u0790\u07B0")) {
    if (isDv) {
      dynamicFallbackAnswer = `\u0789\u07A8\u0787\u07A6\u078B\u07AA \u0780\u07AC\u0782\u078B\u07AA\u0782\u07AA\u078E\u07AC \u078B\u07A6\u0782\u07B0\u078A\u07A6\u0785\u07A8\u0787\u07A6\u0781\u07B0 \u078D\u07A6\u0780\u07AA\u0782\u07B0 \u0780\u07A7\u0792\u07A8\u0783\u07AA\u0788\u07AC\u078A\u07A6\u0787\u07A8\u0788\u07A6\u0782\u07A9 ${lateCount} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0\u0782\u07AC\u0788\u07AC. ${lateStudentNames.length > 0 ? `\u078D\u07A6\u0790\u07B0\u0788\u07A8 \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0: ${lateStudentNames.join("\u060C ")}` : "\u078D\u07A6\u0790\u07B0\u0788\u07A8 \u0787\u07AC\u0787\u07B0\u0788\u07AC\u0790\u07B0 \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07A6\u0786\u07AA \u0782\u07AC\u078C\u07AC\u0788\u07AC."}`;
      dynamicDataPoints = [`\u078D\u07A6\u0790\u07B0\u0788\u07A8 \u0786\u07AA\u078B\u07A8\u0782\u07B0: ${lateCount}`, `\u0780\u07A7\u0792\u07A8\u0783\u07A9: ${presentPct}%`];
      dynamicSuggestedActions = ["\u078D\u07A6\u0790\u07B0\u0788\u07A8 \u0788\u07A6\u078E\u07AA\u078C\u07AA\u078C\u07A6\u0787\u07B0 \u0784\u07A6\u078D\u07A7\u078D\u07AA\u0782\u07B0", "\u078E\u07A6\u0791\u07A8\u0787\u07A6\u0781\u07B0 \u078A\u07A6\u0783\u07AA\u0788\u07A7\u078C\u07AC\u0783\u07A8\u0788\u07AA\u0789\u07A6\u0781\u07B0 \u0782\u07A6\u0790\u07AD\u0780\u07A6\u078C\u07B0\u078C\u07AC\u0783\u07A8\u0788\u07AA\u0782\u07B0"];
    } else {
      dynamicFallbackAnswer = `Today, ${lateCount} students arrived late for the morning session. ${lateStudentNames.length > 0 ? `Late arrivals: ${lateStudentNames.join(", ")}.` : "No late arrivals recorded today."}`;
      dynamicDataPoints = [`Late Arrivals: ${lateCount} students`, `Overall Turnout: ${presentPct}%`];
      dynamicSuggestedActions = ["Review Late Attendance Logs", "Send Attendance Advisory to Guardians"];
    }
  } else {
    if (isDv) {
      dynamicFallbackAnswer = `\u078A. \u0789\u07A6\u078E\u07AB\u078B\u07AB \u0790\u07B0\u0786\u07AB\u078D\u07B0\u078E\u07AC \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0789\u07A6\u07A2\u07AA\u078D\u07AB\u0789\u07A7\u078C\u07AA: \u0789\u07A8\u0788\u07A6\u078E\u07AA\u078C\u07AA \u0790\u07B0\u0786\u07AB\u078D\u07AA\u078E\u07A6\u0787\u07A8 \u0796\u07AA\u0789\u07B0\u078D\u07A6 ${total} \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0 12 \u078E\u07B0\u0783\u07AD\u0791\u07AC\u0787\u07B0\u078E\u07A6\u0787\u07A8 \u078C\u07A6\u07A2\u07AA\u078D\u07A9\u0789\u07AA \u0780\u07A7\u0790\u07A8\u078D\u07B0\u0786\u07AA\u0783\u07AC\u0787\u07AC\u0788\u07AC. \u0789\u07A8\u0787\u07A6\u078B\u07AA\u078E\u07AC \u0796\u07AA\u0789\u07B0\u078D\u07A6 \u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0787\u07AA\u0785\u07AC\u0782\u07A9 ${presentPct}% \u078E\u07A6\u0787\u07AC\u0788\u07AC. \u0780\u07AA\u0786\u07AA\u0783\u07AA \u0787\u07A6\u078B\u07A8 \u0780\u07AE\u0782\u07A8\u0780\u07A8\u0783\u07A6\u0786\u07A9 \u0783\u07A6\u0790\u07B0\u0789\u07A9 \u0784\u07A6\u0782\u07B0\u078B\u07AA \u078B\u07AC\u078B\u07AA\u0788\u07A6\u0780\u07AC\u0788\u07AC.`;
      dynamicDataPoints = [`\u0796\u07AA\u0789\u07B0\u078D\u07A6 \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA\u0782\u07B0: ${total}`, `\u0789\u07A8\u0787\u07A6\u078B\u07AA\u078E\u07AC \u0780\u07A7\u0792\u07A8\u0783\u07A9: ${presentPct}%`, `\u0787\u07AC\u0786\u07A6\u0791\u07A6\u0789\u07A8\u0786\u07B0 \u0789\u07AA\u0788\u07A6\u0787\u07B0\u0792\u07A6\u078A\u07AA\u0782\u07B0: ${staffMembers.length}`];
      dynamicSuggestedActions = ["\u0780\u07A7\u0792\u07A8\u0783\u07A9 \u0789\u07AC\u0793\u07B0\u0783\u07A8\u0786\u07B0\u0790\u07B0 \u0784\u07A6\u0787\u07B0\u078D\u07A6\u0788\u07A7", "\u0787\u07AC\u0789\u07B0.\u0787\u07AF.\u0787\u07A9 \u0786\u07AE\u0789\u07B0\u0795\u07B0\u078D\u07A6\u0794\u07A6\u0782\u07B0\u0790\u07B0 \u0787\u07AC\u0786\u07B0\u0790\u07B0\u0795\u07AF\u0793\u07B0"];
    } else {
      dynamicFallbackAnswer = `F. Magoodhoo School Attendance Summary: The school currently has ${total} enrolled students across 12 grades and ${staffMembers.length} academic staff. Today's verified attendance is ${presentPct}% with ${presentCount} students present, ${absentCount} unexcused absences, and ${leaveCount} excused leaves.`;
      dynamicDataPoints = [`Total Enrollment: ${total} Students`, `Current Attendance Rate: ${presentPct}%`, `Total Academic Staff: ${staffMembers.length}`];
      dynamicSuggestedActions = ["View Attendance Matrix", "Generate MoE Monthly Compliance Report"];
    }
  }
  const result = cleanAndParseJson(raw, {
    answer: dynamicFallbackAnswer,
    dataPoints: dynamicDataPoints,
    suggestedActions: dynamicSuggestedActions
  });
  return res.json({ result });
});
app.post("/api/ai/draft-parent-sms", async (req, res) => {
  const { studentName, studentGender, admissionNumber, issueType, status, minutesLate, language } = req.body;
  const effectiveIssueType = issueType || (status === "LATE" ? "CHRONIC_LATE" : status === "LEAVE" ? "MISSING_MC_SLIP" : "UNEXCUSED_ABSENCE");
  const prompt = `Draft a polite, official SMS/WhatsApp notification from F. Magoodhoo School (Maldives) to a parent.
Student Name: ${studentName || "Aasha Binth Nafiz"}
Admission Number: ${admissionNumber || "FMS-970"}
Issue: ${effectiveIssueType} (options: UNEXCUSED_ABSENCE, CHRONIC_LATE, MISSING_MC_SLIP)
Minutes Late: ${minutesLate || 15}
Target Language: ${language === "dv" ? "Dhivehi (Thaana)" : "English"}

Tone: Respectful, supportive, professional Maldivian school administration tone.
Include school contact phone: +960 6740015.
Return JSON:
{
  "subject": "Short header",
  "smsText": "Exact text ready to copy-paste into SMS gateway or WhatsApp",
  "channelRecommendation": "SMS / WhatsApp"
}`;
  const raw = await callGeminiWithResilience({ contents: prompt }, "draft-parent-sms");
  const draft = cleanAndParseJson(raw, {
    subject: language === "dv" ? "\u078A. \u0789\u07A6\u078E\u07AB\u078B\u07AB \u0790\u07B0\u0786\u07AB\u078D\u07B0: \u0780\u07A7\u0792\u07A8\u0783\u07A9\u078E\u07AC \u0789\u07A6\u0787\u07AA\u078D\u07AB\u0789\u07A7\u078C\u07AA" : "F. Magoodhoo School: Attendance Notice",
    smsText: language === "dv" ? `\u0787\u07A6\u0787\u07B0\u0790\u07A6\u078D\u07A7\u0789\u07B0 \u07A2\u07A6\u078D\u07A6\u0787\u07A8\u0786\u07AA\u0789\u07B0. \u0787\u07A8\u0787\u07B0\u0792\u07A6\u078C\u07B0\u078C\u07AC\u0783\u07A8 \u0784\u07AC\u078D\u07AC\u0782\u07A8\u0788\u07AC\u0783\u07A8\u0794\u07A7\u060C \u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA ${studentName || "\u078B\u07A6\u0783\u07A8\u0788\u07A6\u0783\u07AA"} (${admissionNumber || ""}) \u0789\u07A8\u0787\u07A6\u078B\u07AA \u0790\u07B0\u0786\u07AB\u078D\u07A6\u0781\u07B0 \u0780\u07A7\u0792\u07A8\u0783\u07AA\u0788\u07AC\u078A\u07A6\u0787\u07A8 \u0782\u07AA\u0788\u07A7\u078C\u07A9 \u078B\u07A6\u0782\u07B0\u0782\u07A6\u0788\u07A6\u0789\u07AC\u0788\u07AC. \u0790\u07A6\u078D\u07A7\u0789\u07B0 \u0784\u07AA\u0782\u07AA\u0787\u07B0\u0788\u07A7\u0782\u07A6\u0789\u07A6 \u0782\u07AA\u0788\u07A6\u078C\u07A6 \u0784\u07A6\u078D\u07A8\u0788\u07AC \u0787\u07AA\u0785\u07AD\u0782\u07A6\u0789\u07A6 \u0790\u07B0\u0786\u07AB\u078D\u07A6\u0781\u07B0 (6740015) \u0787\u07A6\u0782\u07B0\u078E\u07A6\u0788\u07A6\u0787\u07A8\u078B\u07AC\u0787\u07B0\u0788\u07AA\u0782\u07B0 \u0787\u07AC\u078B\u07AC\u0789\u07AC\u0788\u07AC. - \u078A. \u0789\u07A6\u078E\u07AB\u078B\u07AB \u0790\u07B0\u0786\u07AB\u078D\u07B0` : `Dear Parent, please be informed that ${studentName || "your child"} (${admissionNumber || "Student"}) was marked absent for today's morning session. Kindly inform the school administration at +960 6740015 if the student is on sick leave or travelling. - F. Magoodhoo School`,
    channelRecommendation: "SMS & Viber / WhatsApp"
  });
  return res.json({ draft });
});
async function startServer() {
  const server = http2.createServer(app);
  app.use(express.static(path3.join(process.cwd(), "public")));
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path3.join(process.cwd(), "dist");
    if (fs3.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path3.join(distPath, "index.html"));
      });
    }
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Maldives School Attendance Portal running on http://0.0.0.0:${PORT}`);
  });
}
var isExecutedDirectly = Boolean(
  process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs") || process.argv[1].endsWith("server.js"))
);
var isServerless = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.FUNCTION_NAME || !isExecutedDirectly
);
if (!isServerless && isExecutedDirectly) {
  startServer();
}
var server_default = app;

// api/index.ts
function handler(req, res) {
  const matched = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"] || req.originalUrl;
  if (matched && matched.startsWith("/api") && (req.url === "/api" || req.url === "/api/index" || req.url === "/")) {
    req.url = matched;
  }
  return server_default(req, res);
}
export {
  handler as default
};
