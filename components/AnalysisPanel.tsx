'use client';

interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
}

interface AnalysisResult {
  decisions: string[];
  actionItems: ActionItem[];
  risks: string[];
  summary?: string;
}

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  isAnalyzing: boolean;
}

function SectionCard({
  icon,
  title,
  color,
  items,
  emptyText,
}: {
  icon: string;
  title: string;
  color: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div style={sectionStyles.card}>
      <div style={{ ...sectionStyles.header, borderLeftColor: color }}>
        <span style={sectionStyles.icon}>{icon}</span>
        <h3 style={{ ...sectionStyles.title, color }}>{title}</h3>
        {items.length > 0 && (
          <span style={{ ...sectionStyles.count, background: color + '22', color }}>
            {items.length}
          </span>
        )}
      </div>
      <div style={sectionStyles.body}>
        {items.length === 0 ? (
          <p style={sectionStyles.empty}>{emptyText}</p>
        ) : (
          <ul style={sectionStyles.list}>
            {items.map((item, i) => (
              <li key={i} style={sectionStyles.item}>
                <span style={{ ...sectionStyles.dot, background: color }} />
                <span style={sectionStyles.itemText}>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const sectionStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#242836',
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #2D3748',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderLeft: '3px solid',
    background: '#1A1D27',
  },
  icon: {
    fontSize: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flex: 1,
  },
  count: {
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 7px',
    borderRadius: 10,
  },
  body: {
    padding: '10px 14px',
  },
  empty: {
    fontSize: 13,
    color: '#4A5568',
    fontStyle: 'italic',
    margin: 0,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 1.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 5,
  },
  itemText: {
    flex: 1,
    wordBreak: 'break-word',
  },
};

export default function AnalysisPanel({ analysis, isAnalyzing }: AnalysisPanelProps) {
  const isEmpty =
    !analysis.decisions?.length &&
    !analysis.actionItems?.length &&
    !analysis.risks?.length;

  const decisions = analysis.decisions || [];
  const actionItems = analysis.actionItems || [];
  const risks = analysis.risks || [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.icon}>🧠</span>
          <h2 style={styles.title}>智能分析</h2>
        </div>
        {isAnalyzing && (
          <div style={styles.analyzingBadge}>
            <span style={styles.spinner} />
            分析中...
          </div>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {isEmpty && !isAnalyzing ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📊</div>
            <p style={styles.emptyTitle}>尚無分析結果</p>
            <p style={styles.emptyHint}>
              開始錄音並說話，系統將自動分析會議內容
            </p>
          </div>
        ) : (
          <div style={styles.sections}>
            {/* Summary */}
            {analysis.summary && (
              <div style={{ ...sectionStyles.card, marginBottom: 12 }}>
                <div style={{ ...sectionStyles.header, borderLeftColor: '#8B5CF6' }}>
                  <span style={sectionStyles.icon}>📋</span>
                  <h3 style={{ ...sectionStyles.title, color: '#8B5CF6' }}>摘要</h3>
                </div>
                <div style={{ ...sectionStyles.body, paddingTop: 8 }}>
                  <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>
                    {analysis.summary}
                  </p>
                </div>
              </div>
            )}

            <SectionCard
              icon="✅"
              title="決策"
              color="#22C55E"
              items={decisions}
              emptyText="尚無決策記錄"
            />

            <SectionCard
              icon="📌"
              title="行動項"
              color="#F59E0B"
              items={actionItems.map((a) => {
                let text = a.task;
                if (a.assignee) text += ` @${a.assignee}`;
                if (a.deadline) text += ` ⏰ ${a.deadline}`;
                return text;
              })}
              emptyText="尚無行動項目"
            />

            <SectionCard
              icon="⚠️"
              title="風險"
              color="#EF4444"
              items={risks}
              emptyText="尚無風險記錄"
            />
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
  analyzingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#4F46E5',
    background: '#4F46E522',
    padding: '4px 10px',
    borderRadius: 10,
    fontWeight: 500,
  },
  spinner: {
    display: 'inline-block',
    width: 10,
    height: 10,
    border: '2px solid #4F46E5',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
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
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
};
