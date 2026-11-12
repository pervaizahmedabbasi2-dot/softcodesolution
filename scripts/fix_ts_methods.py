with open('frontend/src/app/dashboard/school-dashboard/school-dashboard.component.ts', 'r') as f:
    content = f.read()

start_idx = content.find('exportBankSalaryAdviceCSV')
end_idx = content.find('  deleteStaffPayroll(p: StaffPayrollRecord) {')

clean_code = """exportBankSalaryAdviceCSV(selectedMonth?: string): void {
    const records = selectedMonth && selectedMonth !== 'All'
      ? this.staffPayrolls.filter(p => p.month === selectedMonth)
      : this.staffPayrolls;

    if (!records.length) {
      this.showToast('No payroll records found to export', 'warning');
      return;
    }

    const headers = [
      'Sr No',
      'Employee ID',
      'Staff Full Name',
      'Designation / Role',
      'Payroll Month',
      'Base Salary (PKR)',
      'Allowances (PKR)',
      'Deductions (PKR)',
      'Net Payable (PKR)',
      'Payment Status',
      'Payment Method',
      'Disbursed Date',
      'Bank Transfer Advice Ref'
    ];

    const rows = records.map((p, idx) => [
      idx + 1,
      '"' + (p.staffId || ('STF-' + (100 + idx))) + '"',
      '"' + p.staffName + '"',
      '"' + p.role + '"',
      '"' + p.month + '"',
      p.baseSalary,
      p.allowances,
      p.deductions,
      p.netPayable,
      '"' + p.status + '"',
      '"' + (p.paymentMethod || 'Bank Transfer') + '"',
      '"' + (p.disbursedDate || 'Pending') + '"',
      '"SC-SAL-' + (p.month ? p.month.replace(/[^a-zA-Z0-9]/g, '') : '2026') + '-' + (p.staffId || (idx + 1)) + '"'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = 'Bank_Salary_Advice_' + (selectedMonth || 'Batch').replace(/\\s+/g, '_') + '_2026.csv';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast('Bank Salary Advice exported (' + records.length + ' records in Meezan/HBL corporate batch format)', 'success');
  }

  applyDutyPreset(title: string, priority: 'High Priority' | 'Urgent' | 'Routine' = 'High Priority'): void {
    if (!this.newTaskForm) {
      this.newTaskForm = {
        assignedTeacher: 'Prof. Rehan Alvi',
        department: 'Department of Physical Sciences',
        taskTitle: '',
        description: '',
        priority: 'High Priority',
        dueDate: '2026-10-30'
      };
    }
    this.newTaskForm.taskTitle = title;
    this.newTaskForm.priority = priority;
    this.newTaskForm.description = 'Campus operational discipline & supervision roster duty as assigned by Principal Office.';
    this.showToast('Applied duty preset: ' + title, 'info');
  }

  broadcastHomeworkToParents(hwId: string): void {
    const hw = this.teacherHomeworks.find(h => h.id === hwId);
    if (hw) {
      this.showToast('Digital Diary & Homework for "' + hw.title + '" broadcasted to all parents via Mobile App & SMS!', 'success');
    }
  }

  slcSearchQuery: string = '';
  get filteredStudentLeavingCertificates(): StudentLeavingCertificateRecord[] {
    const q = this.slcSearchQuery?.toLowerCase()?.trim() || '';
    if (!q) return this.studentLeavingCertificates;
    return this.studentLeavingCertificates.filter(slc => 
      slc.studentName?.toLowerCase()?.includes(q) ||
      slc.certificateNo?.toLowerCase()?.includes(q) ||
      slc.rollNo?.toLowerCase()?.includes(q) ||
      slc.grade?.toLowerCase()?.includes(q) ||
      slc.fatherName?.toLowerCase()?.includes(q)
    );
  }

  """

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + clean_code + content[end_idx:]
    with open('frontend/src/app/dashboard/school-dashboard/school-dashboard.component.ts', 'w') as f:
        f.write(content)
    print('Cleanly replaced methods in TS')
else:
    print('Indexes not found:', start_idx, end_idx)
