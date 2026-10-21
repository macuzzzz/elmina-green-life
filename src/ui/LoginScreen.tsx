import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Building2, Home, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';
import type { Role } from '@/types';

const DEMOS: { role: Role; title: string; who: string; detail: string; icon: typeof Home; color: string }[] =
  [
    {
      role: 'resident',
      title: 'Resident',
      who: 'Daniel Lim',
      detail: 'Unit EG18-028',
      icon: Home,
      color: 'bg-leaf-500',
    },
    {
      role: 'guard',
      title: 'Guard',
      who: 'Encik Rahim',
      detail: 'Guardhouse EG18',
      icon: ShieldCheck,
      color: 'bg-charcoal-700',
    },
    {
      role: 'management',
      title: 'Management',
      who: 'Ms. Nurul',
      detail: 'Elmina Green Management Office',
      icon: Building2,
      color: 'bg-tool-500',
    },
  ];

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<Role | 'form' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('form');
    setError(null);
    try {
      await api.login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setBusy(null);
    }
  };

  const demo = async (role: Role) => {
    setBusy(role);
    await api.loginAsDemo(role);
  };

  return (
    <div className="relative h-full overflow-y-auto bg-gradient-to-b from-[#bfe4f7] via-[#d9f0e0] to-[#a9d98b]">
      <Skyline />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col justify-center px-4 pb-44 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="panel p-6 sm:p-8"
        >
          <img src="/brand/logo.svg" alt="Elmina Green by Sime Darby Property" className="mx-auto h-16" />
          <p className="mt-3 text-center text-sm text-gray-600">Your neighbourhood, one tap away.</p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@example.com"
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 outline-none focus:border-leaf-500 focus:ring-2 focus:ring-leaf-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 outline-none focus:border-leaf-500 focus:ring-2 focus:ring-leaf-100"
              />
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-sos-700">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy !== null}>
              {busy === 'form' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
            </button>
            <p className="text-center text-xs text-gray-500">
              No sign-up — management creates your account when your unit is handed over.
            </p>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            <span className="h-px flex-1 bg-gray-200" /> Try demo as…{' '}
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid gap-3">
            {DEMOS.map((d, i) => (
              <motion.button
                key={d.role}
                type="button"
                onClick={() => demo(d.role)}
                disabled={busy !== null}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex min-h-[64px] w-full min-w-0 items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-md ring-1 ring-black/5 disabled:opacity-60"
              >
                <span className={`grid h-11 w-11 place-items-center rounded-xl text-white ${d.color}`}>
                  {busy === d.role ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <d.icon className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold leading-tight">{d.title}</span>
                  <span className="block truncate text-sm text-gray-500">
                    {d.who} · {d.detail}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
        <p className="mt-4 text-center text-xs text-charcoal-700/70">
          Demo with fictitious data · English only · No real calls are placed without confirmation
        </p>
      </div>
    </div>
  );
}

/** Decorative low-poly rooftops along the bottom of the login screen. */
function Skyline() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full"
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const x = i * 36 - 10;
        return (
          <g key={i}>
            <rect x={x} y={55} width={34} height={45} fill="#f6f5f1" />
            <polygon points={`${x - 2},56 ${x + 17},40 ${x + 36},56`} fill="#3a3e45" />
            <rect x={x + 22} y={58} width={8} height={42} fill="#b8603d" />
            <rect x={x + 6} y={64} width={12} height={9} fill="#2b3a48" />
          </g>
        );
      })}
      <rect x={0} y={92} width={400} height={8} fill="#7cc25a" />
    </svg>
  );
}
