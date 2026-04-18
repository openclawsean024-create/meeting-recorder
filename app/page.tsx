import Link from 'next/link';
import Header from '../components/Header';

const features = [
  {
    icon: '🎙️',
    title: '瀏覽器原生錄音',
    desc: '無需安裝任何軟體，開瀏覽器即可錄音。支援拖放上傳 MP3、M4A、WAV、OGG 等格式。',
  },
  {
    icon: '✨',
    title: 'AI 逐字稿',
    desc: '使用 OpenAI Whisper 自動將語音轉為文字，支援中文（台灣）、英文、日文。',
  },
  {
    icon: '🧠',
    title: '智能分析',
    desc: '自動識別決策、行動項與風險，整理成結構化的 Meeting Minutes。',
  },
  {
    icon: '📄',
    title: '多格式匯出',
    desc: '一鍵複製 Markdown、匯出 JSON/TXT，方便匯入任何工具。',
  },
  {
    icon: '📊',
    title: '用量追蹤',
    desc: '直覺的環形儀表板，清楚掌握當月使用量與方案配額。',
  },
  {
    icon: '🔒',
    title: '安全私密',
    desc: '所有錄音與文字資料僅存於你的瀏覽器與 Supabase 資料庫，不會用於任何其他用途。',
  },
];

export default function LandingPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section style={heroStyles.section}>
          <div className="container" style={heroStyles.content}>
            <div style={heroStyles.badge} className="animate-fadeIn">
              <span>✨</span> AI 驅動的會議錄音整理工具
            </div>
            <h1 style={heroStyles.headline} className="animate-fadeIn">
              開會同時做紀錄
              <br />
              <span style={heroStyles.accent}>AI 幫你輕鬆搞定</span>
            </h1>
            <p style={heroStyles.subheadline} className="animate-fadeIn">
              錄音 → 逐字稿 → 智能分析，5 分鐘完成會議紀錄。
              <br />
              告別會後補記的痛苦，專注在真正重要的事。
            </p>
            <div style={heroStyles.ctas} className="animate-fadeIn">
              <Link href="/app" className="btn btn-primary btn-lg">
                <span>🎙️</span> 立即開始錄音
              </Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">
                查看定價方案
              </Link>
            </div>
            <p style={heroStyles.disclaimer} className="animate-fadeIn">
              免費使用，需自備 OpenAI API Key
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={featuresStyles.section}>
          <div className="container">
            <div style={featuresStyles.header}>
              <h2 style={featuresStyles.title}>為何選擇 MeetingMind？</h2>
              <p style={featuresStyles.subtitle}>
                專為亞洲團隊設計的會議錄音工具，深度整合 AI 能力
              </p>
            </div>
            <div style={featuresStyles.grid} className="stagger-children">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="card animate-fadeIn"
                  style={featureCardStyles}
                >
                  <div style={featureIconStyles}>{f.icon}</div>
                  <h3 style={featureTitleStyles}>{f.title}</h3>
                  <p style={featureDescStyles}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={howStyles.section}>
          <div className="container">
            <div style={featuresStyles.header}>
              <h2 style={featuresStyles.title}>三步完成會議紀錄</h2>
            </div>
            <div style={howStyles.steps}>
              {[
                { step: '01', icon: '🎙️', title: '錄音或上傳', desc: '直接用瀏覽器錄音，或拖放上傳已錄好的音檔' },
                { step: '02', icon: '✨', title: 'AI 自動逐字稿', desc: 'Whisper AI 即時將語音轉為文字，支援多語言' },
                { step: '03', icon: '📄', title: '一鍵匯出', desc: '複製 Markdown、匯出 PDF，分享給團隊成員' },
              ].map((s, i) => (
                <div key={i} style={stepStyles}>
                  <div style={stepNumStyles}>{s.step}</div>
                  <div style={stepIconStyles}>{s.icon}</div>
                  <h3 style={stepTitleStyles}>{s.title}</h3>
                  <p style={stepDescStyles}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section style={ctaBannerStyles.section}>
          <div className="container" style={ctaBannerStyles.inner}>
            <h2 style={ctaBannerStyles.title}>準備好提升會議效率了嗎？</h2>
            <p style={ctaBannerStyles.desc}>馬上開始使用，完全免費（需自備 API Key）</p>
            <Link href="/pricing" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
              查看完整定價方案 →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={footerStyles}>
          <div className="container">
            <p style={footerTextStyles}>
              © 2026 MeetingMind · 會議錄音整理工具
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

const heroStyles = {
  section: {
    padding: '80px 0 60px',
    background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
  },
  content: {
    maxWidth: 680,
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 20,
  },
  headline: {
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.15,
    marginBottom: 20,
    letterSpacing: '-0.03em',
  },
  accent: {
    color: 'var(--primary)',
  },
  subheadline: {
    fontSize: 18,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: 32,
  },
  ctas: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
};

const featuresStyles = {
  section: {
    padding: '80px 0',
    background: 'var(--bg)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 48,
  },
  title: {
    fontSize: 'clamp(24px, 3vw, 36px)',
    fontWeight: 800,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
};

const featureCardStyles: React.CSSProperties = {
  padding: '28px 24px',
  transition: 'transform var(--transition), box-shadow var(--transition)',
};

const featureIconStyles: React.CSSProperties = {
  fontSize: 32,
  marginBottom: 16,
};

const featureTitleStyles: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  marginBottom: 8,
};

const featureDescStyles: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
};

const howStyles = {
  section: {
    padding: '80px 0',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 32,
    textAlign: 'center' as const,
  },
};

const stepStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
};

const stepNumStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--primary)',
  background: 'var(--primary-light)',
  padding: '4px 12px',
  borderRadius: 'var(--radius-full)',
  letterSpacing: '0.05em',
};

const stepIconStyles: React.CSSProperties = {
  fontSize: 40,
  margin: '4px 0',
};

const stepTitleStyles: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
};

const stepDescStyles: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
};

const ctaBannerStyles = {
  section: {
    padding: '80px 0',
    background: 'var(--secondary)',
  },
  inner: {
    textAlign: 'center' as const,
  },
  title: {
    fontSize: 'clamp(24px, 3vw, 36px)',
    fontWeight: 800,
    color: '#fff',
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 28,
  },
};

const footerStyles: React.CSSProperties = {
  padding: '24px 0',
  background: 'var(--surface)',
  borderTop: '1px solid var(--border)',
};

const footerTextStyles: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-muted)',
  textAlign: 'center' as const,
};
