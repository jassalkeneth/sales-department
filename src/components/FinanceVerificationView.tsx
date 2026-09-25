import React, { useState } from 'react';
import { CheckCircle2, Clock3, Database, RefreshCw, Search } from 'lucide-react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { SortableTableHeader } from './SortableTableHeader';
import { useSortableData } from '../hooks/useSortableData';

const peso = (value: number) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2
}).format(value);

export const FinanceVerificationView: React.FC = () => {
  const { payments, financeSync, refreshData, isLoading } = useSalesWorkflow();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingPayments = payments.filter((payment) => payment.status === 'pending');
  const verifiedPayments = payments.filter((payment) => payment.status === 'verified');
  const visiblePayments = (activeTab === 'pending' ? pendingPayments : payments).filter((payment) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [payment.transactionRef, payment.studentName, payment.closerName, payment.program]
      .join(' ').toLowerCase().includes(query);
  });

  const { sortedItems, sortConfig, requestSort } = useSortableData(visiblePayments, {
    transactionRef: (payment) => payment.transactionRef,
    studentName: (payment) => payment.studentName,
    closerName: (payment) => payment.closerName,
    program: (payment) => payment.program,
    paymentType: (payment) => payment.paymentType,
    amount: (payment) => payment.amount,
    status: (payment) => payment.status
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Finance Verification</h1>
          <p className="mt-1 text-xs text-slate-500">Read-only Finance verification from TMT Central. Decisions must be made in Finance.</p>
        </div>
        <button type="button" onClick={() => void refreshData()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Finance data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <SummaryCard label="For verification" value={peso(pendingPayments.reduce((sum, payment) => sum + payment.amount, 0))} detail={`${pendingPayments.length.toLocaleString()} Finance records`} icon={<Clock3 className="h-4 w-4" />} tone="amber" />
        <SummaryCard label="Finance verified" value={peso(verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0))} detail={`${verifiedPayments.length.toLocaleString()} Finance records`} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <SummaryCard label="Source status" value={financeSync?.source ?? 'TMT Central / Finance'} detail={financeSync ? `${financeSync.importedRecords.toLocaleString()} valid records · source updated ${financeSync.sourceUpdatedAt ? new Date(financeSync.sourceUpdatedAt).toLocaleString() : 'unknown'} · synced ${new Date(financeSync.syncedAt).toLocaleString()}` : 'Waiting for source sync'} icon={<Database className="h-4 w-4" />} tone="slate" />
      </div>

      {financeSync && Object.values(financeSync.skipped).some((count) => count > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Data-quality safeguards excluded {Object.values(financeSync.skipped).reduce((sum, count) => sum + count, 0).toLocaleString()} records: {' '}
          {Object.entries(financeSync.skipped).filter(([, count]) => count > 0).map(([reason, count]) => `${count} ${reason.replaceAll('_', ' ')}`).join(', ')}.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button onClick={() => setActiveTab('pending')} className={`rounded-md px-3 py-1.5 text-xs ${activeTab === 'pending' ? 'bg-white font-semibold shadow-xs' : 'text-slate-600'}`}>Pending ({pendingPayments.length})</button>
          <button onClick={() => setActiveTab('all')} className={`rounded-md px-3 py-1.5 text-xs ${activeTab === 'all' ? 'bg-white font-semibold shadow-xs' : 'text-slate-600'}`}>All ({payments.length})</button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search Finance records..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-emerald-500" />
        </div>
      </div>

      <div className="emerald-glass-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="data-table-scroll">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <SortableTableHeader label="OR / Reference" sortKey="transactionRef" sortConfig={sortConfig} onSort={requestSort} className="px-3 py-2.5" />
              <SortableTableHeader label="Student" sortKey="studentName" sortConfig={sortConfig} onSort={requestSort} className="px-3 py-2.5" />
              <SortableTableHeader label="Closer" sortKey="closerName" sortConfig={sortConfig} onSort={requestSort} className="px-3 py-2.5" />
              <SortableTableHeader label="Program" sortKey="program" sortConfig={sortConfig} onSort={requestSort} className="px-3 py-2.5" />
              <SortableTableHeader label="Method" sortKey="paymentType" sortConfig={sortConfig} onSort={requestSort} className="px-3 py-2.5" />
              <SortableTableHeader label="Amount" sortKey="amount" sortConfig={sortConfig} onSort={requestSort} align="right" className="px-3 py-2.5" />
              <SortableTableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} align="center" className="px-3 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.length === 0 ? <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No matching Finance records.</td></tr> : sortedItems.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{payment.transactionRef}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{payment.studentName}</td>
                  <td className="px-3 py-2.5 text-slate-600">{payment.closerName}</td>
                  <td className="px-3 py-2.5 text-slate-600">{payment.program}</td>
                  <td className="px-3 py-2.5 text-slate-600">{payment.paymentType}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">{peso(payment.amount)}</td>
                  <td className="px-3 py-2.5 text-center"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${payment.status === 'verified' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>{payment.status === 'verified' ? 'Verified' : 'For verification'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; detail: string; icon: React.ReactNode; tone: 'amber' | 'emerald' | 'slate' }> = ({ label, value, detail, icon, tone }) => {
  const toneClass = tone === 'amber' ? 'text-amber-800' : tone === 'emerald' ? 'text-emerald-800' : 'text-slate-700';
  return <div className="emerald-glass-card rounded-xl p-4"><div className={`flex items-center justify-between text-xs font-semibold uppercase tracking-wider ${toneClass}`}><span>{label}</span>{icon}</div><div className="mt-1.5 truncate text-xl font-bold font-mono text-slate-900 tabular-nums">{value}</div><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
};
