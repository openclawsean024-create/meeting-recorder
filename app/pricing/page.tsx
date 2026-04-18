'use client';

import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: 'NT$0',
    period: '永久免費',
    description: '適合個人使用，輕鬆紀錄會議',
    features: [
      '每月 30 分鐘轉寫',
      '基本逐字稿編輯',
      'Markdown 匯出',
      '最長 30 分鐘 / 檔案',
      '標準支援',
    ],
    cta: '立即開始',
    href: '/auth',
    highlight: false,
    color: '#64748B',
  },
  {
    name: 'Pro',
    price: 'NT$299',
    period: '/月',
    description: '適合專業人士與小型團隊',
    features: [
      '每月 600 分鐘轉寫',
      'AI 智能分析摘要',
      'PDF / JSON / TXT 匯出',
      '最長 120 分鐘 / 檔案',
      '優先 Email 支援',
      '用量儀表板',
    ],
    cta: '升級 Pro',
    href: '/auth',
    highlight: true,
    color: '#6366F1',
  },
  {
    name: 'Business',
    price: 'NT$799',
    period: '/月',
    description: '適合企業團隊與高效協作',
    features: [
      '每月 2000 分鐘轉寫',
      '團隊成員管理',
      '所有匯出格式',
      'API 整合存取',
      '專屬客服支援',
      '自訂品牌形象',
    ],
    cta: '聯絡我們',
    href: '/auth',
    highlight: false,
    color: '#0F172A',
  },
];

const faqs = [
  {
    q: '分鐘數用完怎麼辦？',
    a: '每月自動重置配額，升級方案即可享有更多分鐘數。',
  },
  {
    q: '可以上傳多長的檔案？',
    a: 'Free 方案最長 30 分鐘，Pro/Business 最長 120 分鐘。',
  },
  {
    q: '音檔隱私如何保障？',
    a: '所有音檔在轉寫後自動刪除，不會用於模型訓練。',
  },
  {
    q: '如何取消訂閱？',
    a: '可隨時在設定頁面取消，次月不再扣款。',
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={styles.header}>
        <div className="container" style={styles.headerInner}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoIcon}>🎙️</span>
            <span style={styles.logoText}>MeetingMind</span>
          </Link>
          <nav style={styles.nav}>
            <Link href="/app" className="btn btn-ghost btn-sm">開始使用</Link>
            <Link href="/auth" className="btn btn-secondary btn-sm">登入</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          <span style={styles.heroBadgeDot} />
          簡單透明的定價
        </div>
        <h1 style={styles.heroTitle}>
          選擇適合你的方案
        </h1>
        <p style={styles.heroSubtitle}>
          從免費方案開始，隨著需求成長再升級。<br />
          所有方案皆無隱藏費用，隨時可取消。
        </p>
      </section>

      {/* Pricing Cards */}
      <section style={styles.cards}>
        <div className="container">
          <div style={styles.cardGrid}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  ...styles.card,
                  ...(plan.highlight ? styles.cardHighlight : {}),
                  borderColor: plan.highlight ? plan.color : 'var(--border)',
                }}
              >
                {plan.highlight && (
                  <div style={styles.popularBadge}>最受歡迎</div>
                )}
                <div style={styles.cardTop}>
                  <div style={styles.planName}>{plan.name}</div>
                  <div style={styles.priceRow}>
                    <span style={{ ...styles.price, color: plan.color }}>{plan.price}</span>
                    <span style={styles.period}>{plan.period}</span>
                  </div>
                  <p style={styles.description}>{plan.description}</p>
                </div>
                <ul style={styles.featureList}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={styles.featureItem}>
                      <span style={{ ...styles.checkIcon, color: plan.color }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="btn btn-lg"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: 'auto',
                    background: plan.highlight ? plan.color : 'var(--surface)',
                    color: plan.highlight ? '#fff' : 'var(--text-primary)',
                    border: plan.highlight ? 'none' : '1.5px solid var(--border)',
                    boxShadow: plan.highlight ? '0 4px 14px rgba(99,102,241,0.35)' : 'var(--shadow-sm)',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={styles.faqSection}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={styles.faqTitle}>常見問題</h2>
          <div style={styles.faqList}>
            {faqs.map((faq, i) => (
              <div key={i} style={styles.faqItem}>
                <h3 style={styles.faqQ}>{faq.q}</h3>
                <p style={styles.faqA}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>準備好開始了嗎？</h2>
        <p style={styles.ctaSubtitle}>免費方案無需信用卡，立即開始使用。</p>
        <Link href="/auth" className="btn btn-primary btn-lg">
          免費開始使用
        </Link>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div className="container" style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <span style={styles.logoIcon}>🎙️</span>
            <span style={styles.logoText}>MeetingMind</span>
          </div>
          <p style={styles.footerCopy}>© {new Date().getFullYear()} MeetingMind. 所有權利保留。</p>
        </div>
      </footer>
    </div>
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
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  nav: { display: 'flex', gap: 8 },
  hero: {
    textAlign: 'center',
    padding: '80px 24px 48px',
    maxWidth: 640,
    margin: '0 auto',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--primary-light)',
    border: '1px solid var(--primary-muted)',
    borderRadius: 'var(--radius-full)',
    padding: '5px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--primary)',
    marginBottom: 20,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--primary)',
  },
  heroTitle: {
    fontSize: 'clamp(28px, 5vw, 44px)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: 16,
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: 17,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
  },
  cards: {
    padding: '0 24px 64px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    maxWidth: 1000,
    margin: '0 auto',
  },
  card: {
    position: 'relative',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    boxShadow: 'var(--shadow-sm)',
  },
  cardHighlight: {
    boxShadow: '0 8px 32px rgba(99,102,241,0.15)',
    transform: 'scale(1.02)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 14px',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
  },
  cardTop: { marginBottom: 20 },
  planName: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 12,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  price: {
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  period: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  description: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: 'var(--text-primary)',
  },
  checkIcon: {
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  faqSection: {
    padding: '48px 24px 80px',
  },
  faqTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-primary)',
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: '-0.02em',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  faqItem: {
    padding: '20px 24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
  faqQ: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  faqA: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
  },
  ctaSection: {
    textAlign: 'center',
    padding: '48px 24px 64px',
    maxWidth: 480,
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: 12,
    letterSpacing: '-0.02em',
  },
  ctaSubtitle: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    marginBottom: 28,
  },
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '24px',
  },
  footerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerCopy: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
};
