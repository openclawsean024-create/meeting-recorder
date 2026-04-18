'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        // Supabase login would go here
        router.push('/app');
      } else {
        // Supabase register would go here
        router.push('/app');
      }
    } catch (err: any) {
      setError(err.message || '認證失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card animate-fadeIn">
        {/* Logo */}
        <Link href="/" style={styles.logo}>
          <span style={styles.logoIcon}>🎙️</span>
          <span style={styles.logoText}>MeetingMind</span>
        </Link>

        {/* Tabs */}
        <div style={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={mode === 'login'}
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => setMode('login')}
          >
            登入
          </button>
          <button
            role="tab"
            aria-selected={mode === 'register'}
            style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
            onClick={() => setMode('register')}
          >
            註冊
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label htmlFor="name" style={styles.label}>名稱</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="你的名字"
                className="input"
                required={mode === 'register'}
                autoComplete="name"
              />
            </div>
          )}

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>密碼</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div style={styles.error} role="alert">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '處理中...' : mode === 'login' ? '登入' : '建立帳戶'}
          </button>
        </form>

        <p style={styles.footer}>
          {mode === 'login' ? '還沒有帳戶？' : '已經有帳戶？'}
          <button
            onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
            style={styles.switchBtn}
          >
            {mode === 'login' ? '註冊' : '登入'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(135deg, var(--bg) 0%, var(--surface) 100%)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    background: 'var(--surface-2)',
    padding: 4,
    borderRadius: 'var(--radius)',
    width: '100%',
  },
  tab: {
    flex: 1,
    padding: '9px',
    borderRadius: 'calc(var(--radius) - 2px)',
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background var(--transition), color var(--transition)',
  },
  tabActive: {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  error: {
    padding: '10px 14px',
    background: 'var(--danger-light)',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    color: 'var(--danger)',
    fontSize: 14,
  },
  footer: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    marginLeft: 4,
  },
};
