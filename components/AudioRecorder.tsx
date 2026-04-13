'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTranscriptUpdate: (audioBlob: Blob) => void;
}

const CHUNK_INTERVAL_MS = 30000; // Send chunk every 30 seconds

export default function AudioRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  onTranscriptUpdate,
}: AudioRecorderProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopAllTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
  };

  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (blob.size > 0) {
          onTranscriptUpdate(blob);
        }
        audioChunksRef.current = [];
      };

      recorder.start(1000); // Collect data frequently
      onStartRecording();
      setRecordingDuration(0);
      isPausedRef.current = false;

      // Duration timer
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          setRecordingDuration(d => d + 1);
        }
      }, 1000);

      // Chunk timer - send audio periodically
      chunkTimerRef.current = setInterval(() => {
        if (!isPausedRef.current && recorder.state === 'recording') {
          recorder.stop();
          setTimeout(() => {
            if (streamRef.current && recorder.state === 'inactive') {
              const mimeType = getSupportedMimeType();
              const newRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
              mediaRecorderRef.current = newRecorder;
              newRecorder.start(1000);
            }
          }, 100);
        }
      }, CHUNK_INTERVAL_MS);

    } catch (err) {
      console.error('Mic access error:', err);
      setError('無法存取麥克風，請確認已授權麥克風權限。');
    }
  }, [onStartRecording, onTranscriptUpdate]);

  const stopRecording = useCallback(() => {
    stopAllTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    onStopRecording();
    setIsPaused(false);
    isPausedRef.current = false;
  }, [onStopRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported) {
    return (
      <div style={styles.card}>
        <div style={{ ...styles.alert, background: '#7f1d1d', border: '1px solid #991b1b' }}>
          ⚠️ 您的瀏覽器不支援錄音功能，請使用 Chrome、Edge 或 Firefox。
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {error && (
        <div style={{ ...styles.alert, background: '#7f1d1d', border: '1px solid #991b1b', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!isRecording ? (
        <button
          onClick={startRecording}
          style={styles.recordBtn}
          onMouseEnter={e => (e.currentTarget.style.background = '#22C55E')}
          onMouseLeave={e => (e.currentTarget.style.background = '#16a34a')}
        >
          <span style={styles.micIcon}>🎙️</span>
          開始錄音
        </button>
      ) : (
        <div style={styles.recordingArea}>
          {/* Recording indicator */}
          <div style={styles.recordingHeader}>
            <div style={styles.recordingDot}>
              <div style={styles.pulseRing} />
            </div>
            <span style={styles.recordingText}>
              {isPaused ? '⏸️ 暫停中' : '🔴 錄音中'}
            </span>
            <span style={styles.duration}>{formatDuration(recordingDuration)}</span>
          </div>

          {/* Waveform visualizer */}
          <div style={styles.waveform}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.waveBar,
                  animationDelay: `${i * 0.05}s`,
                  height: isPaused ? 4 : `${Math.random() * 32 + 8}px`,
                  background: isPaused ? '#64748B' : '#4F46E5',
                  opacity: isPaused ? 0.4 : 0.8,
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              style={styles.secondaryBtn}
            >
              {isPaused ? '▶️ 繼續' : '⏸️ 暫停'}
            </button>
            <button
              onClick={stopRecording}
              style={styles.stopBtn}
              onMouseEnter={e => (e.currentTarget.style.background = '#DC2626')}
              onMouseLeave={e => (e.currentTarget.style.background = '#EF4444')}
            >
              ⏹️ 停止錄音
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1A1D27',
    border: '1px solid #2D3748',
    borderRadius: 12,
    padding: '20px 24px',
  },
  alert: {
    padding: '10px 14px',
    borderRadius: 8,
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 12,
  },
  recordBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 32px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 50,
    fontSize: 17,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  micIcon: {
    fontSize: 20,
  },
  recordingArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  recordingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  recordingDot: {
    position: 'relative',
    width: 16,
    height: 16,
  },
  pulseRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: '#EF4444',
    animation: 'pulse-ring 1.5s ease-out infinite',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#F1F5F9',
    flex: 1,
  },
  duration: {
    fontSize: 18,
    fontWeight: 700,
    color: '#4F46E5',
    fontVariantNumeric: 'tabular-nums',
  },
  waveform: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    height: 48,
    overflow: 'hidden',
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    animation: 'wave 0.8s ease-in-out infinite alternate',
    transition: 'height 0.1s',
  },
  controls: {
    display: 'flex',
    gap: 12,
  },
  secondaryBtn: {
    padding: '9px 20px',
    background: '#2D3748',
    color: '#e2e8f0',
    border: '1px solid #4A5568',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  stopBtn: {
    padding: '9px 20px',
    background: '#EF4444',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
};
