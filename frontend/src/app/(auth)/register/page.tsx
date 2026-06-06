'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../../lib/api';
import { Package, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const ROLES = [
  { value: 'MARKET_ADMIN', label: 'Market / Shop', desc: 'I buy products from suppliers' },
  { value: 'SUPPLIER_ADMIN', label: 'Supplier / Distributor', desc: 'I sell products to markets' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState('MARKET_ADMIN');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', phone: '+998', email: '', password: '', confirmPassword: '' });

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const validate = () => {
    if (form.username.length < 3) return 'Username must be at least 3 characters';
    if (!/^\+998\d{9}$/.test(form.phone)) return 'Phone must be +998XXXXXXXXX (9 digits after +998)';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) return 'Password must contain a number';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await authApi.register({
        username: form.username,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        role,
      });
      // After register, redirect to verify phone
      router.push(`/verify-phone?phone=${encodeURIComponent(form.phone)}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">SupplyChain UZ</p>
        </div>

        <div className="p-8">
          {step === 'role' ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-4">I am registering as:</p>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition ${
                    role === r.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    role === r.value ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {role === r.value && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{r.label}</p>
                    <p className="text-sm text-gray-400">{r.desc}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => setStep('form')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition mt-2">
                Continue →
              </button>
              <p className="text-center text-sm text-gray-400">
                Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button onClick={() => setStep('role')} type="button"
                className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1">
                ← Back
              </button>

              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
                {ROLES.find(r => r.value === role)?.label}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Username *</label>
                <input value={form.username} onChange={e => set('username', e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="lowercase letters, numbers, underscore" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number * (for OTP verification)</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="+998XXXXXXXXX" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Min 8 chars · uppercase · number</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-xl">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-center text-sm text-gray-400">
                Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
