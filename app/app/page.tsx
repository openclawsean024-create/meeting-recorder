'use client';

import { useState, useCallback, useRef } from 'react';
import AudioRecorder from '../../components/AudioRecorder';
import TranscriptPanel from '../../components/TranscriptPanel';
import AnalysisPanel from '../../components/AnalysisPanel';
import Header from '../../components/Header';

interface TranscriptSegment {
  id: number;
  speaker: string;
  text: string;
  timestamp: string;
}

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

type WorkbenchMode = 'idle' | 'recording' | 'transcribing';

// Color mapping for speakers
const SPEAKER_COLORS = [
  { bg: '#8B5CF6', light: '#EDE9FE', label: '發言者 A' },
  { bg: '#3B82F6', light: '#DBEAFE', label: '發言者 B' },
  { bg: '#EC4899', light: '#FCE7F3', label: '發言者 C' },
  { bg: '#10B981', light: '#D1FAE5', label: '發言者 D' },
  { bg: '#F59E0B', light: '#FEF3C7', label: '發言者 E' },
  { bg: '#EF4444', light: '#FEE2E2', label: '發言者 F' },
];

export default function AppPage() {
  const [mode, setMode] = useState<WorkbenchMode>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    decisions: [],
    actionItems: [],
    risks: [],
  });
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const segmentIdRef = useRef(0);
  const speakerIndexRef = useRef(0);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranscriptUpdate = useCallback(async (audioBlob: Blob) => {
    setMode('transcribing');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const fileName = audioBlob.type === 'audio/mp4' ? 'audio.m4a' : 'audio.webm';
      formData.append('audio', audioBlob, fileName);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 85));
      }, 500);

      const res = await fetch('/api/transcript', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '轉錄失敗' }));
        console.error('Transcription error:', err.error);
        setMode('idle');
        return;
      }

      const data = await res.json();
      if (!data.text) {
        setMode('idle');
        return;
      }

      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      // Rotate through speaker colors
      const speakerIdx = speakerIndexRef.current % SPEAKER_COLORS.length;
      const speaker = SPEAKER_COLORS[speakerIdx].label;
      speakerIndexRef.current++;

      const newSegment: TranscriptSegment = {
        id: ++segmentIdRef.current,
        speaker,
        text: data.text.trim(),
        timestamp,
      };

      setTranscript(prev => {
        const updated = [...prev, newSegment];
        if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
        analyzeTimeoutRef.current = setTimeout(async () => {
          const allText = updated.map(s => s.text).join(' ');
          if (allText.length < 20) return;
          setIsAnalyzing(true);
          try {
            const analyzeRes = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: allText }),
            });
            if (analyzeRes.ok) {
              const analysisData = await analyzeRes.json();
              setAnalysis(analysisData);
            }
          } catch (e) {
            console.error('Analysis error:', e);
          } finally {
            setIsAnalyzing(false);
          }
        }, 4000);
        return updated;
      });

      setMode('idle');
    } catch (err) {
      console.error('Transcript error:', err);
      setMode('idle');
    }
  }, []);

  const handleExport = async () => {
    const allText = transcript.map(s => s.text).join('\n');
    const content = `# ${meetingTitle || '會議紀錄'}
時間：${new Date().toLocaleString('zh-TW')}

## 逐字稿
${transcript.map(s => `**[${s.speaker}]** [${s.timestamp}] ${s.text}`).join('\n')}

## 分析摘要
${analysis.summary ? `${analysis.summary}\n\n` : ''}### 決策
${analysis.decisions?.length ? analysis.decisions.map(d => `- ${d}`).join('\n') : '（無）'}

### 行動項
${analysis.actionItems?.length
  ? analysis.actionItems.map(a => {
      let s = `- ${a.task}`;
      if (a.assignee) s += ` @${a.assignee}`;
      if (a.deadline) s += ` ⏰ ${a.deadline}`;
      return s;
    }).join('\n')
  : '（無）'}

### 風險
${analysis.risks?.length ? analysis.risks.map(r => `- ${r}`).join('\n') : '（無）'}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          錄音工作台
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          錄音、上傳音檔，AI 自動產生逐字稿與智能分析
        </p>
      </div>

      {/* API Key notice */}
      <ApiKeyBanner />

      {/* Meeting title */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="輸入會議主題（選填）"
          value={meetingTitle}
          onChange={e => setMeetingTitle(e.target.value)}
          className="input"
          style={{ maxWidth: 480 }}
          aria-label="會議主題"
        />
      </div>

      {/* Workbench Mode Indicator */}
      <div style={modeIndicatorStyles.wrapper} role="status" aria-live="polite">
        {mode === 'idle' && (
          <span style={modeIndicatorStyles.idle}>
            <span style={modeIndicatorStyles.dot} />
            待命中
          </span>
        )}
        {mode === 'recording' && (
          <span style={modeIndicatorStyles.recording}>
            <span style={modeIndicatorStyles.recordingDot} />
            錄音中
          </span>
        )}
        {mode === 'transcribing' && (
          <span style={modeIndicatorStyles.transcribing}>
            <span className="animate-spin" style={modeIndicatorStyles.spinner} />
            轉寫中...
          </span>
        )}
      </div>

      {/* Upload Zone — shown in idle mode */}
      {mode === 'idle' && !isRecording && (
        <div style={uploadZoneStyles.wrapper} role="region" aria-label="上傳音檔">
          <div style={uploadZoneStyles.content}>
            <div style={uploadZoneStyles.icon}>🎤</div>
            <h2 style={uploadZoneStyles.title}>開始新錄音或上傳音檔</h2>
            <p style={uploadZoneStyles.hint}>
              拖放音訊檔案至此，或使用下方按鈕
            </p>
            <p style={uploadZoneStyles.formats}>
              支援 MP3, M4A, WAV, OGG，最大 120 分鐘
            </p>
          </div>
        </div>
      )}

      {/* Audio Recorder — recording mode */}
      <div style={{ marginBottom: 24 }}>
        <AudioRecorder
          isRecording={isRecording}
          onStartRecording={() => { setIsRecording(true); setMode('recording'); }}
          onStopRecording={() => { setIsRecording(false); }}
          onTranscriptUpdate={handleTranscriptUpdate}
        />
      </div>

      {/* Transcribing progress */}
      {mode === 'transcribing' && (
        <div style={transcribingStyles.wrapper} role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
          <div style={transcribingStyles.content}>
            <div className="animate-spin" style={transcribingStyles.spinner}>⏳</div>
            <div>
              <p style={transcribingStyles.label}>AI 轉寫中...</p>
              <div style={transcribingStyles.progressBar}>
                <div style={{ ...transcribingStyles.progressFill, width: `${uploadProgress}%` }} />
              </div>
              <p style={transcribingStyles.subLabel}>預計完成：約 1 分鐘</p>
            </div>
          </div>
        </div>
      )}

      {/* Panels */}
      {transcript.length > 0 && (
        <div style={panelsStyles.grid}>
          <TranscriptPanel segments={transcript} speakerColors={SPEAKER_COLORS} />
          <AnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
        </div>
      )}

      {/* Export */}
      {transcript.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button onClick={handleExport} className="btn btn-primary">
            📄 匯出 Markdown
          </button>
        </div>
      )}
    </div>
  );
}

function ApiKeyBanner() {
  return (
    <div style={bannerStyles.wrapper} role="alert">
      <span style={bannerStyles.icon}>🔑</span>
      <div style={bannerStyles.content}>
        <strong style={bannerStyles.strong}>請設定 OpenAI API Key</strong>
        <br />
        在 Vercel 環境變數設定 <code style={bannerStyles.code}>OPENAI_API_KEY</code> 即可開始使用。
      </div>
    </div>
  );
}

// Styles
const modeIndicatorStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 600,
  },
  idle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-secondary)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--border-strong)',
  },
  recording: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--danger)',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--danger)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  transcribing: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--primary)',
  },
  spinner: {
    display: 'inline-block',
    fontSize: 16,
  },
};

const uploadZoneStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 24px',
    textAlign: 'center',
    marginBottom: 24,
    background: 'var(--surface)',
    transition: 'border-color var(--transition), background var(--transition)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
    animation: 'float 3s ease-in-out infinite',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  hint: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  formats: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
};

const transcribingStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    marginBottom: 24,
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  spinner: {
    fontSize: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginBottom: 6,
    width: 280,
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.5s ease',
  },
  subLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
};

const panelsStyles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
};

const bannerStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: 'var(--primary-light)',
    border: '1px solid var(--primary-muted)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
    marginBottom: 24,
    fontSize: 13,
    color: 'var(--primary)',
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
    marginTop: 1,
  },
  content: {
    flex: 1,
    lineHeight: 1.7,
  },
  strong: {
    color: 'var(--primary-hover)',
  },
  code: {
    background: 'rgba(99,102,241,0.12)',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
  },
};