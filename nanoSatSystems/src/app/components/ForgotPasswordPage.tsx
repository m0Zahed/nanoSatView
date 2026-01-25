import { useState } from 'react';
import { Link } from 'react-router';
import { postJson } from '@/app/auth/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const { status } = await postJson('/auth/forgot-password', { email });
      if (status === 200) {
        setMessage('If an account exists, a reset link has been sent.');
        return;
      }
      setMessage('Unable to send reset link. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-300">
          Enter your email address. We will send a reset link when the endpoint is available.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="text-sm text-slate-300" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {message && <p className="text-sm text-amber-400">{message}</p>}
          <button
            type="submit"
            className="w-full rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
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
