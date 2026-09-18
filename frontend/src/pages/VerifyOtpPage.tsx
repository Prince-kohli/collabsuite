import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/axios';
import { useToastStore } from '../store/useToastStore';

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});

type OtpFormValues = z.infer<typeof otpSchema>;

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const showToast = useToastStore((state) => state.showToast);

  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema)
  });

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const onSubmit = async (values: OtpFormValues) => {
    try {
      await apiClient.post('/auth/verify-otp', {
        email,
        otp: values.otp
      });
      showToast('Email verified successfully! Please log in.', 'success');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      showToast(message, 'error');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    try {
      setIsResending(true);
      await apiClient.post('/auth/resend-otp', { email });
      showToast('A new OTP has been sent to your email.', 'info');
      setResendTimer(60);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resend OTP.';
      showToast(message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-center text-slate-900">
        Verify your email
      </h2>
      <p className="text-sm text-center text-slate-600 mb-6">
        We sent a 6-digit OTP to <span className="font-semibold text-slate-900">{email}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Enter OTP</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            {...register('otp')}
            className="w-full px-3 py-3 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-center text-2xl tracking-[0.5em] font-semibold"
          />
          {errors.otp && <p className="text-xs text-rose-600 mt-1">{errors.otp.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isSubmitting ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={isResending || resendTimer > 0}
          className="text-sm text-indigo-600 hover:underline font-medium disabled:opacity-50 disabled:no-underline cursor-pointer"
        >
          {isResending
            ? 'Sending...'
            : resendTimer > 0
              ? `Resend OTP in ${resendTimer}s`
              : 'Resend OTP'}
        </button>

        <p className="text-sm text-slate-600">
          Wrong email?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
};