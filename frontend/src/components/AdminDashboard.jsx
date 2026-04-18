import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Wrapper } from '@googlemaps/react-wrapper';
import { theme, styles, getSeverityColor, getSeverityBg, getStatusColor, getStatusBg, getStatusLabel } from '../theme';
import CreateRequest from './CreateRequest';
import VolunteerMiniProfile from './VolunteerMiniProfile';

const AdminLocationMap = ({ center }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
      });

      markerInstance.current = new window.google.maps.Marker({
        position: center,
        map: mapInstance.current,
        animation: window.google.maps.Animation.DROP,
      });
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && markerInstance.current && center) {
      mapInstance.current.panTo(center);
      markerInstance.current.setPosition(center);
    }
  }, [center]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px', border: '1px solid #ccc' }} />;
};

// ── Shared Tab Button ─────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      padding:         '9px 18px',
      cursor:          'pointer',
      border:          'none',
      borderRadius:    theme.radiusMd,
      fontSize:        '13px',
      fontWeight:      active ? '700' : '500',
      backgroundColor: active ? theme.primary : 'transparent',
      color:           active ? 'white' : theme.textSecondary,
      display:         'flex',
      alignItems:      'center',
      gap:             '6px',
      transition:      'background 0.15s',
    }}
  >
    {label}
    {badge != null && (
      <span style={{
        backgroundColor: active ? 'rgba(255,255,255,0.25)' : theme.dangerLight,
        color:           active ? 'white' : theme.danger,
        fontSize:        '11px',
        fontWeight:      '700',
        padding:         '1px 7px',
        borderRadius:    theme.radiusFull,
        minWidth:        '20px',
        textAlign:       'center',
      }}>
        {badge}
      </span>
    )}
  </button>
);
 
// ── Severity Badge ────────────────────────────────────────────────────────────
const SeverityBadge = ({ score }) => (
  <span style={{
    backgroundColor: getSeverityBg(score),
    color:           getSeverityColor(score),
    padding:         '3px 10px',
    borderRadius:    theme.radiusFull,
    fontSize:        '12px',
    fontWeight:      '700',
  }}>
    ⚡ {score}/10
  </span>
);
 
// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span style={{
    backgroundColor: getStatusBg(status),
    color:           getStatusColor(status),
    padding:         '3px 10px',
    borderRadius:    theme.radiusFull,
    fontSize:        '12px',
    fontWeight:      '700',
    textTransform:   'capitalize',
  }}>
    {getStatusLabel(status)}
  </span>
);
 
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('issues'); 
  const [allIssues, setAllIssues] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [standardUsers, setStandardUsers] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTeamTask, setSelectedTeamTask] = useState(null);

  
  const [promotionData, setPromotionData] = useState({});
  const [selectedIssueLocation, setSelectedIssueLocation] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  useEffect(() => {
    fetchAllIssues();
    fetchPendingTasks();
    fetchStandardUsers();
    fetchVolunteers();
  }, []);

  const fetchAllIssues = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'requests'));
      const issues = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      issues.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAllIssues(issues);

      if (issues.length > 0 && issues[0].location) {
        setSelectedIssueLocation(issues[0].location);
        setSelectedIssueId(issues[0].id);
      }
    } catch (error) {
      console.error("Error fetching all issues:", error);
    }
  };

  const fetchPendingTasks = async () => {
    try {
      const q = query(collection(db, 'requests'), where('status', '==', 'pending_approval'));
      const querySnapshot = await getDocs(q);
      setPendingTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchStandardUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'user'));
      const querySnapshot = await getDocs(q);
      setStandardUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching standard users:", error);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'volunteer'));
      const querySnapshot = await getDocs(q);
      setVolunteers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching volunteers:", error);
    } finally {
      setLoading(false);
    }
  };
const handleApprove = async (taskId) => {
  // ── replaced: window.confirm ──────────────────────────────────────────────
  const confirmed = window.confirm("Approve this resolution?");
  if (!confirmed) return;

  setActionLoading(taskId);
  try {
    await updateDoc(doc(db, 'requests', taskId), {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
    fetchAllIssues();
    toast.success('Resolution approved successfully!');       
  } catch (error) {
    console.error(error);
    toast.error('Failed to approve resolution. Try again.'); 
  } finally {
    setActionLoading(null);
  }
};

const handleReject = async (taskId) => {
  const reason = window.prompt("Reason for rejection?");
  if (reason === null) return;
  if (!reason.trim()) {
    toast.warning('Please provide a rejection reason.');       
    return;
  }

  setActionLoading(taskId);
  try {
    await updateDoc(doc(db, 'requests', taskId), {
      status: 'active',
      resolution: null,
      adminFeedback: reason,
    });
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
    fetchAllIssues();
    toast.info('Resolution rejected and sent back to active.');
  } catch (error) {
    console.error(error);
    toast.error('Failed to reject resolution. Try again.');   
  } finally {
    setActionLoading(null);
  }
};

  const handleSkillChange = (uid, value) => {
    setPromotionData(prev => ({ ...prev, [uid]: value }));
  };

const handlePromoteToVolunteer = async (userObj) => {
  if (!userObj.phoneVerified) {
    toast.warning(                                        
      '⚠️ This user has not verified their phone number. Phone verification is required before promotion.'
    );
    return;
  }

  const uid = userObj.id;
  const skillsString = promotionData[uid];

  if (!skillsString?.trim()) {
    toast.warning('Please enter at least one skill before promoting.'); 
    return;
  }

  const skillsArray = skillsString.split(',').map(s => s.trim().toLowerCase());
  setActionLoading(uid);

  try {
    await updateDoc(doc(db, 'users', uid), { role: 'volunteer', skills: skillsArray });
    const updatedUser = { ...userObj, role: 'volunteer', skills: skillsArray };
    setStandardUsers(prev => prev.filter(u => u.id !== uid));
    setVolunteers(prev => [updatedUser, ...prev]);
    toast.success(`${userObj.name || 'User'} promoted to Volunteer!`);
  } catch (error) {
    console.error(error);
    toast.error('Failed to promote user. Please try again.');
  } finally {
    setActionLoading(null);
  }
};

  return (
    <div style={{
      maxWidth:   '1100px',
      margin:     '0 auto',
      padding:    '28px 20px',
      fontFamily: theme.fontFamily,
    }}>
      {/* Page heading */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: theme.textPrimary }}>
          🛡️ Admin Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary }}>
          Monitor all requests, manage volunteers, and audit resolutions.
        </p>
      </div>
 
      {/* Tabs */}
      <div style={{
        display:         'flex',
        gap:             '6px',
        backgroundColor: theme.primaryBg,
        padding:         '6px',
        borderRadius:    theme.radiusLg,
        marginBottom:    '28px',
        border:          `1px solid ${theme.border}`,
        flexWrap:        'wrap',
      }}>
        <TabBtn label="All Issues"          active={activeTab === 'issues'}    onClick={() => setActiveTab('issues')} />
        <TabBtn label="Approvals"           active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} badge={pendingTasks.length} />
        <TabBtn label="User Management"     active={activeTab === 'users'}     onClick={() => setActiveTab('users')} />
        <TabBtn label="Create Request"      active={activeTab === 'create'}    onClick={() => setActiveTab('create')} />
      </div>
 
      {/* ── Tab: All Issues + Map ─────────────────────────────────────────── */}
      {activeTab === 'issues' && (
  <div style={{ display: 'flex', gap: '20px', height: '680px' }}>

    {/* Issue list */}
    <div style={{
      width:           '380px',
      flexShrink:      0,
      overflowY:       'auto',
      border:          `1px solid ${theme.border}`,
      borderRadius:    theme.radiusLg,
      padding:         '16px',
      backgroundColor: theme.primaryBg,
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: theme.textPrimary }}>
        All Recorded Requests
      </h3>

      {allIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          No issues reported yet.
        </div>
      ) : allIssues.map(issue => (
        <div
          key={issue.id}
          onClick={() => {
            if (issue.location) {
              setSelectedIssueLocation(issue.location);
              setSelectedIssueId(issue.id);
            }
          }}
          style={{
            border:          `1px solid ${theme.border}`,
            borderLeft:      `4px solid ${getStatusColor(issue.status)}`,
            padding:         '14px',
            marginBottom:    '10px',
            borderRadius:    theme.radiusMd,
            backgroundColor: selectedIssueId === issue.id ? theme.primaryBgCard : 'white',
            cursor:          issue.location ? 'pointer' : 'default',
            boxShadow:       selectedIssueId === issue.id ? theme.shadowMd : theme.shadow,
            transition:      'box-shadow 0.15s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <StatusBadge status={issue.status} />
            <SeverityBadge score={issue.criticalScore} />
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: theme.textPrimary, lineHeight: 1.4 }}>
            {issue.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: theme.textMuted }}>
            <span>
              {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : '—'}
            </span>

            {/* ── Clickable Team badge ────────────────────────────── */}
            <span
              onClick={e => {
                e.stopPropagation(); // don't pan the map
                setSelectedTeamTask(issue);
              }}
              style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '5px',
                fontSize:        '12px',
                fontWeight:      '600',
                color:           issue.volunteerTeam?.length > 0 ? theme.primary : theme.textMuted,
                backgroundColor: issue.volunteerTeam?.length > 0 ? theme.primaryBg : 'transparent',
                border:          issue.volunteerTeam?.length > 0 ? `1px solid ${theme.primaryBorder}` : '1px solid transparent',
                borderRadius:    theme.radiusFull,
                padding:         '3px 10px',
                cursor:          issue.volunteerTeam?.length > 0 ? 'pointer' : 'default',
                transition:      'background-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (issue.volunteerTeam?.length > 0) {
                  e.currentTarget.style.backgroundColor = theme.primaryBgCard;
                  e.currentTarget.style.color = theme.primaryDark;
                }
              }}
              onMouseLeave={e => {
                if (issue.volunteerTeam?.length > 0) {
                  e.currentTarget.style.backgroundColor = theme.primaryBg;
                  e.currentTarget.style.color = theme.primary;
                }
              }}
            >
              🤝 Team: {issue.volunteerTeam?.length || 0}
              {issue.volunteerTeam?.length > 0 && (
                <span style={{ opacity: 0.6, fontSize: '11px' }}>↗</span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Map */}
    <div style={{ flex: 1, borderRadius: theme.radiusLg, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
      {selectedIssueLocation ? (
        <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <AdminLocationMap center={selectedIssueLocation} />
        </Wrapper>
      ) : (
        <div style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: theme.primaryBg,
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
          <p style={{ color: theme.textSecondary, fontSize: '14px' }}>
            Click any issue with a location to view on map.
          </p>
        </div>
      )}
    </div>
  </div>
)}


{/* ── Team Modal ────────────────────────────────────────────────────────── */}
{selectedTeamTask && (
  <div
    onClick={() => setSelectedTeamTask(null)}
    style={{
      position:        'fixed',
      inset:           0,
      backgroundColor: theme.bgOverlay,
      zIndex:          999,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '20px',
      backdropFilter:  'blur(2px)',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        backgroundColor: theme.bgCard,
        borderRadius:    theme.radiusXl,
        width:           '100%',
        maxWidth:        '580px',
        maxHeight:       '85vh',
        overflowY:       'auto',
        boxShadow:       '0 24px 64px rgba(0,0,0,0.28)',
        border:          `1px solid ${theme.border}`,
      }}
    >
      {/* Modal header */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '14px 20px',
        backgroundColor: theme.primaryBg,
        borderBottom:    `1px solid ${theme.primaryBorder}`,
        borderRadius:    `${theme.radiusXl} ${theme.radiusXl} 0 0`,
        position:        'sticky',
        top:             0,
        zIndex:          1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>🤝</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary }}>
              Volunteer Team
            </div>
            <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '1px' }}>
              {selectedTeamTask.volunteerTeam.length} member{selectedTeamTask.volunteerTeam.length !== 1 ? 's' : ''} assigned
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedTeamTask(null)}
          style={{
            background:      'none',
            border:          `1px solid ${theme.primaryBorder}`,
            borderRadius:    theme.radiusFull,
            width:           '30px',
            height:          '30px',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '18px',
            cursor:          'pointer',
            color:           theme.textMuted,
            flexShrink:      0,
          }}
        >
          ×
        </button>
      </div>

      {/* Request context strip */}
      <div style={{
        margin:          '16px 20px 0',
        padding:         '12px 14px',
        backgroundColor: theme.primaryBgCard,
        border:          `1px solid ${theme.primaryBorder}`,
        borderRadius:    theme.radiusMd,
        display:         'flex',
        alignItems:      'flex-start',
        justifyContent:  'space-between',
        gap:             '12px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Request
          </div>
          <div style={{ fontSize: '14px', color: theme.textPrimary, lineHeight: 1.4 }}>
            {selectedTeamTask.description}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <StatusBadge status={selectedTeamTask.status} />
          <SeverityBadge score={selectedTeamTask.criticalScore} />
        </div>
      </div>

      {/* Team members */}
      <div style={{ padding: '16px 20px 20px' }}>
        {/* Team fill indicator */}
        {selectedTeamTask.requiredVolunteers && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textSecondary }}>
                Team capacity
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: theme.primary }}>
                {selectedTeamTask.volunteerTeam.length} / {selectedTeamTask.requiredVolunteers}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: theme.borderLight, borderRadius: theme.radiusFull, overflow: 'hidden' }}>
              <div style={{
                height:          '100%',
                width:           `${Math.min(100, (selectedTeamTask.volunteerTeam.length / selectedTeamTask.requiredVolunteers) * 100)}%`,
                backgroundColor: selectedTeamTask.volunteerTeam.length >= selectedTeamTask.requiredVolunteers
                  ? theme.success
                  : theme.warning,
                borderRadius:    theme.radiusFull,
                transition:      'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Member cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedTeamTask.volunteerTeam.map((uid, idx) => (
            <div
              key={uid}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '10px',
                padding:         '4px 0',
              }}
            >
              <span style={{
                width:           '22px',
                height:          '22px',
                borderRadius:    theme.radiusFull,
                backgroundColor: theme.primaryBg,
                border:          `1px solid ${theme.primaryBorder}`,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontSize:        '11px',
                fontWeight:      '700',
                color:           theme.primary,
                flexShrink:      0,
              }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <VolunteerMiniProfile uid={uid} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
 

{/* ── Tab: Approvals ────────────────────────────────────────────────── */}
{activeTab === 'approvals' && (
  <div>
    {pendingTasks.length === 0 ? (
      <div style={{
        textAlign:       'center',
        padding:         '60px 20px',
        backgroundColor: theme.successLight,
        borderRadius:    theme.radiusLg,
        border:          `1px solid ${theme.successBorder}`,
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
        <p style={{ margin: 0, fontWeight: '600', color: theme.success }}>
          No pending approvals right now!
        </p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pendingTasks.map(task => (

          // ── Card ─────────────────────────────────────────────────────
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            style={{
              backgroundColor: theme.bgCard,
              border:          `1px solid ${theme.border}`,
              borderLeft:      `5px solid ${theme.warning}`,
              borderRadius:    theme.radiusLg,
              boxShadow:       theme.shadow,
              overflow:        'hidden',
              cursor:          'pointer',
              transition:      'box-shadow 0.18s, transform 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = theme.shadowMd;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = theme.shadow;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Card header strip */}
            <div style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'space-between',
              padding:         '11px 18px',
              backgroundColor: theme.warningLight,
              borderBottom:    `1px solid ${theme.warningBorder}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SeverityBadge score={task.criticalScore} />
                <StatusBadge status={task.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {task.createdAt && (
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    {new Date(task.createdAt).toLocaleString()}
                  </span>
                )}
                <span style={{
                  fontSize:        '12px',
                  fontWeight:      '600',
                  color:           theme.warning,
                  backgroundColor: 'white',
                  border:          `1px solid ${theme.warningBorder}`,
                  borderRadius:    theme.radiusFull,
                  padding:         '3px 12px',
                  whiteSpace:      'nowrap',
                }}>
                  Review →
                </span>
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '16px 18px' }}>
              {/* Description */}
              <p style={{
                margin:     '0 0 14px 0',
                fontSize:   '15px',
                fontWeight: '500',
                color:      theme.textPrimary,
                lineHeight: 1.55,
              }}>
                {task.description}
              </p>

              {/* Meta row */}
              <div style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap:                 '10px',
                backgroundColor:     theme.primaryBg,
                padding:             '12px 14px',
                borderRadius:        theme.radiusMd,
                border:              `1px solid ${theme.primaryBorder}`,
                fontSize:            '13px',
              }}>
                {task.affectedCount && (
                  <div>
                    <div style={{ color: theme.textMuted, marginBottom: '3px' }}>👥 Affected</div>
                    <div style={{ fontWeight: '700', color: theme.textPrimary }}>{task.affectedCount} people</div>
                  </div>
                )}
                {task.requiredVolunteers && (
                  <div>
                    <div style={{ color: theme.textMuted, marginBottom: '3px' }}>🤝 Team</div>
                    <div style={{ fontWeight: '700', color: theme.textPrimary }}>
                      {task.volunteerTeam?.length || 0} / {task.requiredVolunteers}
                    </div>
                  </div>
                )}
                {task.needSkill?.length > 0 && (
                  <div>
                    <div style={{ color: theme.textMuted, marginBottom: '5px' }}>🛠️ Skills needed</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {task.needSkill.map((sk, i) => (
                        <span key={i} style={styles.skillBadge}>{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}


    {/* ── Modal ──────────────────────────────────────────────────────── */}
    {selectedTask && (
      <div
        onClick={() => setSelectedTask(null)}
        style={{
          position:        'fixed',
          inset:           0,
          backgroundColor: theme.bgOverlay,
          zIndex:          999,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         '20px',
          backdropFilter:  'blur(2px)',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: theme.bgCard,
            borderRadius:    theme.radiusXl,
            width:           '100%',
            maxWidth:        '980px',
            maxHeight:       '92vh',
            overflowY:       'auto',
            boxShadow:       '0 24px 64px rgba(0,0,0,0.28)',
            border:          `1px solid ${theme.border}`,
          }}
        >
          {/* Modal sticky header */}
          <div style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            padding:         '14px 20px',
            backgroundColor: theme.warningLight,
            borderBottom:    `1px solid ${theme.warningBorder}`,
            borderRadius:    `${theme.radiusXl} ${theme.radiusXl} 0 0`,
            position:        'sticky',
            top:             0,
            zIndex:          1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SeverityBadge score={selectedTask.criticalScore} />
              <StatusBadge status={selectedTask.status} />
              {selectedTask.createdAt && (
                <span style={{ fontSize: '12px', color: theme.textMuted }}>
                  {new Date(selectedTask.createdAt).toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              style={{
                background:   'none',
                border:       `1px solid ${theme.warningBorder}`,
                borderRadius: theme.radiusFull,
                width:        '30px',
                height:       '30px',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '18px',
                cursor:       'pointer',
                color:        theme.textMuted,
                flexShrink:   0,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '22px' }}>

            {/* ── Volunteer Team ──────────────────────────────────── */}
            {selectedTask.volunteerTeam?.length > 0 && (
              <div style={{ marginBottom: '22px' }}>
                <div style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '8px',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    display:         'inline-flex',
                    alignItems:      'center',
                    gap:             '6px',
                    fontSize:        '12px',
                    fontWeight:      '700',
                    color:           theme.primary,
                    backgroundColor: theme.primaryBg,
                    border:          `1px solid ${theme.primaryBorder}`,
                    borderRadius:    theme.radiusFull,
                    padding:         '4px 12px',
                    textTransform:   'uppercase',
                    letterSpacing:   '0.5px',
                  }}>
                    🤝 Volunteer Team
                  </span>
                  <span style={{
                    fontSize:        '12px',
                    fontWeight:      '600',
                    color:           theme.textMuted,
                    backgroundColor: theme.primaryBg,
                    border:          `1px solid ${theme.primaryBorder}`,
                    borderRadius:    theme.radiusFull,
                    padding:         '4px 10px',
                  }}>
                    {selectedTask.volunteerTeam.length} member{selectedTask.volunteerTeam.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap:                 '10px',
                }}>
                  {selectedTask.volunteerTeam.map(uid => (
                    <VolunteerMiniProfile key={uid} uid={uid} />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{
              height:          '1px',
              backgroundColor: theme.borderLight,
              margin:          '0 0 22px 0',
            }} />

            {/* ── Resolution Submitted ────────────────────────────── */}
            <div style={{
              backgroundColor: theme.infoLight,
              border:          `1px solid ${theme.infoBorder}`,
              borderRadius:    theme.radiusLg,
              overflow:        'hidden',
              marginBottom:    '22px',
            }}>
              {/* Resolution header */}
              <div style={{
                padding:         '10px 16px',
                borderBottom:    `1px solid ${theme.infoBorder}`,
                display:         'flex',
                alignItems:      'center',
                gap:             '8px',
              }}>
                <span style={{
                  fontSize:      '12px',
                  fontWeight:    '700',
                  color:         theme.info,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  📋 Resolution Submitted
                </span>
              </div>

              <div style={{ padding: '14px 16px' }}>
                {/* Notes */}
                {selectedTask.resolution?.notes ? (
                  <p style={{
                    fontSize:   '14px',
                    margin:     '0 0 14px 0',
                    color:      theme.textPrimary,
                    lineHeight: 1.6,
                    padding:    '10px 14px',
                    backgroundColor: 'white',
                    borderRadius:    theme.radiusMd,
                    border:          `1px solid ${theme.infoBorder}`,
                  }}>
                    "{selectedTask.resolution.notes}"
                  </p>
                ) : (
                  <p style={{
                    fontSize:   '13px',
                    margin:     '0 0 14px 0',
                    fontStyle:  'italic',
                    color:      theme.textMuted,
                  }}>
                    No text notes provided.
                  </p>
                )}

                {/* Proof images */}
                {selectedTask.resolution?.proofImages?.length > 0 ? (
                  <div>
                    <div style={{
                      fontSize:      '12px',
                      fontWeight:    '600',
                      color:         theme.info,
                      marginBottom:  '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}>
                      🖼 Proof Images ({selectedTask.resolution.proofImages.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedTask.resolution.proofImages.map((url, idx) => (
                        
                         <a
      key={idx}
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'block', flexShrink: 0 }}
    >
                          <img
                            src={url}
                            alt={`Proof ${idx + 1}`}
                            style={{
                              width:        100,
                              height:       100,
                              objectFit:    'cover',
                              borderRadius: theme.radiusMd,
                              border:       `2px solid white`,
                              boxShadow:    theme.shadow,
                              transition:   'transform 0.15s, box-shadow 0.15s',
                              display:      'block',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform  = 'scale(1.04)';
                              e.currentTarget.style.boxShadow  = theme.shadowMd;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform  = 'scale(1)';
                              e.currentTarget.style.boxShadow  = theme.shadow;
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '8px',
                    padding:         '10px 14px',
                    backgroundColor: 'white',
                    borderRadius:    theme.radiusMd,
                    border:          `1px solid ${theme.infoBorder}`,
                    fontSize:        '13px',
                    fontStyle:       'italic',
                    color:           theme.textMuted,
                  }}>
                    No proof images uploaded.
                  </div>
                )}
              </div>
            </div>

            {/* ── Action buttons ──────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { handleApprove(selectedTask.id); setSelectedTask(null); }}
                disabled={actionLoading === selectedTask.id}
                style={{
                  flex:            1,
                  padding:         '13px',
                  backgroundColor: actionLoading === selectedTask.id ? theme.textMuted : theme.success,
                  color:           'white',
                  border:          'none',
                  borderRadius:    theme.radiusMd,
                  fontWeight:      '700',
                  fontSize:        '14px',
                  cursor:          actionLoading === selectedTask.id ? 'not-allowed' : 'pointer',
                  transition:      'background-color 0.15s, transform 0.1s',
                  fontFamily:      theme.fontFamily,
                }}
                onMouseEnter={e => { if (actionLoading !== selectedTask.id) e.currentTarget.style.backgroundColor = theme.primaryDark; }}
                onMouseLeave={e => { if (actionLoading !== selectedTask.id) e.currentTarget.style.backgroundColor = theme.success; }}
              >
                {actionLoading === selectedTask.id ? 'Processing…' : '✅ Approve & Mark Resolved'}
              </button>
              <button
                onClick={() => { handleReject(selectedTask.id); setSelectedTask(null); }}
                disabled={actionLoading === selectedTask.id}
                style={{
                  flex:            1,
                  padding:         '13px',
                  backgroundColor: actionLoading === selectedTask.id ? theme.textMuted : theme.danger,
                  color:           'white',
                  border:          'none',
                  borderRadius:    theme.radiusMd,
                  fontWeight:      '700',
                  fontSize:        '14px',
                  cursor:          actionLoading === selectedTask.id ? 'not-allowed' : 'pointer',
                  transition:      'background-color 0.15s',
                  fontFamily:      theme.fontFamily,
                }}
                onMouseEnter={e => { if (actionLoading !== selectedTask.id) e.currentTarget.style.backgroundColor = '#B91C1C'; }}
                onMouseLeave={e => { if (actionLoading !== selectedTask.id) e.currentTarget.style.backgroundColor = theme.danger; }}
              >
                ❌ Reject & Re-open
              </button>
            </div>

          </div>
        </div>
      </div>
    )}
  </div>
)}
 
      {/* ── Tab: User Management ──────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
 
          {/* Standard Users */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: theme.textPrimary }}>
                Standard Users
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>
                Assign skills to promote a user to Volunteer status.
              </p>
            </div>
            {standardUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, backgroundColor: theme.primaryBg, borderRadius: theme.radiusLg, border: `1px solid ${theme.border}` }}>
                No standard users found.
              </div>
            ) : standardUsers.map(u => (
              <div key={u.id} style={{ ...styles.card, marginBottom: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary, marginBottom: '4px' }}>
                    {u.name || 'No name set'}
                  </div>
                  <div style={{ fontSize: '13px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📞 {u.phone || 'No phone'}
                    {u.phoneVerified ? (
                      <span style={{ color: theme.success, fontSize: '11px', fontWeight: '700' }}>✅ Verified</span>
                    ) : (
                      <span style={{ color: theme.danger, fontSize: '11px', fontWeight: '700' }}>⚠️ Unverified</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Skills, e.g. medical, rescue"
                    value={promotionData[u.id] || ''}
                    onChange={(e) => handleSkillChange(u.id, e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button
                    onClick={() => handlePromoteToVolunteer(u)}
                    disabled={actionLoading === u.id || !u.phoneVerified}
                    title={!u.phoneVerified ? 'User must verify phone first' : ''}
                    style={{
                      ...styles.btnPrimary,
                      width:   'auto',
                      padding: '10px 16px',
                      opacity: (!u.phoneVerified || actionLoading === u.id) ? 0.5 : 1,
                      cursor:  (!u.phoneVerified || actionLoading === u.id) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading === u.id ? '…' : 'Promote'}
                  </button>
                </div>
              </div>
            ))}
          </div>
 
          {/* Active Volunteers */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: theme.textPrimary }}>
                Active Volunteers
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>
                Currently enrolled relief network volunteers.
              </p>
            </div>
            {volunteers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, backgroundColor: theme.primaryBg, borderRadius: theme.radiusLg, border: `1px solid ${theme.border}` }}>
                No active volunteers yet.
              </div>
            ) : volunteers.map(v => (
              <div key={v.id} style={{
                ...styles.card,
                marginBottom:    '12px',
                borderLeft:      `4px solid ${theme.primary}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary }}>
                      {v.name || 'Unnamed Volunteer'}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
                      📞 {v.phone} <span style={{ color: theme.success }}>✅</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize:        '11px',
                    fontWeight:      '700',
                    color:           theme.primary,
                    backgroundColor: theme.primaryBgCard,
                    padding:         '3px 10px',
                    borderRadius:    theme.radiusFull,
                    border:          `1px solid ${theme.primaryBorder}`,
                  }}>
                    🤝 Volunteer
                  </span>
                </div>
                {v.skills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {v.skills.map((sk, i) => (
                      <span key={i} style={styles.skillBadge}>{sk}</span>
                    ))}
                  </div>
                )}
                {v.workLocation && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: theme.textMuted }}>
                    📍 Base: {v.workLocation.lat?.toFixed(4)}, {v.workLocation.lng?.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* ── Tab: Create Request ───────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>
              Admin Override — New Request
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary }}>
              Submit a new emergency request on behalf of a community member.
            </p>
          </div>
          <CreateRequest />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;