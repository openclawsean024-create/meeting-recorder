'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [openAIKey, setOpenAIKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, would save to Supabase / Vercel env
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          設定
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          管理 API Key 與應用程式偏好設定
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* API Keys Section */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={sectionTitle}>🔑 API Key 管理</h2>
          <p style={sectionDesc}>
            你的 API Key 僅用於音訊轉寫與分析，不會被上傳到我們的伺服器。
          </p>

          <div style={fieldGroup}>
            <label htmlFor="openai-key" style={label}>
              OpenAI API Key
              <span style={required}>*</span>
            </label>
            <div style={inputWrapper}>
              <input
                id="openai-key"
                type={showOpenAI ? 'text' : 'password'}
                value={openAIKey}
                onChange={e => setOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="input"
                autoComplete="off"
                style={{ paddingRight: 44 }}
                required
                aria-describedby="openai-hint"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(v => !v)}
                style={eyeButton}
                aria-label={showOpenAI ? '隱藏 API Key' : '顯示 API Key'}
              >
                {showOpenAI ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p id="openai-hint" style={hint}>
              用於 Whisper 語音轉文字 API。請至{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={link}>
                OpenAI Platform
              </a>{' '}
              取得 Key。
            </p>
          </div>

          <div style={fieldGroup}>
            <label htmlFor="anthropic-key" style={label}>
              Anthropic API Key（選填）
            </label>
            <div style={inputWrapper}>
              <input
                id="anthropic-key"
                type={showAnthropic ? 'text' : 'password'}
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input"
                autoComplete="off"
                style={{ paddingRight: 44 }}
                aria-describedby="anthropic-hint"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(v => !v)}
                style={eyeButton}
                aria-label={showAnthropic ? '隱藏 API Key' : '顯示 API Key'}
              >
                {showAnthropic ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p id="anthropic-hint" style={hint}>
              用於生成 Meeting Minutes 摘要。如不填寫，系統將僅提供逐字稿。
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary">
              💾 儲存設定
            </button>
            {saved && (
              <span style={savedMsg} role="status" aria-live="polite">
                ✓ 已儲存
              </span>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={sectionTitle}>⚙️ 偏好設定</h2>

          <div style={fieldGroup}>
            <label htmlFor="language" style={label}>預設語言</label>
            <select id="language" className="input" style={{ maxWidth: 280 }} defaultValue="zh-TW">
              <option value="zh-TW">中文（台灣）</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="auto">自動偵測</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label htmlFor="timezone" style={label}>時區</label>
            <select id="timezone" className="input" style={{ maxWidth: 280 }} defaultValue="Asia/Taipei">
              <option value="Asia/Taipei">台北 (UTC+8)</option>
              <option value="Asia/Tokyo">東京 (UTC+9)</option>
              <option value="America/New_York">紐約 (UTC-5)</option>
              <option value="America/Los_Angeles">洛杉磯 (UTC-8)</option>
              <option value="Europe/London">倫敦 (UTC+0)</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={label}>音效提示</label>
            <div style={toggleRow}>
              <span style={toggleLabel}>錄音結束時播放提示音</span>
              <button
                type="button"
                role="switch"
                aria-checked="true"
                style={toggleSwitch(true)}
                aria-label="音效提示開關"
              >
                <span style={toggleThumb(true)} />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: 28, borderColor: '#FECACA' }}>
          <h2 style={{ ...sectionTitle, color: 'var(--danger)' }}>⚠️ 危險區域</h2>
          <p style={sectionDesc}>以下操作無法復原，請謹慎執行。</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ maxWidth: 280 }}>
              🗑️ 清除所有本地資料
            </button>
            <button type="button" className="btn btn-danger" style={{ maxWidth: 280 }}>
              🚫 刪除帳戶
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 8,
};

const sectionDesc: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: 24,
};

const fieldGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 20,
};

const label: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const required: React.CSSProperties = {
  color: 'var(--danger)',
  marginLeft: 4,
};

const inputWrapper: React.CSSProperties = {
  position: 'relative',
  maxWidth: 480,
};

const eyeButton: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  padding: 4,
};

const hint: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  lineHeight: 1.6,
};

const link: React.CSSProperties = {
  color: 'var(--primary)',
  textDecoration: 'underline',
};

const savedMsg: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--accent)',
  fontWeight: 600,
};

const toggleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: 400,
  padding: '12px 0',
  borderBottom: '1px solid var(--border)',
};

const toggleLabel: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-primary)',
};

const toggleSwitch = (on: boolean): React.CSSProperties => ({
  width: 44,
  height: 24,
  borderRadius: 12,
  background: on ? 'var(--primary)' : 'var(--surface-3)',
  border: 'none',
  cursor: 'pointer',
  padding: 2,
  display: 'flex',
  alignItems: 'center',
  transition: 'background var(--transition)',
});

const toggleThumb = (on: boolean): React.CSSProperties => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: '#fff',
  boxShadow: 'var(--shadow)',
  transform: on ? 'translateX(20px)' : 'translateX(0)',
  transition: 'transform var(--transition)',
});
