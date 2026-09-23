import React, { useState } from 'react';
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import { User, UserRole } from '../types';
import {
  ShieldCheck,
  CheckCircle,
  X,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { currentUser, setCurrentUser, users } = useSalesWorkflow();
  const [activeTab, setActiveTab] = useState<'profiles' | 'credentials'>('profiles');

  // Custom login simulation
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('closer');
  const [customName, setCustomName] = useState('');
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  const handleSelectUser = (u: User) => {
    setCurrentUser(u);
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) return;

    // Check if user already exists
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      setLoginFeedback(`Signed in as ${existing.name} (${existing.role})`);
      setTimeout(() => onClose(), 800);
      return;
    }

    // Create session user
    const newUser: User = {
      id: `user-session-${Date.now()}`,
      name: customName.trim() || email.split('@')[0],
      email,
      role: selectedRole
    };

    setCurrentUser(newUser);
    setLoginFeedback(`Session established for ${newUser.name}`);
    setTimeout(() => onClose(), 800);
  };

  const getRolePermissions = (role: UserRole) => {
    switch (role) {
      case 'sales_manager':
        return [
          'Full Executive Dashboard & KPI Engine',
          'Lead Pipeline & Strategy Management',
          'Closer Quota Setting & Target Configuration',
          'Complete Financial Ledger Visibility',
          'CSV & Executive PDF Report Export'
        ];
      case 'finance_officer':
        return [
          'Finance Payment Verification Authority',
          'Payment Rejection & Audit Log Signoffs',
          'Direct Bank Ledger & Treasury Logging',
          'Deduplication & Gateway Reconciliation',
          'Sales Data Sync Verification Controls'
        ];
      case 'closer':
        return [
          'Prospective Student Lead Pipeline',
          'Execute Deal Close & Student Enrollment',
          'Submit Initial Payment to Finance System',
          'Personal Quota & Commission Tracking',
          'Student Attribution Dossier Access'
        ];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Role-Based Authentication &amp; Access Control
              </h3>
              <p className="text-xs text-slate-500">
                Secure access gates protect sensitive sales commission and treasury finance records.
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

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg mb-5 text-xs">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-all ${
              activeTab === 'profiles'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Switch Team Account
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-all ${
              activeTab === 'credentials'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Credentials / PIN
          </button>
        </div>

        {loginFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">{loginFeedback}</span>
          </div>
        )}

        {activeTab === 'profiles' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Select an authenticated profile to test domain-specific workflow permissions:
            </p>

            {users.map((u) => {
              const isSelected = currentUser.id === u.id;
              const permissions = getRolePermissions(u.role);

              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-mono text-xs font-bold text-slate-700 border border-slate-200">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">{u.name}</span>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                              Active Session
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded border font-semibold ${
                        u.role === 'sales_manager'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : u.role === 'finance_officer'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}
                    >
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-500">
                    {permissions.slice(0, 4).map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                        <span className="truncate">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Katherine Pierce"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Corporate Email</label>
              <input
                type="email"
                required
                placeholder="name@tmtsales.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Security PIN / Passcode</label>
                <input
                  type="password"
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Requested Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="closer">Admissions Closer</option>
                  <option value="finance_officer">Finance Officer (CPA)</option>
                  <option value="sales_manager">Executive Sales Manager</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
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
                <KeyRound className="h-4 w-4" />
                <span>Establish Secure Session</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
