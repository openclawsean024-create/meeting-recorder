'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/app', label: '錄音', icon: '🎙️' },
  { href: '/history', label: '歷史', icon: '📋' },
  { href: '/dashboard', label: '儀表板', icon: '📊' },
  { href: '/settings', label: '設定', icon: '⚙️' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header style={styles.header} role="banner">
      <div className="container" style={styles.inner}>
        {/* Logo */}
        <Link href="/" style={styles.logo} aria-label="回首頁">
          <span style={styles.logoIcon}>🎙️</span>
          <span style={styles.logoText}>MeetingMind</span>
        </Link>

        {/* Navigation */}
        <nav style={styles.nav} role="navigation" aria-label="主導覽">
          <ul style={styles.navList} role="list">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      ...styles.navLink,
                      ...(isActive ? styles.navLinkActive : {}),
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* CTA */}
        <div style={styles.cta}>
          <Link href="/app" className="btn btn-primary btn-sm">
            開始使用
          </Link>
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  nav: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  navList: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    listStyle: 'none',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'background var(--transition), color var(--transition)',
  },
  navLinkActive: {
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    fontWeight: 600,
  },
  cta: {
    flexShrink: 0,
  },
};
