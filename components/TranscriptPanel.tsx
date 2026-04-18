'use client';

import { useState, useRef } from 'react';

interface TranscriptSegment {
  id: number;
  speaker: string;
  text: string;
  timestamp: string;
}

interface SpeakerColor {
  bg: string;
  light: string;
  label: string;
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  speakerColors?: SpeakerColor[];
}

export default function TranscriptPanel({ segments, speakerColors }: TranscriptPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const isEmpty = segments.length === 0;

  const getSpeakerStyle = (speaker: string): { bg: string; light: string } => {
    const colors = speakerColors || [
      { bg: '#8B5CF6', light: '#EDE9FE' },
      { bg: '#3B82F6', light: '#DBEAFE' },
      { bg: '#EC4899', light: '#FCE7F3' },
      { bg: '#10B981', light: '#D1FAE5' },
    ];
    const idx = speaker ? speaker.replace('發言者 ', '').charCodeAt(0) - 65 : 0;
    return colors[idx % colors.length];
  };

  const handleStartEdit = (seg: TranscriptSegment) => {
    setEditingId(seg.id);
    setEditText(seg.text);
  };

  const handleSaveEdit = (id: number) => {
    // In a real app, we'd update the segment here
    setEditingId(null);
    setEditText('');
  };

  const handleTimestampClick = (timestamp: string) => {
    // TODO: sync audio playback to this timestamp
    console.log('Jump to timestamp:', timestamp);
  };

  const handleCopyAll = () => {
    const text = segments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div style={styles.container} ref={panelRef}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.icon}>📝</span>
          <h2 style={styles.title}>逐字稿</h2>
        </div>
        <div style={styles.headerActions}>
          {segments.length > 0 && (
            <>
              <span style={styles.badge}>{segments.length} 段</span>
              <button
                onClick={handleCopyAll}
                className="btn btn-ghost btn-sm"
                aria-label="複製全部逐字稿"
                title="複製"
              >
                📋 複製
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content} role="log" aria-live="polite" aria-label="逐字稿">
        {isEmpty ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🎙️</div>
            <p style={styles.emptyTitle}>尚未開始錄音</p>
            <p style={styles.emptyHint}>
              點擊「開始新錄音」或上傳音檔，系統將即時轉換語音為文字
            </p>
          </div>
        ) : (
          <div style={styles.segments} className="stagger-children">
            {segments.map((seg) => {
              const spkStyle = getSpeakerStyle(seg.speaker);
              const isEditing = editingId === seg.id;

              return (
                <div
                  key={seg.id}
                  className="animate-fadeIn"
                  style={{
                    ...styles.segment,
                    borderLeftColor: spkStyle.bg,
                    background: spkStyle.light,
                  }}
                >
                  {/* Speaker + Timestamp */}
                  <div style={styles.segmentHeader}>
                    <span
                      style={{
                        ...styles.speakerBadge,
                        background: spkStyle.bg,
                      }}
                    >
                      <span style={styles.speakerDot} aria-hidden="true" />
                      {seg.speaker}
                    </span>
                    <span
                      style={styles.timestamp}
                      onClick={() => handleTimestampClick(seg.timestamp)}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.background = 'var(--primary-light)';
                        (e.target as HTMLElement).style.color = 'var(--primary)';
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.background = 'transparent';
                        (e.target as HTMLElement).style.color = 'var(--text-muted)';
                      }}
                      aria-label={`時間戳記：${seg.timestamp}，點擊跳至該時間點`}
                      role="time"
                      title="點擊跳至該時間點"
                    >
                      {seg.timestamp}
                    </span>
                  </div>

                  {/* Text */}
                  {isEditing ? (
                    <div style={styles.editArea}>
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        style={styles.editTextarea}
                        aria-label="編輯逐字稿"
                        autoFocus
                        rows={3}
                      />
                      <div style={styles.editActions}>
                        <button
                          onClick={() => handleSaveEdit(seg.id)}
                          className="btn btn-primary btn-sm"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-ghost btn-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      style={styles.text}
                      onClick={() => handleStartEdit(seg)}
                      title="點擊編輯"
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') handleStartEdit(seg); }}
                    >
                      {seg.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    height: 480,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    background: 'var(--surface)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    background: 'var(--surface-2)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 12,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 8,
    padding: 24,
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  emptyHint: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  segments: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  segment: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 'var(--radius)',
    borderLeft: '3px solid',
    cursor: 'text',
  },
  segmentHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  speakerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '2px 10px 2px 6px',
    borderRadius: 'var(--radius-full)',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
  },
  speakerDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.6)',
    flexShrink: 0,
  },
  timestamp: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    cursor: 'pointer',
    transition: 'color var(--transition)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
  },
  text: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.7,
    wordBreak: 'break-word',
    cursor: 'text',
  },
  editArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  editTextarea: {
    width: '100%',
    padding: '8px 10px',
    background: 'var(--surface)',
    border: '1.5px solid var(--primary)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
  },
  editActions: {
    display: 'flex',
    gap: 8,
  },
};