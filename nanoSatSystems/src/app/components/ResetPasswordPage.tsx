import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { postJson } from '@/app/auth/api';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setMessage(null);
    setIsSubmitting(true);
    try {
      const { status, data } = await postJson('/auth/reset-password', {
        token,
        newPassword: password,
      });
      if (status === 200) {
        navigate('/login', {
          state: { resetSuccess: true },
          replace: true,
        });
        return;
      }
      const errorMessage =
        data && typeof data === 'object' && 'error' in data
          ? ((data as { error: { message?: string } }).error?.message ?? 'Reset failed.')
          : 'Reset failed.';
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-slate-300">
          Enter your new password. Reset endpoint is not configured yet.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="text-sm text-slate-300" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <label className="text-sm text-slate-300" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          {message && <p className="text-sm text-amber-400">{message}</p>}
          <button
            type="submit"
            className="w-full rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-400">
          <Link to="/login" className="hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
