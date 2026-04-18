import Header from '../../components/Header';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Breadcrumb */}
        <div style={breadcrumbStyles.wrapper} aria-label="麵包屑導航">
          <div className="container">
            <nav style={breadcrumbStyles.nav} aria-label="breadcrumb">
              <ol style={breadcrumbStyles.list}>
                <li style={breadcrumbStyles.item}>
                  <Link href="/" style={breadcrumbStyles.link}>首頁</Link>
                </li>
                <li style={breadcrumbStyles.separator} aria-hidden="true">/</li>
                <li style={breadcrumbStyles.item} aria-current="page">
                  <span style={breadcrumbStyles.current}>錄音工作台</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
        {children}
      </main>
      {/* Mobile Bottom Tab Bar */}
      <nav
        style={mobileTabStyles.bar}
        role="navigation"
        aria-label="手機導航列"
      >
        <Link href="/app" style={mobileTabStyles.tabActive} aria-current="page">
          <span style={mobileTabStyles.tabIcon}>🎙️</span>
          <span style={mobileTabStyles.tabLabel}>錄音</span>
        </Link>
        <Link href="/history" style={mobileTabStyles.tab}>
          <span style={mobileTabStyles.tabIcon}>📋</span>
          <span style={mobileTabStyles.tabLabel}>歷史</span>
        </Link>
        <Link href="/dashboard" style={mobileTabStyles.tab}>
          <span style={mobileTabStyles.tabIcon}>📊</span>
          <span style={mobileTabStyles.tabLabel}>儀表板</span>
        </Link>
        <Link href="/settings" style={mobileTabStyles.tab}>
          <span style={mobileTabStyles.tabIcon}>⚙️</span>
          <span style={mobileTabStyles.tabLabel}>設定</span>
        </Link>
      </nav>
    </>
  );
}

const breadcrumbStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    paddingTop: 10,
    paddingBottom: 10,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
  },
  link: {
    fontSize: 13,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color var(--transition)',
  },
  separator: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  current: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
};

const mobileTabStyles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    display: 'flex',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid var(--border)',
    boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: '10px 4px',
    textDecoration: 'none',
    color: 'var(--text-muted)',
    transition: 'color var(--transition)',
  },
  tabActive: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: '10px 4px',
    textDecoration: 'none',
    color: 'var(--primary)',
    transition: 'color var(--transition)',
  },
  tabIcon: {
    fontSize: 20,
    lineHeight: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 600,
  },
};
