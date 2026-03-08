import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#e5e7eb',
        muted: '#f3f4f6',
        card: '#ffffff',
        foreground: '#111827',
        primary: '#111827'
      }
    }
  },
  plugins: []
};

export default config;


export type AuthTokens = {
  refresh: string;
  access: string;
};

export type BackendUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  user: BackendUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
};

export type LogoutPayload = {
  refresh: string;
};

export type GoogleLoginPayload = {
  access_token: string;
};
