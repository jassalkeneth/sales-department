import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { Lead, LeadStage, ProgramType } from '../types';
import { CloseStudentModal } from './CloseStudentModal';
import { ProfileInitials } from './ProfileInitials';
import {
  Plus,
  Filter
} from 'lucide-react';

export const LeadPipelineView: React.FC = () => {
  const {
    leads,
    closers,
    addLead,
    updateLeadStage,
    conversionRates,
    programOptions
  } = useSalesWorkflow();

  const [selectedCloserFilter, setSelectedCloserFilter] = useState<string>('all');
  const [closingLead, setClosingLead] = useState<Lead | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  // New Lead form state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newProgram, setNewProgram] = useState<ProgramType>('');
  const [newDealValue, setNewDealValue] = useState(0);
  const [newSource, setNewSource] = useState('');
  const [newCloserId, setNewCloserId] = useState(closers[0]?.id || '');

  const filteredLeads = leads.filter((l) => {
    if (selectedCloserFilter !== 'all' && l.assignedCloserId !== selectedCloserFilter) return false;
    return true;
  });

  const columns: { stage: LeadStage; title: string }[] = [
    { stage: 'new_lead', title: 'New' },
    { stage: 'contacted', title: 'Contacted' },
    { stage: 'demo_call', title: 'Demo Scheduled' },
    { stage: 'negotiation', title: 'Negotiation' },
    { stage: 'enrolled', title: 'Enrolled (Pending)' },
    { stage: 'closed_won', title: 'Closed Won' }
  ];

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedCloserId = newCloserId || closers[0]?.id;
    if (!assignedCloserId || !newProgram || !newSource) return;
    const lead = await addLead({
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      targetProgram: newProgram,
      assignedCloserId,
      stage: 'new_lead',
      estimatedDealValue: Number(newDealValue),
      source: newSource
    });

    if (lead) {
      setIsAddLeadOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Lead Pipeline</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {leads.length} Leads
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-xs">
            <Filter className="h-3 w-3 text-slate-400" />
            <select
              value={selectedCloserFilter}
              onChange={(e) => setSelectedCloserFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Closers</option>
              {closers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all font-sans"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Streamlined Conversion Rate Bar */}
      <div className="emerald-glass-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-4 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-sans font-medium">Funnel Rates:</span>
          <span className="text-slate-700">
            Contact <strong className="text-emerald-700 font-bold">{conversionRates.leadToContacted.toFixed(0)}%</strong>
          </span>
          <span className="text-slate-300">→</span>
          <span className="text-slate-700">
            Demo <strong className="text-emerald-700 font-bold">{conversionRates.contactedToDemo.toFixed(0)}%</strong>
          </span>
          <span className="text-slate-300">→</span>
          <span className="text-slate-700">
            Negotiation <strong className="text-emerald-700 font-bold">{conversionRates.demoToNegotiation.toFixed(0)}%</strong>
          </span>
          <span className="text-slate-300">→</span>
          <span className="text-slate-700">
            Close <strong className="text-emerald-700 font-bold">{conversionRates.negotiationToEnrollment.toFixed(0)}%</strong>
          </span>
          <span className="text-slate-300">→</span>
          <span className="text-slate-700">
            Verify <strong className="text-emerald-700 font-bold">{conversionRates.enrollmentToVerifiedWon.toFixed(0)}%</strong>
          </span>
        </div>

        <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          Win Rate: {conversionRates.overallLeadToWonRate.toFixed(1)}%
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-[1100px]">
          {columns.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.stage === col.stage);
            const totalVal = colLeads.reduce((s, l) => s + (l.estimatedDealValue || 0), 0);

            return (
              <div
                key={col.stage}
                className="flex-1 min-w-[170px] max-w-[210px] rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col"
              >
                {/* Header */}
                <div className="p-2.5 border-b border-slate-200 bg-white/80 rounded-t-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{col.title}</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold tabular-nums">
                      ₱{(totalVal / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 flex-1 min-h-[400px]">
                  {colLeads.map((lead) => {
                    const closer = closers.find((c) => c.id === lead.assignedCloserId) || closers[0];
                    const canClose = lead.stage === 'demo_call' || lead.stage === 'negotiation';

                    return (
                      <div
                        key={lead.id}
                        className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-semibold text-xs text-slate-900 leading-tight">
                            {lead.fullName}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-900 tabular-nums">
                            ₱{lead.estimatedDealValue?.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 truncate mb-2">
                          {lead.targetProgram}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <ProfileInitials name={closer.name} className="h-4 w-4 text-[6px]" />
                            <span className="truncate max-w-[70px]">{closer.name.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {canClose && (
                              <button
                                onClick={() => setClosingLead(lead)}
                                className="px-1.5 py-0.5 text-[9px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                              >
                                Close
                              </button>
                            )}

                            {lead.stage !== 'closed_won' && lead.stage !== 'enrolled' && (
                              <select
                                value={lead.stage}
                                onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                                className="text-[9px] bg-slate-50 text-slate-700 border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                              >
                                <option value="new_lead">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="demo_call">Demo</option>
                                <option value="negotiation">Negot.</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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

      {/* Add Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Lead</h3>
            <form onSubmit={handleAddLeadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Program</label>
                <input
                  required
                  list="lead-program-options"
                  value={newProgram}
                  onChange={(e) => setNewProgram(e.target.value as ProgramType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <datalist id="lead-program-options">
                  {programOptions.map((program) => <option key={program} value={program} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Source</label>
                <input
                  required
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Value (PHP)</label>
                  <input
                    type="number"
                    value={newDealValue}
                    onChange={(e) => setNewDealValue(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Closer</label>
                  <select
                    value={newCloserId}
                    onChange={(e) => setNewCloserId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select a closer</option>
                    {closers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
