import React from 'react'

export const LIGHT = {
  bg: 'linear-gradient(180deg, rgba(250,248,253,0.96), rgba(244,242,250,0.92))',
  columnBg: 'rgba(255,255,255,0.55)',
  sidebarBg: 'rgba(248,245,253,0.5)',
  headerBg: 'rgba(252,250,255,0.85)',
  statusBg: 'rgba(248,245,253,0.85)',
  previewBg: 'rgba(255,255,255,0.85)',
  qfBg: 'rgba(252,251,253,0.5)',
  modalBg: 'rgba(252,251,253,0.98)',
  inputBg: '#fff',
  inputBorder: 'rgba(0,0,0,0.12)',
  text: '#1a1a1a',
  textMid: '#444',
  textSub: '#666',
  textDim: '#888',
  textFaint: '#bbb',
  border: 'rgba(0,0,0,0.06)',
  borderMid: 'rgba(0,0,0,0.08)',
  hoverBg: 'rgba(0,0,0,0.04)',
  codeBg: '#fbfaf6',
  dark: false,
}

export const DARK = {
  bg: 'linear-gradient(180deg, #1c1928, #181522)',
  columnBg: 'rgba(32,28,50,0.98)',
  sidebarBg: 'rgba(24,20,40,0.99)',
  headerBg: 'rgba(26,22,44,0.97)',
  statusBg: 'rgba(24,20,40,0.97)',
  previewBg: 'rgba(28,24,46,0.99)',
  qfBg: 'rgba(24,20,40,0.7)',
  modalBg: 'rgba(30,26,50,0.99)',
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.12)',
  text: '#e4e0f0',
  textMid: '#c8c2dc',
  textSub: '#9c96b4',
  textDim: '#706a88',
  textFaint: '#4a4560',
  border: 'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.1)',
  hoverBg: 'rgba(255,255,255,0.06)',
  codeBg: '#1a1630',
  dark: true,
}

const ThemeCtx = React.createContext({ T: LIGHT, dark: false, toggleDark: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = React.useState(() => {
    try { return localStorage.getItem('cascade-dark') === '1' } catch { return false }
  })

  const toggleDark = React.useCallback(() => {
    setDark(d => {
      const next = !d
      try { localStorage.setItem('cascade-dark', next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  const value = React.useMemo(() => ({
    T: dark ? DARK : LIGHT,
    dark,
    toggleDark,
  }), [dark, toggleDark])

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  return React.useContext(ThemeCtx)
}
