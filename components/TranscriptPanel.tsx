'use client';

interface TranscriptSegment {
  id: number;
  text: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
}

export default function TranscriptPanel({ segments }: TranscriptPanelProps) {
  const isEmpty = segments.length === 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.icon}>📝</span>
          <h2 style={styles.title}>逐字稿</h2>
        </div>
        {segments.length > 0 && (
          <span style={styles.badge}>{segments.length} 段</span>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {isEmpty ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🎙️</div>
            <p style={styles.emptyTitle}>尚未開始錄音</p>
            <p style={styles.emptyHint}>
              點擊「開始錄音」按鈕，系統將即時轉換語音為文字
            </p>
          </div>
        ) : (
          <div style={styles.segments}>
            {segments.map((seg) => (
              <div key={seg.id} style={styles.segment} className="animate-fadeIn">
                <span style={styles.timestamp}>{seg.timestamp}</span>
                <span style={styles.text}>{seg.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1A1D27',
    border: '1px solid #2D3748',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    height: 400,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #2D3748',
    flexShrink: 0,
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
    color: '#F1F5F9',
  },
  badge: {
    fontSize: 12,
    color: '#94A3B8',
    background: '#242836',
    padding: '2px 8px',
    borderRadius: 10,
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
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#64748B',
  },
  emptyHint: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 1.6,
  },
  segments: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  segment: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '8px 10px',
    background: '#242836',
    borderRadius: 8,
    borderLeft: '3px solid #4F46E5',
  },
  timestamp: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
    paddingTop: 2,
    minWidth: 60,
  },
  text: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 1.7,
    wordBreak: 'break-word',
  },
};
