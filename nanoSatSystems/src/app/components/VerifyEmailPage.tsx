import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { getJson, postJson } from '@/app/auth/api';

export function VerifyEmailPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sent = params.get('sent') === '1';
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(() =>
    token ? 'loading' : 'idle'
  );
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState('');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    const run = async () => {
      setStatus('loading');
      const { status: responseStatus, data } = await getJson(`/auth/verify-email?token=${encodeURIComponent(token)}`);
      if (!isActive) return;
      if (responseStatus === 200) {
        setStatus('success');
        setMessage('Email verified. You can sign in now.');
        return;
      }
      const errorMessage =
        data && typeof data === 'object' && 'error' in data
          ? ((data as { error: { message?: string } }).error?.message ??
              'Verification link is invalid or expired.')
          : 'Verification link is invalid or expired.';
      setStatus('error');
      setMessage(errorMessage);
    };
    run();
    return () => {
      isActive = false;
    };
  }, [token]);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();
    setResendMessage('');
    setIsResending(true);
    try {
      const { status: responseStatus } = await postJson('/auth/resend-verification', { email });
      if (responseStatus === 200) {
        setResendMessage('If an account exists, a new verification email has been sent.');
      } else {
        setResendMessage('Unable to resend verification email. Please try again later.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <p className="mt-3 text-sm text-slate-300">
          {sent ? 'We sent a verification link to your email address. Please check your inbox.' : ''}
        </p>
        {token && (
          <p className="mt-3 text-sm text-slate-300">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
        )}

        {!token && !sent && (
          <p className="mt-3 text-sm text-slate-300">
            Please check your email for a verification link.
          </p>
        )}

        <div className="mt-6 border-t border-slate-800 pt-4">
          <h2 className="text-sm font-semibold">Resend verification email</h2>
          <form onSubmit={handleResend} className="mt-3 space-y-3">
            <label className="text-sm text-slate-300" htmlFor="resend-email">
              Email
            </label>
            <input
              id="resend-email"
              type="email"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {resendMessage && <p className="text-xs text-slate-400">{resendMessage}</p>}
            <button
              type="submit"
              className="w-full rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900"
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend email'}
            </button>
          </form>
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <Link to="/login" className="text-blue-400 hover:underline">
            Back to Sign In
          </Link>
          <Link to="/" className="text-slate-400 hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
