'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/services';
import type { TenantBranding, TenantSettings } from '@/lib/types';

const initialBranding: TenantBranding = {
  app_name: '',
  hero_title: '',
  hero_subtitle: '',
  primary_color: '#127D61',
  secondary_color: '#F79420',
  accent_color: '#0f766e',
  logo: '',
};

const initialSettings: TenantSettings = {
  support_chat_url: '',
  website_url: '',
  terms_url: '',
  privacy_url: '',
  maintenance_mode: false,
};

export default function BrandingPage() {
  const [branding, setBranding] = useState<TenantBranding>(initialBranding);
  const [settings, setSettings] = useState<TenantSettings>(initialSettings);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [brandingData, settingsData] = await Promise.all([
          adminApi.branding().catch(() => initialBranding),
          adminApi.settings().catch(() => initialSettings),
        ]);

        setBranding({ ...initialBranding, ...brandingData });
        setSettings({ ...initialSettings, ...settingsData });
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            'Failed to load branding settings.'
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await adminApi.updateBranding(branding);
      await adminApi.updateSettings(settings);
      setMessage('Branding and store settings saved successfully.');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Failed to save branding settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = <K extends keyof TenantBranding>(
    key: K,
    value: TenantBranding[K]
  ) => {
    setBranding((current) => ({ ...current, [key]: value }));
  };

  const updateSettings = <K extends keyof TenantSettings>(
    key: K,
    value: TenantSettings[K]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-5 py-4">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#127D61] via-[#0f766e] to-[#073b32] p-5 text-white shadow-md md:p-6">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-[#F79420]/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
              White-label branding
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">
              Branding and store settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">
              Customize storefront identity, links, colors, and customer-facing settings.
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#127D61] shadow-md transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          Loading branding settings…
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">
              Brand identity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These details appear on the tenant storefront.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="App name">
              <input
                className="input h-11 rounded-xl text-sm"
                placeholder="GoCart"
                value={branding.app_name || ''}
                onChange={(e) => updateBranding('app_name', e.target.value)}
              />
            </Field>

            <Field label="Logo URL">
              <input
                className="input h-11 rounded-xl text-sm"
                placeholder="https://example.com/logo.png"
                value={branding.logo || ''}
                onChange={(e) => updateBranding('logo', e.target.value)}
              />
            </Field>

            <Field label="Hero title">
              <input
                className="input h-11 rounded-xl text-sm"
                placeholder="Modern ordering for your customers"
                value={branding.hero_title || ''}
                onChange={(e) => updateBranding('hero_title', e.target.value)}
              />
            </Field>

            <Field label="Hero subtitle">
              <input
                className="input h-11 rounded-xl text-sm"
                placeholder="Customize your storefront and launch your tenant brand."
                value={branding.hero_subtitle || ''}
                onChange={(e) => updateBranding('hero_subtitle', e.target.value)}
              />
            </Field>

            <ColorField
              label="Primary color"
              value={branding.primary_color || '#127D61'}
              onChange={(value) => updateBranding('primary_color', value)}
            />

            <ColorField
              label="Secondary color"
              value={branding.secondary_color || '#F79420'}
              onChange={(value) => updateBranding('secondary_color', value)}
            />

            <ColorField
              label="Accent color"
              value={branding.accent_color || '#0f766e'}
              onChange={(value) => updateBranding('accent_color', value)}
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-lg font-black text-slate-900">
              Store settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage public links and availability.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Website URL">
                <input
                  className="input h-11 rounded-xl text-sm"
                  placeholder="https://yourstore.com"
                  value={settings.website_url || ''}
                  onChange={(e) => updateSettings('website_url', e.target.value)}
                />
              </Field>

              <Field label="Support chat URL">
                <input
                  className="input h-11 rounded-xl text-sm"
                  placeholder="https://wa.me/..."
                  value={settings.support_chat_url || ''}
                  onChange={(e) =>
                    updateSettings('support_chat_url', e.target.value)
                  }
                />
              </Field>

              <Field label="Terms URL">
                <input
                  className="input h-11 rounded-xl text-sm"
                  placeholder="https://yourstore.com/terms"
                  value={settings.terms_url || ''}
                  onChange={(e) => updateSettings('terms_url', e.target.value)}
                />
              </Field>

              <Field label="Privacy URL">
                <input
                  className="input h-11 rounded-xl text-sm"
                  placeholder="https://yourstore.com/privacy"
                  value={settings.privacy_url || ''}
                  onChange={(e) => updateSettings('privacy_url', e.target.value)}
                />
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50 md:col-span-2">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Maintenance mode
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Pause storefront access while updating the tenant experience.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenance_mode)}
                  onChange={(e) =>
                    updateSettings('maintenance_mode', e.target.checked)
                  }
                  className="h-5 w-5 rounded border-slate-300 text-[#127D61] focus:ring-[#127D61]"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Review the preview before saving.
            </p>

            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="rounded-xl bg-[#127D61] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0f6f57] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save branding'}
            </button>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div
            className="overflow-hidden rounded-2xl text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${
                branding.primary_color || '#127D61'
              }, ${branding.accent_color || '#0f766e'})`,
            }}
          >
            <div className="relative p-5">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-10 left-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-base font-black">
                    {branding.logo ? (
                      <img
                        src={branding.logo}
                        alt="Brand logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (branding.app_name || 'G').slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">
                      Preview
                    </p>

                    <h2 className="text-lg font-black">
                      {branding.app_name || 'GoCart'}
                    </h2>
                  </div>
                </div>

                <h3 className="mt-6 text-2xl font-black leading-tight">
                  {branding.hero_title ||
                    'Modern ordering for your customers'}
                </h3>

                <p className="mt-2 text-sm leading-6 opacity-90">
                  {branding.hero_subtitle ||
                    'Customize your storefront, manage staff, and launch your tenant brand.'}
                </p>

                <button
                  type="button"
                  className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold shadow-md"
                  style={{ color: branding.primary_color || '#127D61' }}
                >
                  Start ordering
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3">
            <PreviewRow label="Website" value={settings.website_url || 'Not set'} />
            <PreviewRow
              label="Support"
              value={settings.support_chat_url || 'Not set'}
            />
            <PreviewRow label="Terms" value={settings.terms_url || 'Not set'} />
            <PreviewRow
              label="Privacy"
              value={settings.privacy_url || 'Not set'}
            />
            <PreviewRow
              label="Maintenance"
              value={settings.maintenance_mode ? 'Enabled' : 'Disabled'}
              highlight={settings.maintenance_mode}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-4 focus-within:ring-emerald-100">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1"
        />

        <input
          className="flex-1 border-0 px-3 text-sm font-semibold text-slate-700 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

function PreviewRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>

      <span
        className={`max-w-[160px] truncate rounded-full px-2.5 py-1 text-right text-[11px] font-black ${
          highlight
            ? 'bg-orange-100 text-orange-700'
            : 'bg-white text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}