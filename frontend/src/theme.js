
export const theme = {
  // ── Primary Green Palette ──────────────────────────────
  primary:       '#2E7D52',
  primaryHover:  '#256B45',
  primaryLight:  '#43A572',
  primaryDark:   '#1B5E38',
  primaryBg:     '#F0F7F4',
  primaryBgCard: '#E8F5EE',
  primaryBorder: '#C7DDD1',
 
  // ── Semantic Colors ────────────────────────────────────
  danger:        '#DC2626',
  dangerLight:   '#FEE2E2',
  dangerBorder:  '#FECACA',
 
  warning:       '#D97706',
  warningLight:  '#FEF3C7',
  warningBorder: '#FDE68A',
 
  success:       '#16A34A',
  successLight:  '#DCFCE7',
  successBorder: '#BBF7D0',
 
  info:          '#0369A1',
  infoLight:     '#E0F2FE',
  infoBorder:    '#BAE6FD',
 
  // ── Text ──────────────────────────────────────────────
  textPrimary:   '#1A2E24',
  textSecondary: '#4B6B58',
  textMuted:     '#7A9B87',
  textInverse:   '#FFFFFF',
 
  // ── Surfaces & Structure ───────────────────────────────
  border:        '#C7DDD1',
  borderLight:   '#E2EFE8',
  bg:            '#F7FBF8',
  bgCard:        '#FFFFFF',
  bgOverlay:     'rgba(0,0,0,0.55)',
 
  // ── Shadows ───────────────────────────────────────────
  shadow:        '0 2px 8px rgba(46, 125, 82, 0.10)',
  shadowMd:      '0 4px 16px rgba(46, 125, 82, 0.15)',
  shadowLg:      '0 8px 32px rgba(46, 125, 82, 0.18)',
 
  // ── Border Radii ──────────────────────────────────────
  radiusSm:      '4px',
  radiusMd:      '8px',
  radiusLg:      '12px',
  radiusXl:      '16px',
  radiusFull:    '9999px',
 
  // ── Typography ────────────────────────────────────────
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
 
// ── Severity colour by score (1–10) ───────────────────────
export const getSeverityColor = (score) => {
  if (score >= 7) return theme.danger;
  if (score >= 4) return theme.warning;
  return theme.success;
};
 
export const getSeverityBg = (score) => {
  if (score >= 7) return theme.dangerLight;
  if (score >= 4) return theme.warningLight;
  return theme.successLight;
};
 
// ── Status helpers ────────────────────────────────────────
export const getStatusColor = (status) => {
  switch (status) {
    case 'active':           return theme.success;
    case 'pending_approval': return theme.warning;
    case 'resolved':         return theme.textMuted;
    default:                 return theme.textMuted;
  }
};
 
export const getStatusBg = (status) => {
  switch (status) {
    case 'active':           return theme.successLight;
    case 'pending_approval': return theme.warningLight;
    case 'resolved':         return '#F3F4F6';
    default:                 return '#F3F4F6';
  }
};
 
export const getStatusLabel = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
 
// ── Reusable inline style helpers ────────────────────────
export const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusMd,
    padding: '20px',
    boxShadow: theme.shadow,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    fontSize: '14px',
    color: theme.textPrimary,
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    fontFamily: theme.fontFamily,
  },
  label: {
    display: 'block',
    fontWeight: '600',
    fontSize: '12px',
    color: theme.textSecondary,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  btnPrimary: {
    backgroundColor: theme.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: theme.radiusSm,
    padding: '11px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    width: '100%',
  },
  btnDanger: {
    backgroundColor: theme.danger,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: theme.radiusSm,
    padding: '11px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnSuccess: {
    backgroundColor: theme.success,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: theme.radiusSm,
    padding: '11px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    color: theme.primary,
    border: `1.5px solid ${theme.primary}`,
    borderRadius: theme.radiusSm,
    padding: '11px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  skillBadge: {
    display: 'inline-block',
    backgroundColor: theme.primaryBgCard,
    color: theme.primary,
    border: `1px solid ${theme.primaryBorder}`,
    padding: '3px 10px',
    borderRadius: theme.radiusFull,
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '5px',
    marginBottom: '5px',
  },
};