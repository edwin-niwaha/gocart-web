'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Mail, ShieldAlert, UploadCloud, User2 } from 'lucide-react';

import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';

type SelectedImage = {
  file: File;
  preview: string;
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
  });

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    setForm({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (selectedImage?.preview) {
        URL.revokeObjectURL(selectedImage.preview);
      }
    };
  }, [selectedImage]);

  const avatarSrc = useMemo(() => {
    if (selectedImage?.preview) return selectedImage.preview;
    if ((user as any)?.avatar_url) return (user as any).avatar_url;
    return null;
  }, [selectedImage, user]);

  const displayName = useMemo(() => {
    const fullName = [form.first_name.trim(), form.last_name.trim()]
      .filter(Boolean)
      .join(' ');

    if (fullName) return fullName;
    if (form.username.trim()) return form.username.trim();
    return 'Your profile';
  }, [form.first_name, form.last_name, form.username]);

  const hasChanges = useMemo(() => {
    if (!user) return false;

    return (
      form.username !== (user.username || '') ||
      form.first_name !== (user.first_name || '') ||
      form.last_name !== (user.last_name || '') ||
      Boolean(selectedImage)
    );
  }, [form, selectedImage, user]);

  function handlePickImage() {
    fileInputRef.current?.click();
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }

    const preview = URL.createObjectURL(file);
    setSelectedImage({ file, preview });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSuccess('');
    setError('');

    try {
      if (!form.username.trim()) {
        throw new Error('Username is required.');
      }

      let updated;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('username', form.username.trim());
        formData.append('first_name', form.first_name.trim());
        formData.append('last_name', form.last_name.trim());
        formData.append('avatar', selectedImage.file);

        updated = await authApi.updateProfile(formData);
      } else {
        updated = await authApi.updateProfileJson({
          username: form.username.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        });
      }

      setUser(updated);
      setSuccess('Profile updated successfully.');
      setSelectedImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const data = err?.response?.data;

      setError(
        err?.message ||
          data?.detail ||
          data?.username?.[0] ||
          data?.first_name?.[0] ||
          data?.last_name?.[0] ||
          data?.avatar?.[0] ||
          'Could not update profile.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
          Profile
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Personal details
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Update your profile photo and personal information used across GoCart.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100">
                  <span className="text-3xl font-black text-slate-700">
                    {(form.username || form.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-black text-slate-900">{displayName}</h2>
              <p className="mt-1 truncate text-sm text-slate-500">{form.email || 'No email address'}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePickImage}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-100"
                >
                  <Camera size={16} />
                  Change photo
                </button>

                {selectedImage ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    <UploadCloud size={14} />
                    New photo selected
                  </span>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-black text-slate-900">Personal information</h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Username
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <User2 size={18} className="text-slate-400" />
                <input
                  className="h-12 w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4">
                <Mail size={18} className="text-slate-400" />
                <input
                  className="h-12 w-full bg-transparent text-sm font-medium text-slate-500 outline-none"
                  value={form.email}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                First name
              </label>
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#127D61] focus:bg-white"
                value={form.first_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Last name
              </label>
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#127D61] focus:bg-white"
                value={form.last_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
                placeholder="Enter last name"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-black text-slate-900">Account details</h3>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-right text-sm font-semibold text-slate-900">
                {user?.email || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">User type</span>
              <span className="text-right text-sm font-semibold text-slate-900">
                {(user as any)?.user_type || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Email verification</span>

              {user && (user as any).is_email_verified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                  <ShieldAlert size={14} />
                  Not verified
                </span>
              )}
            </div>
          </div>
        </div>

        {success ? (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!hasChanges || busy}
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#127D61] px-6 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save changes'}
          </button>

          {!hasChanges ? (
            <span className="text-sm text-slate-500">No changes yet</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}