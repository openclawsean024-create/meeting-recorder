'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTranscriptUpdate: (audioBlob: Blob) => void;
}

const CHUNK_INTERVAL_MS = 30000;

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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPausedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      recorder.start(1000);
      onStartRecording();
      setRecordingDuration(0);
      isPausedRef.current = false;

      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          setRecordingDuration(d => d + 1);
        }
      }, 1000);

      chunkTimerRef.current = setInterval(() => {
        if (!isPausedRef.current && recorder.state === 'recording') {
          recorder.stop();
          setTimeout(() => {
            if (streamRef.current && recorder.state === 'inactive') {
              const newMimeType = getSupportedMimeType();
              const newRecorder = new MediaRecorder(streamRef.current, newMimeType ? { mimeType: newMimeType } : undefined);
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

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.some(t => file.type.includes(t.split('/')[1]))) {
      setError('不支援的檔案格式，請上傳 MP3, M4A, WAV, OGG 或 WebM 檔案。');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      onTranscriptUpdate(file);
    } finally {
      setIsUploading(false);
    }
  }, [onTranscriptUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported) {
    return (
      <div style={styles.card}>
        <div style={styles.alert}>
          ⚠️ 您的瀏覽器不支援錄音功能，請使用 Chrome、Edge 或 Firefox。
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card} className="card">
      {error && (
        <div style={styles.alert} role="alert">
          {error}
        </div>
      )}

      {!isRecording ? (
        <div style={styles.idleContainer}>
          {/* Drag & Drop Zone */}
          <div
            style={{
              ...styles.dropZone,
              ...(isDragging ? styles.dropZoneActive : {}),
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="拖放音訊檔案或點擊選擇檔案"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,audio/webm"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              aria-hidden="true"
            />
            <div style={styles.dropIcon}>📁</div>
            <p style={styles.dropTitle}>
              {isDragging ? '放開以上傳檔案' : '拖放音訊檔案至此'}
            </p>
            <p style={styles.dropFormats}>支援 MP3, M4A, WAV, OGG，最大 120 分鐘</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{ marginTop: 8 }}
            >
              選擇檔案
            </button>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerText}>或</span>
          </div>

          {/* Start Recording Button */}
          <button
            onClick={startRecording}
            className="btn btn-success btn-lg"
            style={{ width: '100%', fontSize: 16 }}
            aria-label="開始新錄音"
          >
            <span aria-hidden="true">🎙️</span>
            開始新錄音
          </button>

          {isUploading && (
            <p style={styles.uploadingText}>上傳中...</p>
          )}
        </div>
      ) : (
        /* Recording Mode */
        <div style={styles.recordingContainer}>
          {/* Recording indicator */}
          <div style={styles.recordingHeader}>
            <div style={styles.recordingDotWrapper}>
              <div style={styles.recordingDot} />
              <div style={styles.pulseRing} />
            </div>
            <span style={styles.recordingLabel}>
              {isPaused ? '⏸️ 暫停中' : '🔴 錄音中'}
            </span>
            <span style={styles.duration} aria-live="polite" aria-label={`錄音時長：${formatDuration(recordingDuration)}`}>
              {formatDuration(recordingDuration)}
            </span>
          </div>

          {/* Waveform */}
          <div style={styles.waveform} aria-hidden="true" role="img" aria-label="音頻波形">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.waveBar,
                  animationDelay: `${i * 0.04}s`,
                  height: isPaused ? 4 : `${Math.random() * 32 + 8}px`,
                  background: isPaused ? 'var(--text-muted)' : 'var(--primary)',
                  opacity: isPaused ? 0.4 : 0.85,
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="btn btn-secondary"
              aria-label={isPaused ? '繼續錄音' : '暫停錄音'}
            >
              {isPaused ? '▶️ 繼續' : '⏸️ 暫停'}
            </button>
            <button
              onClick={stopRecording}
              className="btn btn-danger"
              aria-label="停止錄音"
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
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
  },
  alert: {
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    background: 'var(--danger-light)',
    border: '1px solid #FECACA',
    color: 'var(--danger)',
    fontSize: 14,
    marginBottom: 16,
  },
  idleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color var(--transition), background var(--transition)',
    background: 'var(--surface-2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  dropZoneActive: {
    borderColor: 'var(--primary)',
    background: 'var(--primary-light)',
  },
  dropIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  dropTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  dropFormats: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dividerText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    background: 'var(--surface)',
    padding: '0 8px',
  },
  uploadingText: {
    fontSize: 13,
    color: 'var(--primary)',
    textAlign: 'center',
  },
  recordingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  recordingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  recordingDotWrapper: {
    position: 'relative',
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  recordingDot: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'var(--danger)',
  },
  pulseRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'var(--danger)',
    animation: 'pulseRing 1.5s ease-out infinite',
  },
  recordingLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    flex: 1,
  },
  duration: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--primary)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
  },
  waveform: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    height: 52,
    overflow: 'hidden',
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    animation: 'waveBar 0.8s ease-in-out infinite alternate',
    transition: 'height 0.1s',
  },
  controls: {
    display: 'flex',
    gap: 12,
  },
};
