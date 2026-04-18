import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { theme, styles, getSeverityColor, getSeverityBg, getStatusColor, getStatusBg, getStatusLabel } from '../theme';
import CreateRequest from './CreateRequest';
import VolunteerMiniProfile from './VolunteerMiniProfile';
import { auth, db } from '../config/firebase';
 

const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding:         '9px 20px',
      cursor:          'pointer',
      border:          'none',
      borderRadius:    theme.radiusMd,
      fontSize:        '13px',
      fontWeight:      active ? '700' : '500',
      backgroundColor: active ? theme.primary : 'transparent',
      color:           active ? 'white' : theme.textSecondary,
      transition:      'background 0.15s',
    }}
  >
    {label}
  </button>
);
 
const UserDashboard = ({ userData, setUserData }) => {
  const navigate = useNavigate();

   const [activeTab, setActiveTab] = useState('create');
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

const fetchMyRequests = async () => {
  setLoadingRequests(true);
  try {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'requests'), where('createdByUid', '==', user.uid));
    const snap = await getDocs(q);
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setMyRequests(requests);
  } catch (error) {
    console.error(error);
    toast.error('Failed to load your requests. Please refresh.');   // ❌ error
  } finally {
    setLoadingRequests(false);
  }
};
  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyRequests();
    }
  }, [activeTab]);

 
  return (
    <div style={{
      maxWidth:   '700px',
      margin:     '0 auto',
      padding:    '28px 20px',
      fontFamily: theme.fontFamily,
    }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display:         'flex',
        justifyContent:  'space-between',
        alignItems:      'center',
        marginBottom:    '24px',
        padding:         '18px 20px',
        backgroundColor: theme.primaryBg,
        borderRadius:    theme.radiusLg,
        border:          `1px solid ${theme.primaryBorder}`,
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: theme.textPrimary }}>
            Welcome, {userData?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>
            Relief Network · Community Member
          </p>
        </div>
 
        {userData?.phoneVerified ? (
          <span style={{
            backgroundColor: theme.successLight,
            color:           theme.success,
            padding:         '6px 14px',
            borderRadius:    theme.radiusFull,
            fontSize:        '13px',
            fontWeight:      '700',
            border:          `1px solid ${theme.successBorder}`,
          }}>
            ✅ Verified
          </span>
        ) : (
          <button
            onClick={() => navigate('/verify-phone')}
            style={{
              backgroundColor: theme.dangerLight,
              color:           theme.danger,
              border:          `1px solid ${theme.dangerBorder}`,
              padding:         '6px 14px',
              borderRadius:    theme.radiusFull,
              fontSize:        '13px',
              fontWeight:      '700',
              cursor:          'pointer',
            }}
          >
            ⚠️ Verify Phone
          </button>
        )}
      </div>
 
      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div style={{
        display:         'flex',
        gap:             '6px',
        backgroundColor: theme.primaryBg,
        padding:         '6px',
        borderRadius:    theme.radiusLg,
        marginBottom:    '24px',
        border:          `1px solid ${theme.border}`,
      }}>
        <TabBtn label="🚨 Request Help" active={activeTab === 'create'}  onClick={() => setActiveTab('create')} />
        <TabBtn label="📋 My Requests"  active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      </div>
 
      {/* ── Tab: Request Help ────────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <div>
          {!userData?.phoneVerified ? (
            <div style={{
              padding:         '36px 24px',
              backgroundColor: theme.warningLight,
              border:          `1px solid ${theme.warningBorder}`,
              borderRadius:    theme.radiusLg,
              textAlign:       'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ margin: '0 0 10px 0', color: theme.warning, fontSize: '17px', fontWeight: '700' }}>
                Phone Verification Required
              </h3>
              <p style={{ color: theme.textSecondary, marginBottom: '20px', fontSize: '14px', lineHeight: 1.6 }}>
                We require a verified phone number to prevent misuse and ensure every
                request is legitimate. This takes less than 2 minutes.
              </p>
              <button
                onClick={() => navigate('/verify-phone')}
                style={{
                  ...styles.btnPrimary,
                  width:   'auto',
                  padding: '12px 28px',
                  display: 'inline-block',
                }}
              >
                Verify My Phone Now
              </button>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6 }}>
                Submit a new request for assistance. Our AI will analyse severity and alert the nearest qualified volunteers.
              </p>
              <CreateRequest />
            </>
          )}
        </div>
      )}
 {/* ── Tab: My Requests ─────────────────────────────────────────────── */}
{activeTab === 'history' && (
  <div>
    <h3 style={{ margin: '0 0 20px 0', fontSize: '17px', fontWeight: '700', color: theme.textPrimary }}>
      My Request History
    </h3>

    {loadingRequests ? (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
        Loading your requests…
      </div>
    ) : myRequests.length === 0 ? (
      <div style={{
        padding:         '48px 24px',
        backgroundColor: theme.primaryBg,
        borderRadius:    theme.radiusLg,
        textAlign:       'center',
        border:          `1px solid ${theme.border}`,
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
        <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px' }}>
          You haven't submitted any help requests yet.
        </p>
      </div>
    ) : myRequests.map(req => (
      <div key={req.id} style={{
        border:          `1px solid ${theme.border}`,
        borderLeft:      `5px solid ${getStatusColor(req.status)}`,
        borderRadius:    theme.radiusLg,
        padding:         '20px',
        marginBottom:    '16px',
        backgroundColor: 'white',
        boxShadow:       theme.shadow,
      }}>
        {/* Status + severity row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{
            backgroundColor: getStatusBg(req.status),
            color:           getStatusColor(req.status),
            padding:         '4px 12px',
            borderRadius:    theme.radiusFull,
            fontSize:        '12px',
            fontWeight:      '700',
            textTransform:   'capitalize',
          }}>
            {getStatusLabel(req.status)}
          </span>
          {req.criticalScore && (
            <span style={{
              backgroundColor: getSeverityBg(req.criticalScore),
              color:           getSeverityColor(req.criticalScore),
              padding:         '4px 12px',
              borderRadius:    theme.radiusFull,
              fontSize:        '12px',
              fontWeight:      '700',
            }}>
              ⚡ Severity {req.criticalScore}/10
            </span>
          )}
        </div>

        {/* Date */}
        {req.createdAt && (
          <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '10px' }}>
            📅 {typeof req.createdAt === 'string' ? req.createdAt : new Date(req.createdAt).toLocaleString()}
          </div>
        )}

        {/* Description */}
        <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: theme.textPrimary, lineHeight: 1.55 }}>
          {req.description}
        </p>

        {/* Meta grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '10px',
          fontSize:            '13px',
          backgroundColor:     theme.primaryBg,
          padding:             '12px',
          borderRadius:        theme.radiusMd,
          marginBottom:        '14px',
        }}>
          {req.affectedCount && (
            <div>
              <span style={{ color: theme.textMuted }}>👥 Affected</span>
              <br />
              <strong>{req.affectedCount} people</strong>
            </div>
          )}
          {req.requiredVolunteers && (
            <div>
              <span style={{ color: theme.textMuted }}>🤝 Volunteers</span>
              <br />
              <strong style={{ color: req.volunteerTeam?.length >= req.requiredVolunteers ? theme.success : theme.warning }}>
                {req.volunteerTeam?.length || 0} / {req.requiredVolunteers} assigned
              </strong>
            </div>
          )}
          {req.location && (
            <div>
              <span style={{ color: theme.textMuted }}>📍 Location</span>
              <br />
              <strong>{req.location.lat.toFixed(4)}, {req.location.lng.toFixed(4)}</strong>
            </div>
          )}
        </div>

        {/* Skills needed */}
        {req.needSkill?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '8px' }}>
              Skills Needed:
            </span>
            {req.needSkill.map((skill, i) => (
              <span key={i} style={styles.skillBadge}>{skill}</span>
            ))}
          </div>
        )}

        {/* ── Assigned Team ──────────────────────────────────────────── */}
        {req.volunteerTeam?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
              marginBottom:   '10px',
            }}>
              <span style={{
                fontSize:        '12px',
                fontWeight:      '700',
                color:           theme.primary,
                backgroundColor: theme.primaryBg,
                border:          `1px solid ${theme.primaryBorder}`,
                borderRadius:    theme.radiusFull,
                padding:         '3px 12px',
                textTransform:   'uppercase',
                letterSpacing:   '0.5px',
              }}>
                🤝 Assigned Team
              </span>
              <span style={{
                fontSize:        '12px',
                fontWeight:      '600',
                color:           theme.success,
                backgroundColor: theme.successLight,
                border:          `1px solid ${theme.successBorder}`,
                borderRadius:    theme.radiusFull,
                padding:         '3px 10px',
              }}>
                ✓ {req.volunteerTeam.length} confirmed
              </span>
            </div>
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap:                 '8px',
            }}>
              {req.volunteerTeam.map(uid => (
                <VolunteerMiniProfile key={uid} uid={uid} />
              ))}
            </div>
          </div>
        )}

        {/* ── Invited Volunteers (pending response) ──────────────────── */}
        {req.invitedVolunteers?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              marginBottom: '10px',
            }}>
              <span style={{
                fontSize:        '12px',
                fontWeight:      '700',
                color:           theme.warning,
                backgroundColor: theme.warningLight,
                border:          `1px solid ${theme.warningBorder}`,
                borderRadius:    theme.radiusFull,
                padding:         '3px 12px',
                textTransform:   'uppercase',
                letterSpacing:   '0.5px',
              }}>
                ⏳ Invited — Awaiting Response
              </span>
              <span style={{
                fontSize:        '12px',
                fontWeight:      '600',
                color:           theme.warning,
                backgroundColor: theme.warningLight,
                border:          `1px solid ${theme.warningBorder}`,
                borderRadius:    theme.radiusFull,
                padding:         '3px 10px',
              }}>
                {req.invitedVolunteers.length} pending
              </span>
            </div>

            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap:                 '8px',
            }}>
              {req.invitedVolunteers.map(uid => (
                <div
                  key={uid}
                  style={{
                    position:  'relative',
                    opacity:    0.75,
                    filter:    'grayscale(30%)',
                  }}
                >
                  <VolunteerMiniProfile uid={uid} />
                  {/* Pending overlay pill */}
                  <span style={{
                    position:        'absolute',
                    top:             '8px',
                    right:           '8px',
                    backgroundColor: theme.warningLight,
                    color:           theme.warning,
                    border:          `1px solid ${theme.warningBorder}`,
                    borderRadius:    theme.radiusFull,
                    fontSize:        '10px',
                    fontWeight:      '700',
                    padding:         '2px 7px',
                    pointerEvents:   'none',
                  }}>
                    invited
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No team at all — show a waiting state */}
        {!req.volunteerTeam?.length && !req.invitedVolunteers?.length && req.status === 'active' && (
          <div style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '10px',
            padding:         '12px 14px',
            backgroundColor: theme.primaryBg,
            border:          `1px solid ${theme.primaryBorder}`,
            borderRadius:    theme.radiusMd,
            marginBottom:    '14px',
            fontSize:        '13px',
            color:           theme.textMuted,
          }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            AI is searching for matching volunteers nearby…
          </div>
        )}

        {/* Admin feedback */}
        {req.adminFeedback && req.status === 'active' && (
          <div style={{
            padding:         '12px 14px',
            backgroundColor: theme.warningLight,
            borderRadius:    theme.radiusMd,
            fontSize:        '13px',
            borderLeft:      `3px solid ${theme.warning}`,
            borderRadius:    theme.radiusMd,
          }}>
            <strong style={{ color: theme.warning }}>📋 Admin Note:</strong>
            <span style={{ marginLeft: '6px', color: theme.textPrimary }}>{req.adminFeedback}</span>
          </div>
        )}
      </div>
    ))}
  </div>
)}
    </div>
  );
};
 
export default UserDashboard;