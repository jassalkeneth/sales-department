import React, { useMemo, useState } from 'react';
import { X, Users, CreditCard, TrendingUp, Search } from 'lucide-react';
import type { PaymentRecord } from '../types';

interface ProgramDetailModalProps {
  program: string;
  payments: PaymentRecord[];
  totalVerifiedSales: number;
  onClose: () => void;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  program,
  payments,
  totalVerifiedSales,
  onClose
}) => {
  const [query, setQuery] = useState('');

  const programPayments = useMemo(
    () => payments.filter((payment) => payment.program === program),
    [payments, program]
  );

  const revenue = programPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const uniqueStudents = new Set(programPayments.map((payment) => payment.studentId)).size;
  const share = totalVerifiedSales > 0 ? (revenue / totalVerifiedSales) * 100 : 0;

  const filteredPayments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...programPayments].sort((a, b) => b.amount - a.amount);
    if (!needle) return sorted;
    return sorted.filter((payment) =>
      payment.studentName.toLowerCase().includes(needle) ||
      payment.transactionRef.toLowerCase().includes(needle) ||
      payment.closerName.toLowerCase().includes(needle)
    );
  }, [programPayments, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">{program}</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {programPayments.length} verified {programPayments.length === 1 ? 'payment' : 'payments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Revenue</div>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900 tabular-nums">
              ₱{revenue.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Share</div>
            <div className="mt-1 text-sm font-bold font-mono text-emerald-700 tabular-nums">
              {share.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Transactions
            </div>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900 tabular-nums">
              {programPayments.length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
              <Users className="h-3 w-3" /> Students
            </div>
            <div className="mt-1 text-sm font-bold font-mono text-slate-900 tabular-nums">
              {uniqueStudents}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-200">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by student, transaction ref, or closer…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              aria-label="Search program payments"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {programPayments.length === 0
                ? 'No verified payments for this program in the current filter.'
                : 'No payments match your search.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Closer</th>
                  <th className="py-2.5 px-4">Payment Type</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 font-sans">{payment.studentName}</div>
                      <div className="text-[10px] text-slate-500">{payment.transactionRef}</div>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">{payment.closerName}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {payment.paymentType}
                      {payment.totalInstallments > 1 && (
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({payment.installmentNumber}/{payment.totalInstallments})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 tabular-nums">
                      ₱{payment.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-500">
                      {payment.verifiedAt
                        ? new Date(payment.verifiedAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/60">
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            Showing {filteredPayments.length} of {programPayments.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
