'use client';

import { useState } from 'react';
import Header from '../../components/Header';

// Progress Ring Component
function ProgressRing({
  value,
  max,
  size = 160,
  strokeWidth = 14,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  // Color: green → orange → red based on usage
  const ratio = percentage;
  const strokeColor = ratio >= 0.8 ? 'var(--danger)' : ratio >= 0.5 ? 'var(--warning)' : 'var(--accent)';

  return (
    <div style={ringStyles.wrapper} aria-label={`用量：${value} / ${max} ${label}`}>
      <svg
        width={size}
        height={size}
        style={ringStyles.svg}
        role="img"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease',
          }}
        />
      </svg>
      <div style={ringStyles.center}>
        <span style={{ ...ringStyles.value, color: strokeColor }}>
          {value.toLocaleString()}
        </span>
        <span style={ringStyles.max}>/ {max.toLocaleString()}</span>
        <span style={ringStyles.label}>{label}</span>
        {sublabel && <span style={ringStyles.sublabel}>{sublabel}</span>}
      </div>
    </div>
  );
}

const ringStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  svg: {
    transform: 'rotate(0deg)',
  },
  center: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  max: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  sublabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
};

// Plan card
function PlanCard({
  name,
  price,
  quota,
  features,
  isActive,
}: {
  name: string;
  price: string;
  quota: string;
  features: string[];
  isActive: boolean;
}) {
  return (
    <div
      className="card animate-fadeIn"
      style={{
        ...planCardStyles.card,
        ...(isActive ? planCardStyles.active : {}),
      }}
    >
      {isActive && (
        <div style={planCardStyles.activeBadge}>目前方案</div>
      )}
      <h3 style={planCardStyles.planName}>{name}</h3>
      <div style={planCardStyles.price}>
        <span style={planCardStyles.priceNum}>{price}</span>
        <span style={planCardStyles.priceUnit}> /月</span>
      </div>
      <p style={planCardStyles.quota}>{quota}</p>
      <ul style={planCardStyles.features}>
        {features.map((f, i) => (
          <li key={i} style={planCardStyles.feature}>
            <span style={planCardStyles.featureCheck}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

const planCardStyles: Record<string, React.CSSProperties> = {
  card: {
    padding: '28px 24px',
    position: 'relative',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
  },
  active: {
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
  },
  activeBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
  },
  planName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  price: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },
  priceNum: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  priceUnit: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  quota: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 20,
  },
  features: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  featureCheck: {
    color: 'var(--accent)',
    fontWeight: 700,
    flexShrink: 0,
  },
};

// History item
const historyData = [
  { id: 1, name: '產品策略會議', date: '2026-04-17', duration: '45:32', status: '完成' },
  { id: 2, name: 'Q2 營運 review', date: '2026-04-15', duration: '32:18', status: '完成' },
  { id: 3, name: '技術分享會', date: '2026-04-12', duration: '58:04', status: '完成' },
  { id: 4, name: '客戶需求討論', date: '2026-04-10', duration: '27:55', status: '完成' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'usage' | 'history'>('usage');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          用量儀表板
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          追蹤你的使用量與方案配額
        </p>
      </div>

      {/* Tabs */}
      <div style={tabStyles.wrapper} role="tablist" aria-label="儀表板區塊">
        <button
          role="tab"
          aria-selected={activeTab === 'usage'}
          style={{ ...tabStyles.tab, ...(activeTab === 'usage' ? tabStyles.tabActive : {}) }}
          onClick={() => setActiveTab('usage')}
        >
          📊 用量概覽
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'history'}
          style={{ ...tabStyles.tab, ...(activeTab === 'history' ? tabStyles.tabActive : {}) }}
          onClick={() => setActiveTab('history')}
        >
          📋 任務歷史
        </button>
      </div>

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div>
          {/* Progress Rings */}
          <div style={usageStyles.ringsGrid} className="animate-fadeIn">
            <div className="card" style={{ padding: 32 }}>
              <h2 style={sectionTitleStyles}>當月用量</h2>
              <div style={usageStyles.ringRow}>
                <ProgressRing
                  value={1847}
                  max={3000}
                  label="分鐘"
                  sublabel="語音 minutes"
                />
                <div style={usageStyles.ringStats}>
                  <div style={usageStyles.statItem}>
                    <span style={usageStyles.statLabel}>已用</span>
                    <span style={usageStyles.statValue}>1,847 分鐘</span>
                  </div>
                  <div style={usageStyles.statItem}>
                    <span style={usageStyles.statLabel}>剩下</span>
                    <span style={usageStyles.statValue}>1,153 分鐘</span>
                  </div>
                  <div style={usageStyles.statItem}>
                    <span style={usageStyles.statLabel}>使用率</span>
                    <span style={{ ...usageStyles.statValue, color: 'var(--warning)' }}>61.6%</span>
                  </div>
                </div>
              </div>
              {false && (
                <p style={usageStyles.warning}>
                  ⚠️ 即將達到配額上限（80%），建議升級方案
                </p>
              )}
            </div>

            {/* Plan Overview */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={sectionTitleStyles}>方案配額</h2>
              <div style={planGridStyles}>
                <PlanCard
                  name="Free"
                  price="$0"
                  quota="100 分鐘/月"
                  features={['100 分鐘語音', '基礎分析', 'Markdown 匯出']}
                  isActive={false}
                />
                <PlanCard
                  name="Pro"
                  price="$19"
                  quota="3,000 分鐘/月"
                  features={['3,000 分鐘語音', '進階分析', 'PDF 匯出', '優先支援']}
                  isActive={true}
                />
                <PlanCard
                  name="Business"
                  price="$49"
                  quota="10,000 分鐘/月"
                  features={['10,000 分鐘', '完整分析', 'PDF + JSON', '團隊管理', '24/7 支援']}
                  isActive={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card animate-fadeIn">
          <div style={historyStyles.tableWrapper}>
            <table style={historyStyles.table} aria-label="任務歷史">
              <thead>
                <tr style={historyStyles.theadRow}>
                  <th style={historyStyles.th}>會議名稱</th>
                  <th style={historyStyles.th}>日期</th>
                  <th style={historyStyles.th}>時長</th>
                  <th style={historyStyles.th}>狀態</th>
                  <th style={historyStyles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => (
                  <tr key={item.id} style={historyStyles.tr}>
                    <td style={historyStyles.td}>
                      <span style={historyStyles.meetingName}>{item.name}</span>
                    </td>
                    <td style={historyStyles.td}>
                      <span style={historyStyles.date}>{item.date}</span>
                    </td>
                    <td style={historyStyles.td}>
                      <span style={historyStyles.duration}>{item.duration}</span>
                    </td>
                    <td style={historyStyles.td}>
                      <span style={historyStyles.statusBadge}>{item.status}</span>
                    </td>
                    <td style={historyStyles.td}>
                      <div style={historyStyles.actions}>
                        <button className="btn btn-ghost btn-sm">👁️ 查看</button>
                        <button className="btn btn-ghost btn-sm">📥 下載</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 20,
};

const tabStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    gap: 4,
    background: 'var(--surface-2)',
    padding: 4,
    borderRadius: 'var(--radius)',
    marginBottom: 24,
    width: 'fit-content',
  },
  tab: {
    padding: '8px 20px',
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
};

const usageStyles: Record<string, React.CSSProperties> = {
  ringsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 20,
  },
  ringRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  ringStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  warning: {
    marginTop: 16,
    padding: '10px 14px',
    background: 'var(--warning-light)',
    border: '1px solid #FDE68A',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: '#92400E',
  },
};

const planGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginTop: 8,
};

const historyStyles: Record<string, React.CSSProperties> = {
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    borderBottom: '1px solid var(--border)',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
    transition: 'background var(--transition)',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  },
  meetingName: {
    fontWeight: 600,
  },
  date: {
    color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums',
  },
  duration: {
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    background: 'var(--success-light)',
    color: 'var(--accent)',
    borderRadius: 'var(--radius-full)',
    fontSize: 12,
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: 4,
  },
};