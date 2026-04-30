const Ic = ({ d, size = 16, color = 'currentColor', stroke = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
)

export const IconChevronRight = (p) => <Ic d="M9 5l7 7-7 7" {...p} />
export const IconChevronLeft = (p) => <Ic d="M15 5l-7 7 7 7" {...p} />
export const IconChevronDown = (p) => <Ic d="M5 9l7 7 7-7" {...p} />
export const IconChevronUp = (p) => <Ic d="M19 15l-7-7-7 7" {...p} />
export const IconArrowUp = (p) => <Ic d="M12 19V5M5 12l7-7 7 7" {...p} />
export const IconArrowLeft = (p) => <Ic d="M19 12H5M12 19l-7-7 7-7" {...p} />
export const IconArrowRight = (p) => <Ic d="M5 12h14M12 5l7 7-7 7" {...p} />
export const IconRefresh = (p) => <Ic d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" {...p} />
export const IconSearch = (p) => <Ic d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3" {...p} />
export const IconClose = (p) => <Ic d="M6 6l12 12M18 6L6 18" {...p} />
export const IconPlus = (p) => <Ic d="M12 5v14M5 12h14" {...p} />
export const IconMinus = (p) => <Ic d="M5 12h14" {...p} />
export const IconStar = (p) => <Ic d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3.2 9.5l6.1-.9z" {...p} />
export const IconMore = (p) => <Ic d="M5 12h.01M12 12h.01M19 12h.01" stroke={p.color || 'currentColor'} {...p} />
export const IconFilter = (p) => <Ic d="M3 5h18M6 12h12M10 19h4" {...p} />
export const IconSort = (p) => <Ic d="M3 6h13M3 12h9M3 18h5M17 8V19M21 15l-4 4-4-4" {...p} />
export const IconGrid = (p) => <Ic d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} {...p} />
export const IconList = (p) => <Ic d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" {...p} />
export const IconColumns = (p) => <Ic d={<><rect x="3" y="4" width="5" height="16" rx="1.2"/><rect x="9.5" y="4" width="5" height="16" rx="1.2"/><rect x="16" y="4" width="5" height="16" rx="1.2"/></>} {...p} />
export const IconGallery = (p) => <Ic d={<><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 13l4-4 5 5 3-3 6 6"/><circle cx="9" cy="8" r="1.5" fill={p.color || 'currentColor'}/><path d="M5 21h14"/></>} {...p} />
export const IconEye = (p) => <Ic d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...p} />
export const IconShare = (p) => <Ic d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" {...p} />
export const IconCopy = (p) => <Ic d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>} {...p} />
export const IconTrash = (p) => <Ic d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14M10 11v6M14 11v6" {...p} />
export const IconRename = (p) => <Ic d="M3 21h18M16 3l5 5-12 12H4v-5z" {...p} />
export const IconCommand = (p) => <Ic d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" {...p} />
export const IconSidebar = (p) => <Ic d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>} {...p} />
export const IconSplit = (p) => <Ic d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></>} {...p} />
export const IconTab = (p) => <Ic d="M3 19h18M3 8h6l2-3h4l2 3h4v11" {...p} />
export const IconHome = (p) => <Ic d="M3 11l9-7 9 7M5 10v10h14V10" {...p} />
export const IconCloud = (p) => <Ic d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 11a4 4 0 0 1 0 7H7z" {...p} />
export const IconHeart = (p) => <Ic d="M12 21s-7-4.5-9-9.5A5 5 0 0 1 12 6a5 5 0 0 1 9 5.5C19 16.5 12 21 12 21z" {...p} />
export const IconClock = (p) => <Ic d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} {...p} />
export const IconTag = (p) => <Ic d="M3 11V4a1 1 0 0 1 1-1h7l10 10-8 8z M7.5 7.5h.01" {...p} />
export const IconPin = (p) => <Ic d="M12 17v5M8 3h8l-1 6 3 3H6l3-3z" {...p} />
export const IconInfo = (p) => <Ic d={<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></>} {...p} />
export const IconPlay = (p) => <Ic d="M7 4l13 8-13 8z" fill={p.color || 'currentColor'} {...p} />
export const IconPause = (p) => <Ic d="M8 4v16M16 4v16" {...p} />
export const IconBack = (p) => <Ic d="M15 18l-6-6 6-6" {...p} />
export const IconForward = (p) => <Ic d="M9 18l6-6-6-6" {...p} />
export const IconWindow = (p) => <Ic d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></>} {...p} />
export const IconFolderOpen = (p) => <Ic d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2" {...p} />

// File-type tile
export function FileTile({ kind, name, size = 36, palette }) {
  const colors = {
    folder:  { bg: '#f6dfa6', edge: '#d99a44', glyph: '#7a4a1a' },
    pdf:     { bg: '#fde2dd', edge: '#e96a55', glyph: '#a32a18' },
    sheet:   { bg: '#dcefdc', edge: '#3fa45a', glyph: '#1e6b32' },
    doc:     { bg: '#dde7f8', edge: '#3d6cc8', glyph: '#1c3a78' },
    text:    { bg: '#ece8df', edge: '#8a7a5a', glyph: '#4a3e26' },
    image:   { bg: '#e3dcf3', edge: '#7e63c4', glyph: '#3e2c70' },
    audio:   { bg: '#fde8d4', edge: '#e08a3a', glyph: '#7a3e10' },
    video:   { bg: '#dcecf3', edge: '#3a8db0', glyph: '#0f3a52' },
    archive: { bg: '#f0e0d4', edge: '#a07a52', glyph: '#5a3a1e' },
    app:     { bg: '#dde9e1', edge: '#4a8a6e', glyph: '#1e4a36' },
    cloud:   { bg: '#dde7f8', edge: '#3d6cc8', glyph: '#1c3a78' },
    file:    { bg: '#ece8df', edge: '#8a7a5a', glyph: '#4a3e26' },
  }
  const c = colors[kind] || colors.file
  const ext = (kind === 'folder' || kind === 'cloud') ? '' :
    (name && name.includes('.')) ? name.split('.').pop().toUpperCase().slice(0, 4) :
    (kind || '').toUpperCase().slice(0, 4)

  if (kind === 'folder') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" style={{ flex: 'none' }}>
        <path d="M3 11c0-1.7 1.3-3 3-3h7l3 3h14c1.7 0 3 1.3 3 3v14c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3z" fill={c.bg} />
        <path d="M3 13c0-1.7 1.3-3 3-3h24c1.7 0 3 1.3 3 3v15c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3z" fill={c.edge} opacity="0.55" />
        <path d="M3 13c0-1.7 1.3-3 3-3h24c1.7 0 3 1.3 3 3v15c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3z" fill={c.bg} opacity="0.6" />
      </svg>
    )
  }
  if (kind === 'cloud') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" style={{ flex: 'none' }}>
        <path d="M11 26a7 7 0 1 1 1.3-13.9A8 8 0 0 1 28 16a5 5 0 0 1 0 10z" fill={c.bg} stroke={c.edge} strokeWidth="1.5" />
      </svg>
    )
  }
  if (kind === 'image' && palette) {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" style={{ flex: 'none' }}>
        <rect x="3" y="4" width="30" height="28" rx="3" fill={palette[0] || c.bg} />
        <rect x="3" y="4" width="30" height="28" rx="3" fill={palette[1] || c.edge} opacity="0.5" />
        <circle cx="12" cy="13" r="2.5" fill={palette[3] || '#fff'} opacity="0.9" />
        <path d="M3 26 L13 17 L20 23 L26 19 L33 26 V29 Q33 32 30 32 H6 Q3 32 3 29 Z" fill={palette[2] || c.glyph} opacity="0.85" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ flex: 'none' }}>
      <path d="M8 4h14l8 8v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill={c.bg} />
      <path d="M22 4v6a2 2 0 0 0 2 2h6" fill={c.edge} opacity="0.45" />
      <rect x="6" y="20" width="18" height="9" rx="2" fill={c.edge} />
      <text x="15" y="27" textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui">{ext}</text>
    </svg>
  )
}

export function kindLabel(k) {
  return ({
    folder: 'Folder', pdf: 'PDF document', sheet: 'Spreadsheet', doc: 'Word document',
    text: 'Text document', image: 'Image', audio: 'Audio', video: 'Video',
    archive: 'Archive', app: 'Application', cloud: 'Cloud', file: 'File',
  })[k] || k
}
