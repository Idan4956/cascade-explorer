import React from 'react'
import { IconClose } from './icons'
import { useTheme } from '../contexts/ThemeContext'

const ACCENT_OPTIONS = [
  { key: 'purple', color: '#6f4cb3', label: 'Purple' },
  { key: 'teal',   color: '#00838f', label: 'Teal'   },
  { key: 'blue',   color: '#0067c0', label: 'Blue'   },
  { key: 'sun',    color: '#b8651f', label: 'Amber'  },
]

export default function SettingsModal({
  onClose,
  accentKey,
  onAccentChange,
  showHidden,
  onShowHiddenChange,
  confirmDelete,
  onConfirmDeleteChange,
  startDir,
  onStartDirChange,
}) {
  const { T, dark, toggleDark } = useTheme()
  const accentColor = ACCENT_OPTIONS.find(a => a.key === accentKey)?.color || '#6f4cb3'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 150,
        background: 'rgba(20,15,30,0.28)', backdropFilter: 'blur(3px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 500, maxHeight: '80vh',
          background: T.modalBg, borderRadius: 8,
          border: `1px solid ${T.borderMid}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.12)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Settings</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            width: 28, height: 28, border: 'none', background: 'transparent',
            borderRadius: 6, cursor: 'pointer', color: T.textDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textDim }}>
            <IconClose size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', flex: 1 }}>

          {/* ── Appearance ─────────────────────────────── */}
          <Section label="Appearance" T={T}>
            <Row label="Theme" desc="Choose between light and dark interface" T={T}>
              <div style={{ display: 'flex', gap: 6 }}>
                <ThemeChip label="Light" active={!dark} onClick={() => dark && toggleDark()} T={T} accentColor={accentColor} />
                <ThemeChip label="Dark"  active={dark}  onClick={() => !dark && toggleDark()} T={T} accentColor={accentColor} />
              </div>
            </Row>

            <Row label="Accent color" desc="Color used for selections and highlights" T={T}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {ACCENT_OPTIONS.map(a => (
                  <button
                    key={a.key}
                    title={a.label}
                    onClick={() => onAccentChange(a.key)}
                    style={{
                      width: 26, height: 26, borderRadius: 99,
                      border: 'none', cursor: 'pointer',
                      background: a.color,
                      outline: accentKey === a.key ? `3px solid ${a.color}` : '2px solid transparent',
                      outlineOffset: 2,
                      transition: 'outline 0.1s, transform 0.1s',
                      transform: accentKey === a.key ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </Row>
          </Section>

          {/* ── Files & Navigation ─────────────────────── */}
          <Section label="Files & Navigation" T={T}>
            <Row label="Show hidden files" desc="Display files and folders starting with a dot" T={T}>
              <Toggle value={showHidden} onChange={onShowHiddenChange} accentColor={accentColor} />
            </Row>

            <Row label="Confirm before delete" desc="Ask for confirmation before moving items to Trash" T={T}>
              <Toggle value={confirmDelete} onChange={onConfirmDeleteChange} accentColor={accentColor} />
            </Row>

            <Row label="Open at startup" desc="Which directory to show when the app launches" T={T}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['home', 'last'].map(opt => (
                  <ThemeChip
                    key={opt}
                    label={opt === 'home' ? 'Home' : 'Last visited'}
                    active={startDir === opt}
                    onClick={() => onStartDirChange(opt)}
                    T={T}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            </Row>
          </Section>

          {/* ── Keyboard shortcuts reference ───────────── */}
          <Section label="Keyboard shortcuts" T={T}>
            {[
              ['Command palette', 'Ctrl+K'],
              ['Settings',        'Ctrl+,'],
              ['Copy',            'Ctrl+C'],
              ['Copy path',       'Ctrl+Shift+C'],
              ['Cut',             'Ctrl+X'],
              ['Paste',           'Ctrl+V'],
              ['Quick Look',      'Space'],
              ['Rename',          'F2'],
              ['Grid / List',     'Column header'],
              ['Go back',         'Alt+←'],
              ['Navigate items',  '↑ ↓ → ↵'],
            ].map(([action, kbd]) => (
              <div key={action} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 20px', borderBottom: `1px solid ${T.border}`,
                fontSize: 12.5,
              }}>
                <span style={{ color: T.textMid }}>{action}</span>
                <kbd style={{
                  fontSize: 11, padding: '3px 9px',
                  background: T.hoverBg, borderRadius: 5,
                  color: T.textSub, border: `1px solid ${T.border}`,
                  fontFamily: 'inherit', letterSpacing: 0.3,
                }}>{kbd}</kbd>
              </div>
            ))}
          </Section>

          {/* ── AI Features ───────────────────────────── */}
          <Section label="AI Features" T={T}>
            <AiKeyManager T={T} accentColor={accentColor} />
          </Section>

          {/* ── Updates ───────────────────────────────── */}
          <Section label="Updates" T={T}>
            <UpdateChecker T={T} accentColor={accentColor} />
          </Section>

          {/* ── About ─────────────────────────────────── */}
          <Section label="About" T={T} last>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(135deg, ${accentColor}, oklch(0.48 0.18 280))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                  {[20, 14, 10].map((h, i) => (
                    <div key={i} style={{ width: 5, height: h, background: 'rgba(255,255,255,0.9)', borderRadius: 2 }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Cascade</div>
                <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Version 1.0.0</div>
                <a
                  href="https://github.com/Idan4956/cascade-explorer"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: accentColor, textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: 4 }}>
                  View on GitHub ↗
                </a>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ label, children, T, last }) {
  return (
    <div style={{ borderBottom: last ? 'none' : `1px solid ${T.border}`, paddingBottom: last ? 8 : 0 }}>
      <div style={{
        padding: '14px 20px 6px',
        fontSize: 10.5, fontWeight: 700, color: T.textDim,
        letterSpacing: 0.7, textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({ label, desc, children, T }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '11px 20px', borderTop: `1px solid ${T.border}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

function ThemeChip({ label, active, onClick, T, accentColor }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 28, padding: '0 13px',
        border: `1px solid ${active ? 'transparent' : T.borderMid}`,
        borderRadius: 4, fontSize: 12, cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        background: active ? accentColor : 'transparent',
        color: active ? '#fff' : T.textMid,
        transition: 'all 0.12s',
      }}>
      {label}
    </button>
  )
}

function UpdateChecker({ T, accentColor }) {
  const [status, setStatus] = React.useState('idle')
  const [latest, setLatest] = React.useState(null)
  const [downloadUrl, setDownloadUrl] = React.useState(null)
  const [current, setCurrent] = React.useState('1.0.0')

  React.useEffect(() => {
    window.electronAPI?.getVersion().then(v => { if (v) setCurrent(v) })
  }, [])

  const check = async () => {
    setStatus('checking')
    const result = await window.electronAPI?.checkUpdate()
    if (!result || result.error) { setStatus('error'); return }
    const v = result.version?.replace(/^v/, '')
    setLatest(v)
    setDownloadUrl(result.url)
    setStatus(v === current ? 'up-to-date' : 'available')
  }

  return (
    <div style={{ padding: '12px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>Current version: {current}</div>
          {status === 'available' && <div style={{ fontSize: 12, color: accentColor, marginTop: 3, fontWeight: 500 }}>Version {latest} is available</div>}
          {status === 'up-to-date' && <div style={{ fontSize: 12, color: '#3fa45a', marginTop: 3 }}>You're up to date</div>}
          {status === 'error' && <div style={{ fontSize: 12, color: '#c83a2e', marginTop: 3 }}>Couldn't check for updates</div>}
        </div>
        <button
          onClick={check}
          disabled={status === 'checking'}
          style={{
            height: 28, padding: '0 14px',
            background: accentColor, color: '#fff',
            border: 'none', borderRadius: 4,
            fontSize: 12, fontWeight: 500,
            cursor: status === 'checking' ? 'default' : 'pointer',
            opacity: status === 'checking' ? 0.7 : 1,
            flexShrink: 0,
          }}>
          {status === 'checking' ? 'Checking…' : 'Check for updates'}
        </button>
      </div>
      {status === 'available' && downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: accentColor, textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: 8 }}>
          Download latest release ↗
        </a>
      )}
    </div>
  )
}

function AiKeyManager({ T, accentColor }) {
  const [hasKey, setHasKey] = React.useState(null)
  const [input, setInput] = React.useState('')
  const [status, setStatus] = React.useState('')

  React.useEffect(() => {
    window.electronAPI?.aiHasKey().then(v => setHasKey(!!v))
  }, [])

  const save = async () => {
    if (!input.trim()) return
    setStatus('saving')
    await window.electronAPI?.aiSetKey(input.trim())
    setHasKey(true)
    setInput('')
    setStatus('saved')
    setTimeout(() => setStatus(''), 2000)
  }

  const clear = async () => {
    await window.electronAPI?.aiSetKey('')
    setHasKey(false)
    setStatus('')
  }

  return (
    <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.5 }}>
        Add a Claude API key to enable Smart Actions: document summaries, auto-tag suggestions, smart renames, and natural language search. Keys are stored locally and never sent anywhere except the Claude API.
      </div>
      <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noreferrer"
        style={{ fontSize: 12, color: accentColor, textDecoration: 'none', fontWeight: 500 }}>
        Get an API key from console.anthropic.com ↗
      </a>
      {hasKey ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: '#3fa45a', fontWeight: 500, flex: 1 }}>
            ✓ API key configured
          </div>
          <button onClick={clear} style={{
            height: 28, padding: '0 13px', border: `1px solid ${T.borderMid}`,
            borderRadius: 4, fontSize: 12, cursor: 'pointer',
            background: 'transparent', color: T.textMid,
          }}>
            Remove key
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="sk-ant-…"
            style={{
              flex: 1, height: 32, padding: '0 10px',
              border: `1px solid ${T.borderMid}`, borderRadius: 4,
              background: T.inputBg, color: T.text, fontSize: 12.5,
              outline: 'none',
            }}
          />
          <button onClick={save} disabled={!input.trim() || status === 'saving'} style={{
            height: 32, padding: '0 16px', background: accentColor, color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500,
            cursor: input.trim() ? 'pointer' : 'default', opacity: input.trim() ? 1 : 0.5, flexShrink: 0,
          }}>
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved!' : 'Save key'}
          </button>
        </div>
      )}
    </div>
  )
}

function Toggle({ value, onChange, accentColor }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: value ? accentColor : 'rgba(150,150,160,0.3)',
        position: 'relative', transition: 'background 0.18s', flexShrink: 0, padding: 0,
      }}>
      <div style={{
        position: 'absolute', top: 4, left: value ? 22 : 4,
        width: 16, height: 16, borderRadius: 99,
        background: '#fff', transition: 'left 0.18s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  )
}
