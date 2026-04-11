'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/services';
import type { TenantBranding, TenantSettings } from '@/lib/types';

const initialBranding: TenantBranding = { app_name: '', hero_title: '', hero_subtitle: '', primary_color: '#127D61', secondary_color: '#F79420', accent_color: '#0f766e', logo: '' };
const initialSettings: TenantSettings = { support_chat_url: '', website_url: '', terms_url: '', privacy_url: '', maintenance_mode: false };

export default function BrandingPage() {
  const [branding, setBranding] = useState<TenantBranding>(initialBranding);
  const [settings, setSettings] = useState<TenantSettings>(initialSettings);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([adminApi.branding().catch(() => initialBranding), adminApi.settings().catch(() => initialSettings)]).then(([brandingData, settingsData]) => {
      setBranding({ ...initialBranding, ...brandingData });
      setSettings({ ...initialSettings, ...settingsData });
    });
  }, []);

  const save = async () => {
    await adminApi.updateBranding(branding);
    await adminApi.updateSettings(settings);
    setMessage('Branding and store settings saved.');
  };

  return (
    <div className="space-y-6 py-6">
      <div className="card">
        <p className="badge">White-label branding</p>
        <h1 className="mt-3 text-3xl font-black">Branding and store settings</h1>
        <p className="mt-2 subtle">Preview your tenant branding before shipping a branded web or mobile experience.</p>
      </div>
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border p-3" placeholder="App name" value={branding.app_name || ''} onChange={(e) => setBranding((v) => ({ ...v, app_name: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Logo URL" value={branding.logo || ''} onChange={(e) => setBranding((v) => ({ ...v, logo: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Hero title" value={branding.hero_title || ''} onChange={(e) => setBranding((v) => ({ ...v, hero_title: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Hero subtitle" value={branding.hero_subtitle || ''} onChange={(e) => setBranding((v) => ({ ...v, hero_subtitle: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Primary color" value={branding.primary_color || ''} onChange={(e) => setBranding((v) => ({ ...v, primary_color: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Accent color" value={branding.accent_color || ''} onChange={(e) => setBranding((v) => ({ ...v, accent_color: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Website URL" value={settings.website_url || ''} onChange={(e) => setSettings((v) => ({ ...v, website_url: e.target.value }))} />
            <label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(settings.maintenance_mode)} onChange={(e) => setSettings((v) => ({ ...v, maintenance_mode: e.target.checked }))} /> Maintenance mode</label>
          </div>
          <button type="button" onClick={save} className="rounded-2xl bg-[#127D61] px-5 py-3 text-sm font-bold text-white">Save branding</button>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-[2rem] p-6 text-white" style={{ background: `linear-gradient(135deg, ${branding.primary_color || '#127D61'}, ${branding.accent_color || '#0f766e'})` }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Preview</p>
            <h2 className="mt-4 text-3xl font-black">{branding.app_name || 'GoCart'}</h2>
            <p className="mt-2 text-lg font-semibold">{branding.hero_title || 'Modern ordering for your customers'}</p>
            <p className="mt-2 text-sm opacity-90">{branding.hero_subtitle || 'Customize your storefront, manage staff, and launch your tenant brand.'}</p>
          </div>
          <div className="mt-4 text-sm text-slate-600">Website: {settings.website_url || 'Not set'}</div>
          <div className="mt-2 text-sm text-slate-600">Maintenance mode: {settings.maintenance_mode ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>
    </div>
  );
}
