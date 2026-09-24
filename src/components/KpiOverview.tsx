import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CloseStudentModal } from './CloseStudentModal';
import { SortableTableHeader } from './SortableTableHeader';
import { useSortableData } from '../hooks/useSortableData';

interface KpiOverviewProps {
  onNavigateTab: (tab: string) => void;
}

interface TrendIndicatorProps {
  type: 'up' | 'down';
  value: string;
  label: string;
  isPositive: boolean;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  type,
  value,
  label,
  isPositive
}) => {
  const Icon = type === 'up' ? ArrowUp : ArrowDown;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
          isPositive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
        aria-label={`${isPositive ? 'Positive' : 'Negative'} performance change: ${value}`}
      >
        <Icon className="h-3 w-3 stroke-[2.5] shrink-0" />
        <span>{value}</span>
      </span>
      <span className="text-[11px] text-slate-500 font-sans tracking-normal">
        {label}
      </span>
    </div>
  );
};

export const KpiOverview: React.FC<KpiOverviewProps> = ({ onNavigateTab }) => {
  const {
    totalVerifiedSales,
    totalVerifiedCollections,
    totalPendingCollections,
    teamSalesTarget,
    salesAchievementPct,
    collectionAchievementPct,
    avgSaleValue,
    premiumStudentsCount,
    closersOnQuota,
    closersOffQuota,
    conversionRates,
    closerPerformances,
    payments,
    filteredVerifiedPayments,
    closers,
    filter,
    setFilter,
    resetFilters,
    verifyPayment,
    leads,
    students,
    programOptions,
    paymentTypeOptions,
    effectivePeriod
  } = useSalesWorkflow();

  const [closingLead, setClosingLead] = useState<any | null>(null);

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const verifiedPayments = filteredVerifiedPayments;

  const hasPending = pendingPayments.length > 0;

  const {
    sortedItems: sortedCloserPerformances,
    sortConfig: closerSortConfig,
    requestSort: sortClosers
  } = useSortableData(closerPerformances, {
    closer: (performance) => performance.closer.name,
    booked: (performance) => performance.actualSales,
    cash: (performance) => performance.actualCollections,
    target: (performance) => performance.closer.quota.monthlyTarget,
    attainment: (performance) => performance.salesAchievementPct,
    gap: (performance) => performance.remainingSalesTarget
  }, { key: 'attainment', direction: 'desc' });

  // Program Breakdown
  const programBreakdown = verifiedPayments.reduce((acc, p) => {
    acc[p.program] = (acc[p.program] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const actionableLead = leads.find((l) => l.stage === 'negotiation' || l.stage === 'demo_call') || leads[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Performance Overview
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {effectivePeriod || 'No reporting period configured'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actionableLead && (
            <button
              onClick={() => setClosingLead(actionableLead)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Close Deal</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('finance')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <span>Finance Queue</span>
            {pendingPayments.length > 0 && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                {pendingPayments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-lg border border-slate-200 bg-white shadow-xs">
        <input
          type="search"
          aria-label="Search students"
          placeholder="Student name"
          value={filter.searchQuery}
          onChange={(event) => setFilter((current) => ({ ...current, searchQuery: event.target.value }))}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        <select
          aria-label="Filter by closer"
          value={filter.closerId}
          onChange={(event) => setFilter((current) => ({ ...current, closerId: event.target.value }))}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All closers</option>
          {closers.map((closer) => <option key={closer.id} value={closer.id}>{closer.name}</option>)}
        </select>
        <select
          aria-label="Filter by program"
          value={filter.program}
          onChange={(event) => setFilter((current) => ({ ...current, program: event.target.value }))}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All programs</option>
          {programOptions.map((program) => <option key={program} value={program}>{program}</option>)}
        </select>
        <select
          aria-label="Filter by payment type"
          value={filter.paymentType}
          onChange={(event) => setFilter((current) => ({ ...current, paymentType: event.target.value }))}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All payment types</option>
          {paymentTypeOptions.map((paymentType) => <option key={paymentType} value={paymentType}>{paymentType}</option>)}
        </select>
        <div className="flex gap-2">
          <select
            aria-label="Filter by date range"
            value={filter.dateRange}
            onChange={(event) => setFilter((current) => ({ ...current, dateRange: event.target.value as typeof current.dateRange }))}
            className="min-w-0 flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All dates</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom range</option>
          </select>
          <button onClick={resetFilters} className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50" title="Clear report filters">Reset</button>
        </div>
        {filter.dateRange === 'custom' && (
          <div className="sm:col-span-2 lg:col-span-5 flex flex-col sm:flex-row gap-3">
            <input type="date" aria-label="Custom start date" value={filter.customStartDate} onChange={(event) => setFilter((current) => ({ ...current, customStartDate: event.target.value }))} className="px-3 py-2 text-xs border border-slate-200 rounded-lg" />
            <input type="date" aria-label="Custom end date" value={filter.customEndDate} onChange={(event) => setFilter((current) => ({ ...current, customEndDate: event.target.value }))} className="px-3 py-2 text-xs border border-slate-200 rounded-lg" />
          </div>
        )}
      </div>

      {/* 4 Top-Level Metric Containers with Large Clear Typography & Trend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="emerald-glass-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <span>Total Sales</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                {salesAchievementPct.toFixed(0)}% Quota
              </span>
            </div>
            <div className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-mono tracking-tight text-slate-900 tabular-nums leading-none">
              ${totalVerifiedSales.toLocaleString()}
            </div>
            <TrendIndicator
              type={salesAchievementPct >= 100 ? 'up' : 'down'}
              value={`${salesAchievementPct.toFixed(1)}%`}
              label="of team sales target"
              isPositive={salesAchievementPct >= 100}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Target ${teamSalesTarget.toLocaleString()}</span>
            <span>{verifiedPayments.length} verified deals</span>
          </div>
        </div>

        {/* KPI 2: Conversion Rate */}
        <div className="emerald-glass-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <span>Conversion Rate</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                Lead to Won
              </span>
            </div>
            <div className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-mono tracking-tight text-emerald-600 tabular-nums leading-none">
              {conversionRates.overallLeadToWonRate.toFixed(1)}%
            </div>
            <TrendIndicator
              type="up"
              value={`${students.length}`}
              label="enrolled students"
              isPositive
            />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{students.length} Won</span>
            <span>{leads.length} Active Leads</span>
          </div>
        </div>

        {/* KPI 3: Cash Collected */}
        <div className="emerald-glass-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <span>Cash Collected</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                {collectionAchievementPct.toFixed(0)}%
              </span>
            </div>
            <div className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-mono tracking-tight text-slate-900 tabular-nums leading-none">
              ${totalVerifiedCollections.toLocaleString()}
            </div>
            <TrendIndicator
              type={collectionAchievementPct >= 100 ? 'up' : 'down'}
              value={`${collectionAchievementPct.toFixed(1)}%`}
              label="of collection target"
              isPositive={collectionAchievementPct >= 100}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Verified in Bank</span>
            <span className="text-emerald-700 font-semibold">Verified Records</span>
          </div>
        </div>

        {/* KPI 4: Pending Review */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="emerald-glass-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-amber-300 cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-amber-800 uppercase">
              <span>Pending Review</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-mono tracking-tight text-amber-600 tabular-nums leading-none">
              ${totalPendingCollections.toLocaleString()}
            </div>
            <TrendIndicator
              type={hasPending ? 'down' : 'up'}
              value={pendingPayments.length.toLocaleString()}
              label="payments awaiting review"
              isPositive={!hasPending}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800 font-mono">
            <span>{pendingPayments.length} awaiting CPA</span>
            <span className="group-hover:text-amber-900 font-semibold transition-colors">Review Queue →</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-y border-slate-200 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Premium Students</div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{premiumStudentsCount}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Sale Value</div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">${Math.round(avgSaleValue).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Closers On Quota</div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700">{closersOnQuota}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Closers Off Quota</div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-700">{closersOffQuota}</div>
        </div>
      </div>

      {/* Main Grid: Closer Attainment + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Closer Leaderboard (8 cols) */}
        <div className="lg:col-span-8 emerald-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Closer Attainment</span>
            </h2>
            <button
              onClick={() => onNavigateTab('closers')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-0.5"
            >
              <span>Full Quotas</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="data-table-scroll">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50/50">
                  <SortableTableHeader label="Closer" sortKey="closer" sortConfig={closerSortConfig} onSort={sortClosers} className="py-2.5 px-3" />
                  <SortableTableHeader label="Booked" sortKey="booked" sortConfig={closerSortConfig} onSort={sortClosers} align="right" className="py-2.5 px-3" />
                  <SortableTableHeader label="Cash" sortKey="cash" sortConfig={closerSortConfig} onSort={sortClosers} align="right" className="py-2.5 px-3" />
                  <SortableTableHeader label="Target" sortKey="target" sortConfig={closerSortConfig} onSort={sortClosers} align="right" className="py-2.5 px-3" />
                  <SortableTableHeader label="Attainment" sortKey="attainment" sortConfig={closerSortConfig} onSort={sortClosers} align="center" className="py-2.5 px-3" />
                  <SortableTableHeader label="Gap" sortKey="gap" sortConfig={closerSortConfig} onSort={sortClosers} align="right" className="py-2.5 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sortedCloserPerformances.map((perf) => {
                  const isLeader = perf.rank === 1;
                  const is100 = perf.salesAchievementPct >= 100;

                  return (
                    <tr key={perf.closer.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-mono font-bold ${
                              isLeader
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {perf.rank}
                          </span>
                          <img
                            src={perf.closer.avatarUrl}
                            alt={perf.closer.name}
                            referrerPolicy="no-referrer"
                            className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="font-semibold text-slate-900 text-xs">{perf.closer.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-900 tabular-nums">
                        ${perf.actualSales.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-emerald-700 tabular-nums">
                        ${perf.actualCollections.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-500 tabular-nums">
                        ${perf.closer.quota.monthlyTarget.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold font-mono ${
                            is100
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'text-slate-700 bg-slate-100'
                          }`}
                        >
                          {perf.salesAchievementPct.toFixed(0)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums">
                        {perf.remainingSalesTarget === 0 ? (
                          <span className="text-emerald-700 text-[11px] font-sans font-semibold">Done</span>
                        ) : (
                          <span className="text-slate-500">
                            ${perf.remainingSalesTarget.toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Pending Verification & Programs (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Pending Verification Card */}
          <div className="emerald-glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Pending Verification ({pendingPayments.length})
              </span>
              <button
                onClick={() => onNavigateTab('finance')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
              >
                Queue →
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Verification queue is clear</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingPayments.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 truncate max-w-[140px]">{p.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.transactionRef}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-amber-700 tabular-nums">
                        ${p.amount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => verifyPayment(p.id, 'Verified via dashboard')}
                        className="mt-1 px-2.5 py-0.5 text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clean Program Revenue Distribution */}
          <div className="emerald-glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
              Revenue by Program
            </span>
            <div className="space-y-3 font-mono text-xs">
              {Object.entries(programBreakdown).map(([prog, amount]) => {
                const pct = totalVerifiedSales > 0 ? (amount / totalVerifiedSales) * 100 : 0;
                return (
                  <div key={prog}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-sans text-slate-700 font-medium truncate max-w-[160px]">{prog}</span>
                      <span className="font-bold text-slate-900 tabular-nums">${amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Close Student Modal */}
      {closingLead && (
        <CloseStudentModal
          lead={closingLead}
          onClose={() => setClosingLead(null)}
          onSuccess={() => setClosingLead(null)}
        />
      )}
    </div>
  );
};
