import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { CloserPerformance } from '../types';
import {
  Settings,
  UserCheck
} from 'lucide-react';

export const CloserPerformanceView: React.FC = () => {
  const {
    closerPerformances,
    updateCloserQuota,
    currentUser,
    setCurrentUser,
    users
  } = useSalesWorkflow();

  const [editingCloserPerf, setEditingCloserPerf] = useState<CloserPerformance | null>(null);
  const [targetMonthlySales, setTargetMonthlySales] = useState<number>(0);
  const [targetCollections, setTargetCollections] = useState<number>(0);
  const [baseCommPct, setBaseCommPct] = useState<number>(10);
  const [accCommPct, setAccCommPct] = useState<number>(15);

  const isSalesManager = currentUser.role === 'sales_manager';

  const handleOpenEdit = (perf: CloserPerformance) => {
    setEditingCloserPerf(perf);
    setTargetMonthlySales(perf.closer.quota.monthlyTarget);
    setTargetCollections(perf.closer.quota.collectionTarget);
    setBaseCommPct(perf.closer.quota.baseCommissionPct);
    setAccCommPct(perf.closer.quota.acceleratorPct);
  };

  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCloserPerf) return;

    updateCloserQuota(
      editingCloserPerf.closer.id,
      Number(targetMonthlySales),
      Number(targetCollections),
      Number(baseCommPct),
      Number(accCommPct)
    );

    setEditingCloserPerf(null);
  };

  const switchToManager = () => {
    const mgr = users.find((u) => u.role === 'sales_manager') || users[0];
    setCurrentUser(mgr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Closer Performance &amp; Quota Engine
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-purple-50 text-purple-800 border border-purple-200">
              September 2026 Cohort
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual target tracking, verified sales attribution, and commission accelerator calculators.
          </p>
        </div>

        {!isSalesManager && (
          <button
            onClick={switchToManager}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors shadow-xs"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Switch to Sales Manager to Edit Quotas</span>
          </button>
        )}
      </div>

      {/* Podium Cards Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {closerPerformances.slice(0, 3).map((perf, index) => {
          const isGold = index === 0;
          const isSilver = index === 1;

          let badgeColor = 'border-amber-200 bg-amber-50/40 text-amber-900';
          let ringColor = 'ring-amber-400';
          let titleBadge = 'Gold Medal Closer';

          if (isSilver) {
            badgeColor = 'border-slate-200 bg-slate-50/70 text-slate-800';
            ringColor = 'ring-slate-300';
            titleBadge = 'Silver Medal Closer';
          } else if (!isGold) {
            badgeColor = 'border-orange-200 bg-orange-50/40 text-orange-900';
            ringColor = 'ring-orange-300';
            titleBadge = 'Bronze Medal Closer';
          }

          return (
            <div
              key={perf.closer.id}
              className={`rounded-2xl border p-5 relative overflow-hidden shadow-xs ${badgeColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={perf.closer.avatarUrl}
                      alt={perf.closer.name}
                      referrerPolicy="no-referrer"
                      className={`h-12 w-12 rounded-full object-cover ring-2 ${ringColor}`}
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-mono font-bold text-slate-900 border border-slate-200 shadow-xs">
                      #{perf.rank}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{perf.closer.name}</h3>
                    <p className="text-[11px] text-slate-500">{perf.closer.title}</p>
                    <span className="text-[10px] font-semibold opacity-90">{titleBadge}</span>
                  </div>
                </div>

                {isSalesManager && (
                  <button
                    onClick={() => handleOpenEdit(perf)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white/80 transition-colors"
                    title="Configure Quota"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/80 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] font-sans font-medium">Booked Sales</span>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    ${perf.actualSales.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Target: ${perf.closer.quota.monthlyTarget.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-sans font-medium">Cash Collections</span>
                  <div className="text-base font-bold text-emerald-700 tabular-nums">
                    ${perf.actualCollections.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Target: ${perf.closer.quota.collectionTarget.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] mb-1 font-medium">
                  <span className="text-slate-600">Quota Achievement</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {perf.salesAchievementPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-white/80 rounded-full overflow-hidden border border-slate-200/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      perf.salesAchievementPct >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, perf.salesAchievementPct)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Est. Commission:</span>
                <span className="font-mono font-bold text-indigo-700 tabular-nums">
                  ${Math.round(perf.estimatedCommissions).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Closer Table with Deep Metrics */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Comprehensive Closer Scorecards &amp; KPI Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified sales booked, cash collections, remaining quotas, and deal sizes.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Closer</th>
                <th className="py-3 px-4 text-right">Actual Booked</th>
                <th className="py-3 px-4 text-right">Remaining Sales</th>
                <th className="py-3 px-4 text-right">Verified Cash</th>
                <th className="py-3 px-4 text-right">Remaining Cash</th>
                <th className="py-3 px-4 text-center">Quota Progress</th>
                <th className="py-3 px-4 text-right">Avg Deal</th>
                <th className="py-3 px-4 text-right">Premium Ratio</th>
                <th className="py-3 px-4 text-right">Commission</th>
                {isSalesManager && <th className="py-3 px-4 text-center">Config</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {closerPerformances.map((perf) => (
                <tr key={perf.closer.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={perf.closer.avatarUrl}
                        alt={perf.closer.name}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{perf.closer.name}</div>
                        <div className="text-[10px] text-slate-500">{perf.closer.title}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                    ${perf.actualSales.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-500 tabular-nums">
                    ${perf.remainingSalesTarget.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700 tabular-nums">
                    ${perf.actualCollections.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-500 tabular-nums">
                    ${perf.remainingCollectionTarget.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          perf.salesAchievementPct >= 100 ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {perf.salesAchievementPct.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            perf.salesAchievementPct >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, perf.salesAchievementPct)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-700 tabular-nums">
                    ${Math.round(perf.avgSaleValue).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right text-purple-700 font-semibold tabular-nums">
                    {perf.closedDealsCount > 0
                      ? `${((perf.premiumStudentsCount / perf.closedDealsCount) * 100).toFixed(0)}%`
                      : '0%'}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-indigo-700 tabular-nums">
                    ${Math.round(perf.estimatedCommissions).toLocaleString()}
                  </td>

                  {isSalesManager && (
                    <td className="py-3.5 px-4 text-center font-sans">
                      <button
                        onClick={() => handleOpenEdit(perf)}
                        className="px-2 py-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quota Modal */}
      {editingCloserPerf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Configure Monthly Quota: {editingCloserPerf.closer.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set effective targets for {editingCloserPerf.closer.quota.effectivePeriod}.
            </p>

            <form onSubmit={handleSaveQuota} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-sans mb-1 font-medium">
                  Monthly Sales Target ($ Booked)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={targetMonthlySales}
                  onChange={(e) => setTargetMonthlySales(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-sans mb-1 font-medium">
                  Collection Target ($ Cash in Bank)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={targetCollections}
                  onChange={(e) => setTargetCollections(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-emerald-700 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-sans mb-1 font-medium">Base Commission (%)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={baseCommPct}
                    onChange={(e) => setBaseCommPct(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-sans mb-1 font-medium">Accelerator (%)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={accCommPct}
                    onChange={(e) => setAccCommPct(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingCloserPerf(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Save Quota Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
