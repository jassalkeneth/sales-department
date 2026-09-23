import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import {
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export const SalesApiSimulator: React.FC = () => {
  const {
    totalVerifiedSales,
    totalVerifiedCollections,
    totalPendingCollections,
    salesAchievementPct,
    closerPerformances,
    students,
    closers,
    syncEvents,
    filter
  } = useSalesWorkflow();

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/summary');
  const [copied, setCopied] = useState(false);

  // Generate real API responses based on live state
  const getEndpointData = (endpoint: string) => {
    switch (endpoint) {
      case '/summary':
        return {
          status: 'success',
          timestamp: new Date().toISOString(),
          currency: 'USD',
          period: 'September 2026',
          metrics: {
            total_verified_sales: totalVerifiedSales,
            total_verified_collections: totalVerifiedCollections,
            pending_finance_collections: totalPendingCollections,
            sales_achievement_percentage: Number(salesAchievementPct.toFixed(2)),
            verified_students_count: students.filter((s) => s.financeStatus !== 'pending_payment').length,
            average_deal_size: Math.round(totalVerifiedSales / Math.max(1, students.length))
          }
        };

      case '/closers':
        return {
          status: 'success',
          count: closers.length,
          closers: closers.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            title: c.title,
            quota: c.quota
          }))
        };

      case '/leaderboard':
        return {
          status: 'success',
          leaderboard: closerPerformances.map((p) => ({
            rank: p.rank,
            closer_id: p.closer.id,
            closer_name: p.closer.name,
            actual_sales_booked: p.actualSales,
            verified_collections: p.actualCollections,
            monthly_target: p.closer.quota.monthlyTarget,
            achievement_percentage: Number(p.salesAchievementPct.toFixed(1)),
            remaining_target: p.remainingSalesTarget,
            closed_deals_count: p.closedDealsCount,
            estimated_commissions: Math.round(p.estimatedCommissions)
          }))
        };

      case '/students':
        return {
          status: 'success',
          total_students: students.length,
          students: students.slice(0, 10).map((s) => ({
            id: s.id,
            name: s.fullName,
            email: s.email,
            program: s.program,
            tier: s.tier,
            assigned_closer_id: s.assignedCloserId,
            contract_value: s.totalContractValue,
            payment_plan: s.paymentPlan,
            finance_status: s.financeStatus,
            enrolled_date: s.enrolledAt
          }))
        };

      case '/quotas':
        return {
          status: 'success',
          effective_period: 'September 2026',
          team_target_total: closers.reduce((acc, c) => acc + c.quota.monthlyTarget, 0),
          team_collection_target: closers.reduce((acc, c) => acc + c.quota.collectionTarget, 0),
          closer_quotas: closers.map((c) => ({
            closer_id: c.id,
            closer_name: c.name,
            monthly_sales_target: c.quota.monthlyTarget,
            collection_target: c.quota.collectionTarget,
            base_commission_pct: c.quota.baseCommissionPct,
            accelerator_pct: c.quota.acceleratorPct
          }))
        };

      case '/filters':
        return {
          status: 'success',
          available_filters: {
            closers: closers.map((c) => ({ id: c.id, name: c.name })),
            programs: [
              'AI & Data Systems Engineering',
              'Full-Stack Software Engineering',
              'Cloud DevOps Masterclass',
              'Cybersecurity Leadership',
              'Tech Management & Product Leadership'
            ],
            payment_types: [
              'Credit Card',
              'Wire Transfer',
              'ACH Direct Debit',
              'Financing Partner',
              'Crypto USDC'
            ],
            statuses: ['verified', 'pending', 'rejected']
          },
          current_filter_state: filter
        };

      case '/export':
        return {
          status: 'success',
          export_ready: true,
          supported_formats: ['csv', 'excel', 'json', 'pdf'],
          download_url: '/api/export?format=csv&period=current',
          generated_at: new Date().toISOString()
        };

      default:
        return { error: 'Unknown endpoint' };
    }
  };

  const responseJson = JSON.stringify(getEndpointData(selectedEndpoint), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    { path: '/summary', desc: 'Team aggregate KPIs, sales and collections totals' },
    { path: '/closers', desc: 'List of admissions closers and active quota profiles' },
    { path: '/leaderboard', desc: 'Ranked closer performance, achievement %, remaining gap' },
    { path: '/students', desc: 'Student enrollment attribution ledger records' },
    { path: '/quotas', desc: 'Quota system targets and commission multipliers' },
    { path: '/filters', desc: 'Available schema filters and dynamic query dimensions' },
    { path: '/export', desc: 'Data serialization manifest for spreadsheet & PDF export' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sales Data Sync &amp; API Simulator
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
              REST v1 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time validation, duplicate prevention, closer mapping, and live API endpoints.
          </p>
        </div>
      </div>

      {/* Sync Events Stream */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />
            <h3 className="text-sm font-bold text-slate-900">
              Real-Time Sales Data Sync Stream
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Pipeline Connected (Latency ~95ms)
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Incoming payments verified in Finance are validated for duplicates, matched to student &amp; closer profiles, and pushed to the Sales Reporting DB.
        </p>

        <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
          {syncEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                  {evt.status}
                </span>
                <span className="text-slate-900 font-semibold">{evt.transactionRef}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-700 font-sans">{evt.details}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0">
                <span>{evt.verificationLatencyMs}ms</span>
                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
            Sales API Endpoints
          </h3>
          <div className="space-y-1.5 font-mono text-xs">
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint === ep.path;
              return (
                <button
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep.path)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-300 bg-indigo-50/70 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-700">GET {ep.path}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      200 OK
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-500 mt-1">{ep.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Response Viewer (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                GET
              </span>
              <span className="text-slate-900 font-semibold">/api{selectedEndpoint}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-sans font-medium"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto max-h-[460px] flex-1">
            <pre>{responseJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
