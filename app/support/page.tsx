'use client';

import { FormEvent, useState } from 'react';
import { supportApi } from '@/lib/api/services';
import { useTenant } from '@/app/providers/TenantProvider';

export default function SupportPage() {
  const { settings } = useTenant() || {};

  const [state, setState] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (field: keyof typeof state, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await supportApi.create(state);
      setSuccess('Message sent successfully.');
      setState({ name: '', email: '', message: '' });
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to send message.'
      );
    } finally {
      setLoading(false);
    }
  };

  const hasChat = Boolean(settings?.support_chat_url);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <h1 className="section-title">Support</h1>

      <form onSubmit={onSubmit} className="card space-y-4">
        <input
          className="input"
          placeholder="Name"
          value={state.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <input
          className="input"
          type="email"
          placeholder="Email"
          value={state.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />

        <textarea
          className="input min-h-40"
          placeholder="Message"
          value={state.message}
          onChange={(e) => handleChange('message', e.target.value)}
        />

        <button className="btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send message'}
        </button>

        {success && <p className="subtle text-emerald-600">{success}</p>}
        {error && <p className="subtle text-red-600">{error}</p>}
      </form>

      {hasChat && (
        <a
          href={settings!.support_chat_url}
          className="btn btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open support chat
        </a>
      )}
    </div>
  );
}