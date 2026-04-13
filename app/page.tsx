'use client';

import { useState, useCallback, useRef } from 'react';
import AudioRecorder from '../components/AudioRecorder';
import TranscriptPanel from '../components/TranscriptPanel';
import AnalysisPanel from '../components/AnalysisPanel';

interface TranscriptSegment {
  id: number;
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

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    decisions: [],
    actionItems: [],
    risks: [],
  });
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const segmentIdRef = useRef(0);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranscriptUpdate = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      const fileName = audioBlob.type === 'audio/mp4' ? 'audio.m4a' : 'audio.webm';
      formData.append('audio', audioBlob, fileName);

      const res = await fetch('/api/transcript', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '轉錄失敗' }));
        console.error('Transcription error:', err.error);
        return;
      }

      const data = await res.json();
      if (!data.text) return;

      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newSegment: TranscriptSegment = {
        id: ++segmentIdRef.current,
        text: data.text.trim(),
        timestamp,
      };

      setTranscript(prev => {
        const updated = [...prev, newSegment];
        // Trigger analysis debounce
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
    } catch (err) {
      console.error('Transcript error:', err);
    }
  }, []);

  const handleExport = async () => {
    const allText = transcript.map(s => s.text).join('\n');
    const content = `# ${meetingTitle || '會議紀錄'}
時間：${new Date().toLocaleString('zh-TW')}

## 逐字稿
${transcript.map(s => `[${s.timestamp}] ${s.text}`).join('\n')}

## 分析摘要
${analysis.summary ? `${analysis.summary}\n` : ''}
### 決策
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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
          🎙️ 會議錄音整理工具
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          邊開會邊逐字稿，自動分析決策・行動項・風險
        </p>
      </div>

      {/* API Key notice */}
      {typeof window !== 'undefined' && (
        <ApiKeyBanner />
      )}

      {/* Meeting title */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="輸入會議主題（選填）"
          value={meetingTitle}
          onChange={e => setMeetingTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#1A1D27',
            border: '1px solid #2D3748',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 15,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2D3748')}
        />
      </div>

      {/* Recorder */}
      <div style={{ marginBottom: 24 }}>
        <AudioRecorder
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={() => setIsRecording(false)}
          onTranscriptUpdate={handleTranscriptUpdate}
        />
      </div>

      {/* Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <TranscriptPanel segments={transcript} />
        <AnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
      </div>

      {/* Export */}
      {transcript.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '11px 28px',
              background: '#4F46E5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4338CA')}
            onMouseLeave={e => (e.currentTarget.style.background = '#4F46E5')}
          >
            📄 匯出 Markdown
          </button>
        </div>
      )}
    </div>
  );
}

function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      background: '#1c1a2e',
      border: '1px solid #4F46E5',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 20,
      fontSize: 13,
      color: '#a5b4fc',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>🔑</span>
      <div style={{ flex: 1, lineHeight: 1.6 }}>
        <strong style={{ color: '#c7d2fe' }}>請設定 OpenAI API Key</strong>
        <br />
        在 Vercel 環境變數或 <code style={{ background: '#2D3748', padding: '1px 5px', borderRadius: 3 }}>.env.local</code> 中設定 <code style={{ background: '#2D3748', padding: '1px 5px', borderRadius: 3 }}>OPENAI_API_KEY</code> 即可開始使用。
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748B',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
