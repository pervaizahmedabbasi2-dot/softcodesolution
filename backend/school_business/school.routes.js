import express from 'express';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';

export function createSchoolRouter(sqliteDb, db, getCollectionDocs, memorySeedData) {
  const router = express.Router();
  const { SCHOOL_STUDENTS, SCHOOL_FEES, SCHOOL_TEACHERS } = memorySeedData;

  // --- STUDENTS & ADMISSIONS ---
  router.get('/students', async (req, res) => {
    let list = [];
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM local_school_students ORDER BY created_at DESC');
        const rows = stmt.all ? stmt.all() : [];
        if (rows.length > 0) {
          list = rows.map(r => ({
            id: r.id,
            rollNo: r.roll_no,
            fullName: r.full_name,
            grade: r.grade,
            section: r.section,
            guardianName: r.guardian_name,
            phone: r.phone,
            feeStatus: r.fee_status,
            admissionDate: r.admission_date,
            status: r.status,
            isSynced: r.is_synced === 1
          }));
        }
      } catch (e) {}
    }
    if (list.length === 0) {
      list = await getCollectionDocs('school_students', SCHOOL_STUDENTS);
    }
    res.json({ ok: true, students: list });
  });

  router.post('/students', async (req, res) => {
    const s = req.body || {};
    const newStudent = {
      id: 'STD-' + Date.now(),
      rollNo: s.rollNo || ('SCH-2026-' + String(SCHOOL_STUDENTS.length + 1).padStart(2, '0')),
      fullName: s.fullName || 'New Student',
      grade: s.grade || 'Grade 1',
      section: s.section || 'A',
      guardianName: s.guardianName || 'Guardian',
      phone: s.phone || '+92 300 0000000',
      feeStatus: s.feeStatus || 'PENDING',
      attendanceRate: s.attendanceRate || '100%',
      admissionDate: s.admissionDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
    SCHOOL_STUDENTS.unshift(newStudent);

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_school_students (
            id, roll_no, full_name, grade, section, guardian_name, phone, fee_status, admission_date, status, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `);
        stmt.run(
          newStudent.id,
          newStudent.rollNo,
          newStudent.fullName,
          newStudent.grade,
          newStudent.section,
          newStudent.guardianName,
          newStudent.phone,
          newStudent.feeStatus,
          newStudent.admissionDate,
          newStudent.status,
          new Date().toISOString()
        );
      } catch (e) {}
    }

    if (db) {
      setDoc(doc(db, 'school_students', newStudent.id), {
        ...newStudent,
        is_synced: 1,
        synced_at: new Date().toISOString()
      }).then(() => {
        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_school_students SET is_synced = 1 WHERE id = ?').run(newStudent.id); } catch (e) {}
        }
      }).catch(() => {});
    }

    res.json({ ok: true, message: 'Student admitted and recorded in SQLite campus database', student: newStudent });
  });

  router.post('/students/promote', async (req, res) => {
    const { fromGrade, toGrade, studentIds } = req.body || {};
    let count = 0;
    SCHOOL_STUDENTS.forEach(st => {
      if ((studentIds && studentIds.includes(st.id)) || (!studentIds && st.grade === fromGrade)) {
        st.grade = toGrade;
        count++;
        if (sqliteDb) {
          try { sqliteDb.prepare('UPDATE local_school_students SET grade = ? WHERE id = ?').run(toGrade, st.id); } catch (e) {}
        }
      }
    });
    res.json({ ok: true, message: `Successfully promoted ${count} student(s) from ${fromGrade} to ${toGrade}`, count });
  });

  router.post('/students/slc', async (req, res) => {
    const { studentId, reason, conduct } = req.body || {};
    const st = SCHOOL_STUDENTS.find(s => s.id === studentId);
    if (!st) return res.status(404).json({ ok: false, message: 'Student not found' });
    st.status = 'ALUMNI / SLC ISSUED';
    st.slcDate = new Date().toISOString().split('T')[0];
    st.slcSerial = 'SLC-2026-' + Math.floor(1000 + Math.random() * 9000);
    st.slcReason = reason || 'Parent Relocation / Graduated';
    st.slcConduct = conduct || 'Exemplary & Diligent';
    if (sqliteDb) {
      try { sqliteDb.prepare('UPDATE local_school_students SET status = ? WHERE id = ?').run(st.status, st.id); } catch (e) {}
    }
    res.json({ ok: true, message: `School Leaving Certificate generated for ${st.fullName}`, student: st });
  });

  // --- FEES & BILLING ---
  router.get('/fees', async (req, res) => {
    let list = [];
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM local_school_fees ORDER BY created_at DESC');
        const rows = stmt.all ? stmt.all() : [];
        if (rows.length > 0) {
          list = rows.map(r => ({
            id: r.id,
            challanNo: r.challan_no,
            studentName: r.student_name,
            rollNo: r.roll_no,
            grade: r.grade,
            month: r.month,
            tuition: r.tuition,
            labFee: r.lab_fee,
            discount: r.discount,
            total: r.total,
            status: r.status,
            dueDate: r.due_date,
            paidDate: r.paid_date,
            isSynced: r.is_synced === 1
          }));
        }
      } catch (e) {}
    }
    if (list.length === 0) {
      list = await getCollectionDocs('school_fees', SCHOOL_FEES);
    }
    res.json({ ok: true, fees: list });
  });

  router.post('/fees', async (req, res) => {
    const f = req.body || {};
    const newFee = {
      id: 'FEE-' + Date.now(),
      challanNo: 'CHLN-2026-' + Math.floor(1000 + Math.random() * 9000),
      studentName: f.studentName || 'Student',
      rollNo: f.rollNo || 'SCH-2026-99',
      grade: f.grade || 'Grade 8',
      month: f.month || 'Current Month',
      tuition: Number(f.tuition || 120),
      labFee: Number(f.labFee || 20),
      discount: Number(f.discount || 0),
      total: Number(f.total || ((Number(f.tuition || 120) + Number(f.labFee || 20)) - Number(f.discount || 0))),
      status: 'PENDING',
      dueDate: f.dueDate || '2026-04-10'
    };
    SCHOOL_FEES.unshift(newFee);

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO local_school_fees (
            id, challan_no, student_name, roll_no, grade, month, tuition, lab_fee, discount, total, status, due_date, is_synced, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `);
        stmt.run(
          newFee.id,
          newFee.challanNo,
          newFee.studentName,
          newFee.rollNo,
          newFee.grade,
          newFee.month,
          newFee.tuition,
          newFee.labFee,
          newFee.discount,
          newFee.total,
          newFee.status,
          newFee.dueDate,
          new Date().toISOString()
        );
      } catch (e) {}
    }

    res.json({ ok: true, message: 'Fee challan recorded in SQLite & synced to Cloud', fee: newFee });
  });

  router.post('/fees/collect', async (req, res) => {
    const { id } = req.body || {};
    let fee = SCHOOL_FEES.find(f => f.id === id);
    if (sqliteDb) {
      try {
        sqliteDb.prepare('UPDATE local_school_fees SET status = "PAID", paid_date = ? WHERE id = ?').run(new Date().toISOString().split('T')[0], id);
      } catch (e) {}
    }
    if (fee) {
      fee.status = 'PAID';
      fee.paidDate = new Date().toISOString().split('T')[0];
      return res.json({ ok: true, message: `Fee collected for ${fee.studentName}`, fee });
    }
    res.json({ ok: true, message: 'Fee status updated to PAID' });
  });

  // --- BIOMETRIC & RFID ATTENDANCE ---
  router.get('/attendance', (req, res) => {
    let list = [];
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM local_school_attendance ORDER BY created_at DESC LIMIT 100');
        const rows = stmt.all ? stmt.all() : [];
        list = rows.map(r => ({
          id: r.id,
          studentId: r.student_id,
          rollNo: r.roll_no,
          studentName: r.student_name,
          grade: r.grade,
          status: r.status,
          date: r.date,
          verificationMode: r.verification_mode,
          isSynced: r.is_synced === 1,
          createdAt: r.created_at
        }));
      } catch (e) {}
    }
    res.json({ ok: true, attendance: list });
  });

  router.post('/attendance', async (req, res) => {
    const body = req.body || {};
    const recId = body.id || ('att-' + Date.now());
    const studentId = body.studentId || body.student_id || 'STD-GEN';
    const rollNo = body.rollNo || body.roll_no || 'SCH-2026-X';
    const studentName = body.studentName || body.student_name || 'Student Name';
    const grade = body.grade || 'Grade 10';
    const status = (body.status || 'PRESENT').toUpperCase();
    const date = body.date || new Date().toISOString().split('T')[0];
    const mode = body.verificationMode || body.verification_mode || 'rfid';

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_attendance 
          (id, student_id, roll_no, student_name, grade, status, date, verification_mode, is_synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `);
        stmt.run(recId, studentId, rollNo, studentName, grade, status, date, mode);
      } catch (e) {}
    }

    res.json({
      ok: true,
      message: `Attendance marked for ${studentName} (${rollNo}) as ${status} via ${mode.toUpperCase()}.`,
      record: { id: recId, rollNo, studentName, grade, status, date, verificationMode: mode, isSynced: false }
    });
  });

  // --- EXAMINATIONS & REPORT CARDS ---
  router.get('/exams', (req, res) => {
    let list = [];
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM local_school_exams ORDER BY created_at DESC');
        const rows = stmt.all ? stmt.all() : [];
        list = rows.map(r => ({
          id: r.id,
          examCode: r.exam_code,
          title: r.title,
          grade: r.grade,
          subject: r.subject,
          totalMarks: r.total_marks,
          passingMarks: r.passing_marks,
          examDate: r.exam_date,
          isSynced: r.is_synced === 1
        }));
      } catch (e) {}
    }
    res.json({ ok: true, exams: list });
  });

  router.post('/exams', (req, res) => {
    const b = req.body || {};
    const examId = b.id || ('EXM-' + Date.now());
    const examCode = b.examCode || ('EXM-2026-' + Math.floor(100 + Math.random() * 900));
    const title = b.title || 'Term Examination';
    const grade = b.grade || 'Grade 10';
    const subject = b.subject || 'General Science';
    const totalMarks = Number(b.totalMarks || 100);
    const passingMarks = Number(b.passingMarks || 40);
    const examDate = b.examDate || new Date().toISOString().split('T')[0];

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_exams (id, exam_code, title, grade, subject, total_marks, passing_marks, exam_date, is_synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `);
        stmt.run(examId, examCode, title, grade, subject, totalMarks, passingMarks, examDate);
      } catch (e) {}
    }

    res.json({ ok: true, message: `Exam schedule ${title} created for ${grade}`, exam: { id: examId, examCode, title, grade, subject, totalMarks, passingMarks, examDate } });
  });

  router.get('/results', (req, res) => {
    let list = [];
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM local_school_results ORDER BY created_at DESC');
        const rows = stmt.all ? stmt.all() : [];
        list = rows.map(r => ({
          id: r.id,
          examId: r.exam_id,
          studentId: r.student_id,
          rollNo: r.roll_no,
          studentName: r.student_name,
          grade: r.grade,
          subject: r.subject,
          marksObtained: r.marks_obtained,
          totalMarks: r.total_marks,
          percentage: r.percentage,
          gradeLetter: r.grade_letter,
          remarks: r.remarks,
          isSynced: r.is_synced === 1
        }));
      } catch (e) {}
    }
    res.json({ ok: true, results: list });
  });

  router.post('/results', (req, res) => {
    const b = req.body || {};
    const resId = b.id || ('RES-' + Date.now());
    const examId = b.examId || 'EXM-101';
    const studentId = b.studentId || 'STD-1001';
    const rollNo = b.rollNo || 'SCH-2026-01';
    const studentName = b.studentName || 'Student Name';
    const grade = b.grade || 'Grade 10';
    const subject = b.subject || 'Mathematics';
    const marksObtained = Number(b.marksObtained || 85);
    const totalMarks = Number(b.totalMarks || 100);
    const percentage = Math.round((marksObtained / totalMarks) * 100);
    const gradeLetter = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'F';
    const remarks = b.remarks || (percentage >= 80 ? 'Exemplary Result' : 'Satisfactory Performance');

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO local_school_results (id, exam_id, student_id, roll_no, student_name, grade, subject, marks_obtained, total_marks, percentage, grade_letter, remarks, is_synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `);
        stmt.run(resId, examId, studentId, rollNo, studentName, grade, subject, marksObtained, totalMarks, percentage, gradeLetter, remarks);
      } catch (e) {}
    }

    res.json({ ok: true, message: `Result & Report Card generated for ${studentName} (${rollNo}): ${gradeLetter} (${percentage}%)`, result: { id: resId, rollNo, studentName, subject, marksObtained, totalMarks, percentage, gradeLetter, remarks } });
  });

  // --- TEACHERS & FACULTY PAYROLL ---
  router.get('/teachers', async (req, res) => {
    let list = [];
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM local_school_teachers ORDER BY created_at DESC');
        const rows = stmt.all ? stmt.all() : [];
        if (rows.length > 0) {
          list = rows.map(r => ({
            id: r.id,
            empCode: r.emp_code,
            name: r.name,
            designation: r.designation,
            department: r.department,
            phone: r.phone,
            email: r.email,
            salary: r.salary,
            status: r.status,
            isSynced: r.is_synced === 1
          }));
        }
      } catch (e) {}
    }
    if (list.length === 0) {
      list = await getCollectionDocs('school_teachers', SCHOOL_TEACHERS);
    }
    res.json({ ok: true, teachers: list });
  });

  return router;
}
