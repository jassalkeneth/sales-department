import React, { useState } from 'react';
import { Lead, ProgramType, PaymentType } from '../types';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { CheckCircle2, X, ShieldAlert } from 'lucide-react';

interface CloseStudentModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CloseStudentModal: React.FC<CloseStudentModalProps> = ({
  lead,
  onClose,
  onSuccess
}) => {
  const { closeStudentAndEnroll, closers, programOptions, paymentTypeOptions } = useSalesWorkflow();

  const [fullName, setFullName] = useState(lead.fullName);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [program, setProgram] = useState<ProgramType>(lead.targetProgram);
  const [tier, setTier] = useState<'Standard' | 'Premium' | 'Elite Cohort'>('Premium');
  const [totalContractValue, setTotalContractValue] = useState<number>(lead.estimatedDealValue || 0);
  const [paymentPlan, setPaymentPlan] = useState<'Full Upfront' | '2-Part Installment' | '3-Part Installment' | 'Income Share Option'>('Full Upfront');

  // Initial Payment Info
  const [initialAmount, setInitialAmount] = useState<number>(lead.estimatedDealValue || 0);
  const [paymentType, setPaymentType] = useState<PaymentType>(paymentTypeOptions[0] || '');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Handle plan change to recalculate suggested initial payment
  const handlePlanChange = (newPlan: typeof paymentPlan) => {
    setPaymentPlan(newPlan);
    if (newPlan === 'Full Upfront') {
      setInitialAmount(totalContractValue);
    } else if (newPlan === '2-Part Installment') {
      setInitialAmount(Math.round(totalContractValue / 2));
    } else if (newPlan === '3-Part Installment') {
      setInitialAmount(Math.round(totalContractValue / 3));
    } else {
      setInitialAmount(Math.round(totalContractValue * 0.2)); // deposit
    }
  };

  const handleContractValueChange = (val: number) => {
    setTotalContractValue(val);
    if (paymentPlan === 'Full Upfront') {
      setInitialAmount(val);
    } else if (paymentPlan === '2-Part Installment') {
      setInitialAmount(Math.round(val / 2));
    } else if (paymentPlan === '3-Part Installment') {
      setInitialAmount(Math.round(val / 3));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await closeStudentAndEnroll(
      lead.id,
      {
        fullName,
        email,
        phone,
        program,
        tier,
        totalContractValue: Number(totalContractValue),
        paymentPlan
      },
      {
        amount: Number(initialAmount),
        paymentType,
        transactionRef,
        notes
      }
    );

    if (result) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const assignedCloser = closers.find((c) => c.id === lead.assignedCloserId) || closers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Close Student &amp; Submit to Finance
              </h3>
              <p className="text-xs text-slate-500">
                Workflow Step: Closer Enrollment Hand-off to Finance Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workflow Info Callout */}
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs mb-4 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-emerald-700" />
          <div>
            <span className="font-semibold text-slate-900">TMT Attribution Rule: </span>
            Submitting records a <strong>Pending Payment</strong> in the Finance System. Sales KPIs &amp; Quota credit will be granted only after Finance verifies settlement.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Closer Attribution */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Attributed Closer:</span>
            <div className="flex items-center gap-2">
              <img
                src={assignedCloser.avatarUrl}
                alt={assignedCloser.name}
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200"
              />
              <span className="font-semibold text-slate-900">{assignedCloser.name}</span>
            </div>
          </div>

          {/* Student Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Student Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Program and Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Enrolled Program</label>
              <input
                required
                list="enrollment-program-options"
                value={program}
                onChange={(e) => setProgram(e.target.value as ProgramType)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <datalist id="enrollment-program-options">
                {programOptions.map((option) => <option key={option} value={option} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Program Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Standard">Standard Tier</option>
                <option value="Premium">Premium Tier</option>
                <option value="Elite Cohort">Elite Cohort (Executive)</option>
              </select>
            </div>
          </div>

          {/* Deal Value & Payment Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Total Contract Value ($)</label>
              <input
                type="number"
                min={500}
                step={100}
                required
                value={totalContractValue}
                onChange={(e) => handleContractValueChange(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Payment Schedule</label>
              <select
                value={paymentPlan}
                onChange={(e) => handlePlanChange(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Full Upfront">Full Upfront (100%)</option>
                <option value="2-Part Installment">2-Part Installment (50% / 50%)</option>
                <option value="3-Part Installment">3-Part Installment (33% / 33% / 33%)</option>
                <option value="Income Share Option">Income Share / ISA Option</option>
              </select>
            </div>
          </div>

          {/* Finance Payment Section */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 mb-2">
              Initial Payment Hand-off to Finance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Amount Submitted ($)</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-emerald-700 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Payment Channel</label>
                <input
                  required
                  list="payment-channel-options"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <datalist id="payment-channel-options">
                  {paymentTypeOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Transaction Ref / Slip</label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. STRIPE-CHG-9921"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Closer Hand-off Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Student confirmed receipt, wire dispatched via Chase"
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enroll Student &amp; Submit to Finance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
