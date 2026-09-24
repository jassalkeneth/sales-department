import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import salesLogo from '../assets/images/saleslogo.png';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onLogin(email.trim(), password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative h-dvh overflow-y-auto bg-slate-950 text-white lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-44 top-1/3 h-[34rem] w-[34rem] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute -right-40 -top-48 h-[38rem] w-[38rem] rounded-full bg-cyan-400/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="relative mx-auto grid min-h-full w-full max-w-[1500px] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between gap-12 px-6 py-8 sm:px-10 lg:px-16 lg:py-12 xl:px-20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-white/95 shadow-lg shadow-emerald-950/30">
              <img src={salesLogo} alt="TMT Sales" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">TMT Sales Engine</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">Revenue Operations</p>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Connected sales intelligence
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl xl:text-6xl">
              Turn every lead into a measurable revenue decision.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              One secure workspace for pipeline velocity, verified collections, closer performance, and student attribution.
            </p>

            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { icon: TrendingUp, label: 'Live pipeline', detail: 'Track every stage' },
                { icon: ShieldCheck, label: 'Verified revenue', detail: 'Finance-approved' },
                { icon: BarChart3, label: 'Team performance', detail: 'Quota visibility' }
              ].map(({ icon: Icon, label, detail }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 text-xs font-bold text-white">{label}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500">© {new Date().getFullYear()} TMT Sales. Internal operations platform.</p>
        </section>

        <section className="flex items-center justify-center border-t border-white/10 bg-white/[0.035] px-6 py-12 backdrop-blur-xl sm:px-10 lg:border-l lg:border-t-0 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10">
                <LockKeyhole className="h-5 w-5 text-emerald-300" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-400">Sign in with your authorized team account.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-200">Work email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold text-slate-200">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Continue to dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-2 border-t border-white/10 pt-6 text-[11px] leading-5 text-slate-500">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              Your session is protected and dashboard access is authenticated through the sales API.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
