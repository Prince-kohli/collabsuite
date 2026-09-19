import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useToastStore } from '../store/useToastStore';
import { forgotPasswordApi } from '../api/auth.api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await forgotPasswordApi(values.email.trim());
      showToast(res.message || 'Reset OTP sent if account exists', 'success');
      setSubmittedEmail(values.email.trim());
      navigate('/reset-password', { state: { email: values.email.trim() } });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send reset OTP', 'error');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Forgot password</h1>
      <p className="text-xs text-slate-500 mb-6">
        Enter your email and we will send a 6-digit OTP to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isSubmitting ? 'Sending...' : 'Send reset OTP'}
        </button>
      </form>

      <p className="mt-6 text-xs text-center text-slate-500">
        Remembered password?{' '}
        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
          Back to login
        </Link>
      </p>

      {submittedEmail ? (
        <p className="mt-2 text-[11px] text-center text-slate-400">
          Continue with OTP for {submittedEmail}
        </p>
      ) : null}
    </div>
  );
};