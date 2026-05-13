import React from 'react'

export const LIGHT = {
  bg: '#f3f3f3',
  columnBg: '#ffffff',
  sidebarBg: '#f9f9f9',
  headerBg: '#f3f3f3',
  statusBg: '#f3f3f3',
  previewBg: '#ffffff',
  qfBg: 'rgba(243,243,243,0.97)',
  modalBg: '#ffffff',
  inputBg: '#ffffff',
  inputBorder: 'rgba(0,0,0,0.09)',
  text: 'rgba(0,0,0,0.894)',
  textMid: 'rgba(0,0,0,0.606)',
  textSub: 'rgba(0,0,0,0.446)',
  textDim: 'rgba(0,0,0,0.361)',
  textFaint: 'rgba(0,0,0,0.217)',
  border: 'rgba(0,0,0,0.059)',
  borderMid: 'rgba(0,0,0,0.09)',
  hoverBg: 'rgba(0,0,0,0.037)',
  selBg: 'rgba(0,0,0,0.055)',
  codeBg: '#f5f5f5',
  dark: false,
}

export const DARK = {
  bg: '#202020',
  columnBg: '#272727',
  sidebarBg: '#2c2c2c',
  headerBg: '#1c1c1c',
  statusBg: '#1c1c1c',
  previewBg: '#2c2c2c',
  qfBg: 'rgba(32,32,32,0.97)',
  modalBg: '#3a3a3a',
  inputBg: 'rgba(255,255,255,0.063)',
  inputBorder: 'rgba(255,255,255,0.083)',
  text: 'rgba(255,255,255,0.894)',
  textMid: 'rgba(255,255,255,0.7)',
  textSub: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.35)',
  textFaint: 'rgba(255,255,255,0.2)',
  border: 'rgba(255,255,255,0.083)',
  borderMid: 'rgba(255,255,255,0.1)',
  hoverBg: 'rgba(255,255,255,0.063)',
  selBg: 'rgba(255,255,255,0.09)',
  codeBg: '#1c1c1c',
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
