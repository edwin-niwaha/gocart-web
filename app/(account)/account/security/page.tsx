'use client';

import { FormEvent, useState } from 'react';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function SecurityPage() {
  const { user } = useAuthStore();

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [busy, setBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      if (
        !passwordForm.current_password.trim() ||
        !passwordForm.new_password.trim() ||
        !passwordForm.new_password_confirm.trim()
      ) {
        throw new Error('Please complete all password fields.');
      }

      if (passwordForm.new_password !== passwordForm.new_password_confirm) {
        throw new Error('New passwords do not match.');
      }

      await authApi.changePassword(passwordForm);

      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (err: any) {
      const data = err?.response?.data;
      setPasswordError(
        err?.message ||
          data?.detail ||
          data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.new_password_confirm?.[0] ||
          'Could not change password.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setVerifyBusy(true);
    setVerifyMessage('');
    setVerifyError('');

    try {
      await authApi.sendEmailVerification();
      setVerifyMessage('Verification code sent successfully.');
    } catch (err: any) {
      setVerifyError(err?.response?.data?.detail || 'Could not send verification code.');
    } finally {
      setVerifyBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
          Security
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Security settings</h1>
        <p className="mt-2 text-slate-600">
          Manage your password and email verification settings.
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Email verification</h2>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <span className="font-semibold">{user?.email}</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resendVerification}
            disabled={verifyBusy}
            className="btn bg-[#127D61] text-white disabled:opacity-60"
          >
            {verifyBusy ? 'Sending...' : 'Resend verification code'}
          </button>
        </div>

        {verifyMessage ? (
          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {verifyMessage}
          </p>
        ) : null}

        {verifyError ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {verifyError}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={onChangePassword}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-black text-slate-900">Change password</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose a strong password to keep your account secure.
        </p>

        <div className="mt-5 grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Current password</label>
            <input
              type="password"
              className="input w-full"
              value={passwordForm.current_password}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  current_password: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">New password</label>
            <input
              type="password"
              className="input w-full"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  new_password: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Confirm new password</label>
            <input
              type="password"
              className="input w-full"
              value={passwordForm.new_password_confirm}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  new_password_confirm: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {passwordSuccess ? (
          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {passwordSuccess}
          </p>
        ) : null}

        {passwordError ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {passwordError}
          </p>
        ) : null}

        <div className="mt-6">
          <button
            type="submit"
            disabled={busy}
            className="btn bg-[#127D61] text-white disabled:opacity-60"
          >
            {busy ? 'Updating...' : 'Change password'}
          </button>
        </div>
      </form>
    </div>
  );
}