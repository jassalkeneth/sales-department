import React, { useState, useMemo } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { StudentEnrollment } from '../types';
import {
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';
import { SortableTableHeader } from './SortableTableHeader';
import { useSortableData } from '../hooks/useSortableData';

export const StudentAttributionLedger: React.FC = () => {
  const {
    students,
    payments,
    closers,
    filteredVerifiedPayments,
    filter,
    setFilter,
    resetFilters,
    programOptions
  } = useSalesWorkflow();

  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollment | null>(null);

  // Sales owns a read-only view of premium students with verified Finance activity.
  const studentRows = useMemo(() => {
    return students
      .filter((student) => student.tier === 'Premium' || student.tier === 'Elite Cohort')
      .map((stu) => {
      const verifiedPayments = filteredVerifiedPayments.filter((payment) => payment.studentId === stu.id);
      const verifiedCollected = verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0);

      const closer = closers.find((c) => c.id === stu.assignedCloserId) || closers[0];

      // Get latest verified date
      const latestVerifiedPayment = verifiedPayments
        .filter((p) => p.verifiedAt)
        .sort((a, b) => new Date(b.verifiedAt!).getTime() - new Date(a.verifiedAt!).getTime())[0];

      return {
        student: stu,
        closer,
        verifiedPayments,
        verifiedCollected,
        latestVerifiedAt: latestVerifiedPayment?.verifiedAt || null,
        isEligibleForSales: verifiedCollected > 0
      };
    })
      .filter((row) => row.isEligibleForSales);
  }, [students, filteredVerifiedPayments, closers]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return studentRows.filter((row) => {
      if (filter.closerId !== 'all' && row.closer.id !== filter.closerId) return false;
      if (filter.program !== 'all' && row.student.program !== filter.program) return false;
      if (filter.searchQuery.trim() !== '') {
        const q = filter.searchQuery.toLowerCase();
        const matchesName = row.student.fullName.toLowerCase().includes(q);
        const matchesCloser = row.closer.name.toLowerCase().includes(q);
        const matchesProgram = row.student.program.toLowerCase().includes(q);
        const matchesEmail = row.student.email.toLowerCase().includes(q);
        if (!matchesName && !matchesCloser && !matchesProgram && !matchesEmail) return false;
      }

      return true;
    });
  }, [studentRows, filter]);

  const {
    sortedItems: sortedStudentRows,
    sortConfig: studentSortConfig,
    requestSort: sortStudents
  } = useSortableData(filteredRows, {
    student: (row) => row.student.fullName,
    enrolledAt: (row) => new Date(row.student.enrolledAt),
    closer: (row) => row.closer.name,
    program: (row) => row.student.program,
    verifiedCash: (row) => row.verifiedCollected,
    paymentPlan: (row) => row.student.paymentPlan,
    tier: (row) => row.student.tier,
    verifiedAt: (row) => row.latestVerifiedAt ? new Date(row.latestVerifiedAt) : null,
    contractValue: (row) => row.student.totalContractValue
  });

  // Selected student payments detail
  const studentDetailPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return payments.filter((p) => p.studentId === selectedStudent.id);
  }, [selectedStudent, payments]);

  const {
    sortedItems: sortedStudentDetailPayments,
    sortConfig: detailSortConfig,
    requestSort: sortStudentDetails
  } = useSortableData(studentDetailPayments, {
    transactionRef: (payment) => payment.transactionRef,
    paymentType: (payment) => payment.paymentType,
    amount: (payment) => payment.amount,
    status: (payment) => payment.status,
    verifiedBy: (payment) => payment.verifiedBy || ''
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Verified Premium Students
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Sales Attribution View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Premium student attribution and follow-up list from verified Finance output only.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredRows.length}</span> of {students.length} Enrollments
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, email, program..."
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Closer Filter */}
        <div>
          <select
            value={filter.closerId}
            onChange={(e) => setFilter((prev) => ({ ...prev, closerId: e.target.value }))}
            className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Closers</option>
            {closers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Program Filter */}
        <div>
          <select
            value={filter.program}
            onChange={(e) => setFilter((prev) => ({ ...prev, program: e.target.value }))}
            className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 truncate focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Programs</option>
            {programOptions.map((program) => <option key={program} value={program}>{program}</option>)}
          </select>
        </div>

        {/* Status Filter & Reset */}
        <div className="flex items-center gap-2">
          <select
            value={filter.paymentStatus}
            onChange={(e) => setFilter((prev) => ({ ...prev, paymentStatus: e.target.value }))}
            className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Verified Sales Only</option>
          </select>

          <button
            onClick={resetFilters}
            className="px-2.5 py-2 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Attribution Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="data-table-scroll">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <SortableTableHeader label="Student" sortKey="student" sortConfig={studentSortConfig} onSort={sortStudents} className="py-3 px-4" />
                <SortableTableHeader label="Enrollment Date" sortKey="enrolledAt" sortConfig={studentSortConfig} onSort={sortStudents} className="py-3 px-4" />
                <SortableTableHeader label="Assigned Closer" sortKey="closer" sortConfig={studentSortConfig} onSort={sortStudents} className="py-3 px-4" />
                <SortableTableHeader label="Program" sortKey="program" sortConfig={studentSortConfig} onSort={sortStudents} className="py-3 px-4" />
                <SortableTableHeader label="Verified Cash" sortKey="verifiedCash" sortConfig={studentSortConfig} onSort={sortStudents} align="right" className="py-3 px-4" />
                <SortableTableHeader label="Payment Plan" sortKey="paymentPlan" sortConfig={studentSortConfig} onSort={sortStudents} className="py-3 px-4" />
                <SortableTableHeader label="Tier" sortKey="tier" sortConfig={studentSortConfig} onSort={sortStudents} align="center" className="py-3 px-4" />
                <SortableTableHeader label="Verified Date" sortKey="verifiedAt" sortConfig={studentSortConfig} onSort={sortStudents} align="right" className="py-3 px-4" />
                <SortableTableHeader label="Verified Sale" sortKey="contractValue" sortConfig={studentSortConfig} onSort={sortStudents} align="right" className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    No student enrollments found matching current criteria.
                  </td>
                </tr>
              ) : (
                sortedStudentRows.map((row) => {
                  const s = row.student;
                  const isVerifiedEligible = row.isEligibleForSales;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="text-slate-800 font-medium">{new Date(s.enrolledAt).toLocaleDateString()}</div>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <img
                            src={row.closer.avatarUrl}
                            alt={row.closer.name}
                            referrerPolicy="no-referrer"
                            className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="text-slate-800 text-xs font-medium">{row.closer.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-700 max-w-[180px]">
                        {s.program}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold tabular-nums">
                        <span className={row.verifiedCollected > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                          ${row.verifiedCollected.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-700">
                        {s.paymentPlan}
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans text-purple-700 font-semibold">
                        {s.tier}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {row.latestVerifiedAt
                          ? new Date(row.latestVerifiedAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        ${s.totalContractValue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Student Attribution Dossier
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedStudent.fullName} · {selectedStudent.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-sans font-medium">Program</span>
                <p className="text-slate-900 font-sans font-medium truncate mt-0.5">
                  {selectedStudent.program}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans font-medium">Tier</span>
                <p className="text-purple-700 font-sans font-semibold mt-0.5">
                  {selectedStudent.tier}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans font-medium">Contract Value</span>
                <p className="text-slate-900 font-bold mt-0.5">
                  ${selectedStudent.totalContractValue.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans font-medium">Schedule</span>
                <p className="text-slate-700 font-sans mt-0.5">
                  {selectedStudent.paymentPlan}
                </p>
              </div>
            </div>

            {/* Payment Records Ledger for this student */}
            <h4 className="text-xs font-bold text-slate-900 mb-2">
              Associated Finance Payment Records ({studentDetailPayments.length})
            </h4>

            <div className="data-table-scroll rounded-xl border border-slate-200 mb-4">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <SortableTableHeader label="Txn Ref" sortKey="transactionRef" sortConfig={detailSortConfig} onSort={sortStudentDetails} className="py-2 px-3 font-sans font-semibold" />
                    <SortableTableHeader label="Channel" sortKey="paymentType" sortConfig={detailSortConfig} onSort={sortStudentDetails} className="py-2 px-3 font-sans font-semibold" />
                    <SortableTableHeader label="Amount" sortKey="amount" sortConfig={detailSortConfig} onSort={sortStudentDetails} align="right" className="py-2 px-3 font-sans font-semibold" />
                    <SortableTableHeader label="Status" sortKey="status" sortConfig={detailSortConfig} onSort={sortStudentDetails} align="center" className="py-2 px-3 font-sans font-semibold" />
                    <SortableTableHeader label="Verified By" sortKey="verifiedBy" sortConfig={detailSortConfig} onSort={sortStudentDetails} className="py-2 px-3 font-sans font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {sortedStudentDetailPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-900 font-semibold">{p.transactionRef}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{p.paymentType}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums">
                        ${p.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            p.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500 truncate max-w-[120px]">
                        {p.verifiedBy || 'Pending verification'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
