import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { PaymentRecord, PaymentType } from '../types';
import {
  Lock,
  Plus,
  Search,
  History
} from 'lucide-react';

export const FinanceVerificationView: React.FC = () => {
  const {
    payments,
    verifyPayment,
    rejectPayment,
    auditLogs,
    currentUser,
    users,
    setCurrentUser,
    students,
    closers
  } = useSalesWorkflow();

  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'audit'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyModalPayment, setVerifyModalPayment] = useState<PaymentRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectModalPayment, setRejectModalPayment] = useState<PaymentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Direct payment logging modal
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState(students[0]?.id || '');
  const [newAmount, setNewAmount] = useState<number>(4500);
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>('Wire Transfer');
  const [newTxnRef, setNewTxnRef] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const isFinanceOfficer = currentUser.role === 'finance_officer' || currentUser.role === 'sales_manager';

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const verifiedPayments = payments.filter((p) => p.status === 'verified');
  const rejectedPayments = payments.filter((p) => p.status === 'rejected');

  const filteredPayments = (activeTab === 'pending' ? pendingPayments : payments).filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.transactionRef.toLowerCase().includes(q) ||
      p.studentName.toLowerCase().includes(q) ||
      p.closerName.toLowerCase().includes(q)
    );
  });

  const handleVerifyConfirm = () => {
    if (!verifyModalPayment) return;
    verifyPayment(verifyModalPayment.id, verificationNotes || 'Verified via Finance Console');
    setVerifyModalPayment(null);
    setVerificationNotes('');
  };

  const handleRejectConfirm = () => {
    if (!rejectModalPayment) return;
    rejectPayment(rejectModalPayment.id, rejectionReason);
    setRejectModalPayment(null);
    setRejectionReason('');
  };

  const switchToFinanceOfficer = () => {
    const financeUser = users.find((u) => u.role === 'finance_officer') || users[1];
    setCurrentUser(financeUser);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Finance Verification</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              CPA Gate
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isFinanceOfficer && (
            <button
              onClick={switchToFinanceOfficer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-xs"
            >
              <Lock className="h-3 w-3" />
              <span>Switch to Finance Officer</span>
            </button>
          )}

          {isFinanceOfficer && (
            <button
              onClick={() => setIsAddPaymentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Log Direct Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="emerald-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold uppercase tracking-wider">
            <span>Pending Review</span>
            <span className="font-mono text-slate-500">{pendingPayments.length} items</span>
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ${pendingPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </div>
        </div>

        <div className="emerald-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>Verified &amp; Synced</span>
            <span className="font-mono text-slate-500">{verifiedPayments.length} items</span>
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            ${verifiedPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </div>
        </div>

        <div className="emerald-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold uppercase tracking-wider">
            <span>Rejected</span>
            <span className="font-mono text-slate-500">{rejectedPayments.length} items</span>
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono text-rose-700 tabular-nums">
            ${rejectedPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3 w-3" />
            <span>Audit Trail</span>
          </button>
        </div>

        {activeTab !== 'audit' && (
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ref or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* Table */}
      {activeTab !== 'audit' ? (
        <div className="emerald-glass-card rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Txn Ref</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Closer</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      Queue is clear. No payments pending verification.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isPending = p.status === 'pending';
                    const isVerified = p.status === 'verified';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-slate-900 font-semibold">{p.transactionRef}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">{p.studentName}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">{p.closerName}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">{p.paymentType}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                          ${p.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {isPending ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                              Pending
                            </span>
                          ) : isVerified ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                disabled={!isFinanceOfficer}
                                onClick={() => {
                                  setVerifyModalPayment(p);
                                  setVerificationNotes(`Wire settled.`);
                                }}
                                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                                  isFinanceOfficer
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                              >
                                Verify
                              </button>
                              <button
                                disabled={!isFinanceOfficer}
                                onClick={() => {
                                  setRejectModalPayment(p);
                                  setRejectionReason('Declined or not settled.');
                                }}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  isFinanceOfficer
                                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                                    : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Trail */
        <div className="emerald-glass-card rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans font-medium">
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">Txn Ref</th>
                  <th className="py-2 px-2.5">Transition</th>
                  <th className="py-2 px-2.5">Officer</th>
                  <th className="py-2 px-2.5">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2.5 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-2.5 text-slate-900 font-semibold">{log.transactionRef}</td>
                    <td className="py-2 px-2.5">
                      <span className={log.newStatus === 'verified' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {log.newStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-sans text-slate-800">{log.officerName}</td>
                    <td className="py-2 px-2.5 font-sans text-slate-500 truncate max-w-xs">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {verifyModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirm Payment Verification</h3>
            <p className="text-xs text-slate-600 mb-3">
              Verify {verifyModalPayment.transactionRef} (${verifyModalPayment.amount.toLocaleString()}) for {verifyModalPayment.studentName}.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setVerifyModalPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyConfirm}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                Confirm &amp; Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Reject Payment Record</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              placeholder="Reason for rejection..."
            />
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setRejectModalPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Direct Payment Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Log Direct Payment</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedStudent = students.find((s) => s.id === newStudentId);
                if (!selectedStudent) return;
                const targetCloser = closers.find((c) => c.id === selectedStudent.assignedCloserId) || closers[0];

                payments.unshift({
                  id: `pay-${Date.now().toString().slice(-4)}`,
                  transactionRef: newTxnRef.trim() || `WIRE-${Math.floor(10000 + Math.random() * 90000)}`,
                  studentId: selectedStudent.id,
                  studentName: selectedStudent.fullName,
                  closerId: targetCloser.id,
                  closerName: targetCloser.name,
                  program: selectedStudent.program,
                  amount: Number(newAmount),
                  paymentType: newPaymentType,
                  installmentNumber: 1,
                  totalInstallments: 1,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                  financeNotes: newNotes || 'Direct wire'
                });
                setIsAddPaymentOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-medium mb-1">Student</label>
                <select
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.program})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-emerald-700 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Method</label>
                  <select
                    value={newPaymentType}
                    onChange={(e) => setNewPaymentType(e.target.value as PaymentType)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="ACH Direct Debit">ACH</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Txn Ref</label>
                <input
                  type="text"
                  placeholder="e.g. WIRE-88129"
                  value={newTxnRef}
                  onChange={(e) => setNewTxnRef(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  Queue for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
