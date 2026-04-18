import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { theme } from '../theme';
 
const avatarColor = (str = '') => {
  const palette = [
    '#2E7D52', '#256B45', '#1B5E38',
    '#0369A1', '#D97706', '#7C3AED', '#BE185D',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};
 
const VolunteerMiniProfile = ({ uid }) => {
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading]     = useState(true);
 
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) setVolunteer(snap.data());
      } catch (e) {
        console.error('VolunteerMiniProfile fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);
 
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      backgroundColor: theme.primaryBg,
      borderRadius: theme.radiusMd,
      border: `1px solid ${theme.border}`,
      animation: 'pulse 1.5s infinite',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: theme.border }} />
      <div>
        <div style={{ width: 80, height: 12, backgroundColor: theme.border, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: 60, height: 10, backgroundColor: theme.borderLight, borderRadius: 4 }} />
      </div>
    </div>
  );
 
  if (!volunteer) return null;
 
  const initials = (volunteer.name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
 
  const bg = avatarColor(uid);
 
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      backgroundColor: theme.primaryBg,
      borderRadius: theme.radiusMd,
      border: `1px solid ${theme.primaryBorder}`,
    }}>
      {/* Avatar */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: bg,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: '700',
        flexShrink: 0,
        letterSpacing: '0.5px',
      }}>
        {initials}
      </div>
 
      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '700',
          color: theme.textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {volunteer.name || 'Volunteer'}
        </div>
        <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>
          {volunteer.phone
            ? `📞 ${volunteer.phone}`
            : <span style={{ color: theme.textMuted, fontStyle: 'italic' }}>No phone on file</span>}
        </div>
        {volunteer.skills?.length > 0 && (
          <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {volunteer.skills.slice(0, 3).map((sk, i) => (
              <span key={i} style={{
                fontSize: '10px',
                fontWeight: '600',
                color: theme.primary,
                backgroundColor: 'white',
                border: `1px solid ${theme.primaryBorder}`,
                padding: '1px 7px',
                borderRadius: theme.radiusFull,
              }}>{sk}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
 
export default VolunteerMiniProfile;