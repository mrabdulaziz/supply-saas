'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '../../../lib/api';
import { Phone, CheckCircle, RefreshCw } from 'lucide-react';

function VerifyPhoneContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get('phone') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send OTP on mount
  useEffect(() => {
    if (phone) sendOtp();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOtp = async () => {
    setSending(true);
    setError('');
    try {
      await authApi.sendOtp(phone);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    // Auto-verify when all 6 digits filled
    if (next.every(d => d) && next.join('').length === 6) {
      verifyCode(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      verifyCode(pasted);
    }
  };

  const verifyCode = async (otp: string) => {
    setLoading(true);
    setError('');
    try {
      await authApi.verifyOtp(phone, otp);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${success ? 'bg-green-100' : 'bg-blue-100'}`}>
          {success ? <CheckCircle size={26} className="text-green-600" /> : <Phone size={26} className="text-blue-600" />}
        </div>

        {success ? (
          <>
            <h2 className="text-xl font-bold text-gray-900">Phone Verified!</h2>
            <p className="text-gray-400 text-sm mt-1">Redirecting to login...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900">Verify Your Phone</h2>
            <p className="text-gray-400 text-sm mt-1">
              Enter the 6-digit code sent to<br />
              <span className="font-medium text-gray-700">{phone}</span>
            </p>

            <div className="flex gap-2 justify-center my-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {loading && <p className="text-blue-500 text-sm mb-3">Verifying...</p>}

            <div className="text-sm text-gray-400">
              Didn't receive it?{' '}
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <button onClick={sendOtp} disabled={sending}
                  className="text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto">
                  <RefreshCw size={13} className={sending ? 'animate-spin' : ''} />
                  {sending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyPhoneContent />
    </Suspense>
  );
}
