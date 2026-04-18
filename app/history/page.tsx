'use client';

import { useState } from 'react';
import Link from 'next/link';

const historyData = [
  { id: 1, name: '產品策略會議', date: '2026-04-17', duration: '45:32', status: '完成' },
  { id: 2, name: 'Q2 營運 review', date: '2026-04-15', duration: '32:18', status: '完成' },
  { id: 3, name: '技術分享會', date: '2026-04-12', duration: '58:04', status: '完成' },
  { id: 4, name: '客戶需求討論', date: '2026-04-10', duration: '27:55', status: '完成' },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState('');

  const filtered = historyData.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          任務歷史
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          查看所有過往的錄音記錄與逐字稿
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="search"
          placeholder="搜尋會議名稱..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input"
          style={{ maxWidth: 360 }}
          aria-label="搜尋會議"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={emptyStyles.wrapper} className="card animate-fadeIn">
          <div style={emptyStyles.icon}>📋</div>
          <h2 style={emptyStyles.title}>尚無錄音記錄</h2>
          <p style={emptyStyles.desc}>
            開始錄音後，記錄將會顯示在這裡
          </p>
          <Link href="/app" className="btn btn-primary" style={{ marginTop: 8 }}>
            🎙️ 前往錄音
          </Link>
        </div>
      ) : (
        <div className="card animate-fadeIn" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles.table} aria-label="任務歷史">
              <thead>
                <tr style={tableStyles.theadRow}>
                  <th style={tableStyles.th}>會議名稱</th>
                  <th style={tableStyles.th}>日期</th>
                  <th style={tableStyles.th}>時長</th>
                  <th style={tableStyles.th}>狀態</th>
                  <th style={tableStyles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      ...tableStyles.tr,
                      animationDelay: `${idx * 60}ms`,
                    }}
                    className="animate-fadeIn"
                  >
                    <td style={tableStyles.td}>
                      <div style={tableStyles.meetingInfo}>
                        <span style={tableStyles.meetingIcon}>🎙️</span>
                        <span style={tableStyles.meetingName}>{item.name}</span>
                      </div>
                    </td>
                    <td style={tableStyles.td}>
                      <span style={tableStyles.date}>{item.date}</span>
                    </td>
                    <td style={tableStyles.td}>
                      <span style={tableStyles.duration}>{item.duration}</span>
                    </td>
                    <td style={tableStyles.td}>
                      <span style={tableStyles.statusBadge}>{item.status}</span>
                    </td>
                    <td style={tableStyles.td}>
                      <div style={tableStyles.actions}>
                        <button className="btn btn-ghost btn-sm" aria-label="查看">
                          👁️
                        </button>
                        <button className="btn btn-ghost btn-sm" aria-label="下載">
                          📥
                        </button>
                        <button className="btn btn-ghost btn-sm" aria-label="刪除" style={{ color: 'var(--danger)' }}>
                          🗑️
                        </button>
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

const emptyStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  desc: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
};

const tableStyles: Record<string, React.CSSProperties> = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 560,
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
  meetingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  meetingIcon: {
    fontSize: 16,
    flexShrink: 0,
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
    color: 'var(--text-secondary)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
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
