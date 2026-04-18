 import React, { useState, useEffect, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { toast } from 'react-toastify';
import { auth, db } from '../config/firebase';
import { theme, styles, getSeverityColor, getSeverityBg, getStatusColor, getStatusLabel } from '../theme';
import { collection, query, where, getDocs, updateDoc, getDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import CreateRequest from './CreateRequest';
import SubmitResolution from './SubmitResolution';
import NearbyTasksMap from './NearbyTasksMap';
import VolunteerMiniProfile from './VolunteerMiniProfile';


 
const TabBtn = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      padding:         '9px 16px',
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
      whiteSpace:      'nowrap',
    }}
  >
    {label}
    {badge != null && badge > 0 && (
      <span style={{
        backgroundColor: active ? 'rgba(255,255,255,0.25)' : theme.primaryBgCard,
        color:           active ? 'white' : theme.primary,
        fontSize:        '11px',
        fontWeight:      '700',
        padding:         '1px 7px',
        borderRadius:    theme.radiusFull,
      }}>
        {badge}
      </span>
    )}
  </button>
);
 

const LocationPickerMap = ({ location, setLocation }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
      });

      markerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapInstance.current,
        draggable: true,
        title: "Drag to exact working area",
        animation: window.google.maps.Animation.DROP,
      });

      markerRef.current.addListener('dragend', () => {
        const newPos = markerRef.current.getPosition();
        setLocation({ lat: newPos.lat(), lng: newPos.lng() });
      });
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && markerRef.current && location) {
      mapInstance.current.setCenter(location);
      markerRef.current.setPosition(location);
    }
  }, [location]);

  return <div ref={mapRef} style={{ width: '100%', height: '300px', borderRadius: '8px', marginTop: '10px', border: '1px solid #ccc' }} />;
};
const VolunteerDashboard = () => {
  // ── replace with your real state ──────────────────────────────────────────
 const [pendingInvites, setPendingInvites] = useState([]);
  const [workLocation, setWorkLocation] = useState(null);
  const [skills, setSkills] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [nearbyTasks, setNearbyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [resolvingTaskId, setResolvingTaskId] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 26.8054, lng: 81.0209 });
  const [selectedTeamTask, setSelectedTeamTask] = useState(null);
  

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [locationStatusMsg, setLocationStatusMsg] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const user = auth.currentUser;

useEffect(() => {
    if (user) {
      fetchVolunteerData();
      fetchAssignedTasks();
      fetchPendingInvites();
    }
  }, [user]);

  
  const fetchPendingInvites = async () => {
    try {
      const q = query(
        collection(db, 'requests'), 
        where('invitedVolunteers', 'array-contains', user.uid),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      const invites = [];
      snap.forEach(doc => invites.push({ id: doc.id, ...doc.data() }));
      setPendingInvites(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handleAcceptInvite = async (request) => {
  try {
    await updateDoc(doc(db, 'requests', request.id), {
      invitedVolunteers: arrayRemove(user.uid),
      volunteerTeam:     arrayUnion(user.uid),
    });
    toast.success('You have joined the team!');                // ✅ success
    fetchPendingInvites();
    fetchAssignedTasks();
    if (workLocation) fetchNearbyTasks(workLocation);
  } catch (error) {
    console.error(error);
    toast.error('Failed to accept invite. Please try again.'); // ❌ error
  }
};

const handleDeclineInvite = async (request) => {
  try {
    await updateDoc(doc(db, 'requests', request.id), {
      invitedVolunteers: arrayRemove(user.uid),
    });
    toast.info('Invite declined.');                            // ℹ️ info
    fetchPendingInvites();
  } catch (error) {
    console.error(error);
    toast.error('Failed to decline invite.');                  // ❌ error
  }
};



const handleJoinTeam = async (request, e) => {
  e.stopPropagation();
  if (!user) return;
  try {
    await updateDoc(doc(db, 'requests', request.id), {
      volunteerTeam: arrayUnion(user.uid),
    });
    toast.success('You have successfully joined the team!');   // ✅ success
    fetchAssignedTasks();
    if (workLocation) fetchNearbyTasks(workLocation);
  } catch (error) {
    console.error(error);
    toast.error('Failed to join the team. Please try again.'); // ❌ error
  }
};


  const fetchVolunteerData = async () => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.skills) setSkills(data.skills);
      
      if (data.workLocation) {
        setWorkLocation(data.workLocation);
        fetchNearbyTasks(data.workLocation);
        setMapCenter(data.workLocation); 
      } else {
        setTempLocation({ lat: 26.8054, lng: 81.0209 });
        setShowLocationModal(true);
      }
    }
    setLoading(false); 
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const fetchNearbyTasks = async (userLoc) => {
    try {
      const q = query(collection(db, 'requests'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      
      const tasksInRange = [];
      snap.forEach(document => {
        const task = { id: document.id, ...document.data() };
        if (task.location) {
          const dist = calculateDistance(userLoc.lat, userLoc.lng, task.location.lat, task.location.lng);
          if (dist <= 20) tasksInRange.push(task);
        }
      });
      tasksInRange.sort((a, b) => (b.criticalScore || 0) - (a.criticalScore || 0));
      setNearbyTasks(tasksInRange);
    } catch (error) {
      console.error("Error fetching nearby tasks:", error);
    }
  };

  const fetchAssignedTasks = async () => {
    try {
      const q = query(collection(db, 'requests'), where('volunteerTeam', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      const active = [];
      const completed = [];

      querySnapshot.forEach((doc) => {
        const task = { id: doc.id, ...doc.data() };
        if (task.status === 'active') active.push(task);
        else completed.push(task);
      });

      setActiveTasks(active);
      setCompletedTasks(completed);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

const handleAutoDetect = () => {
  if (!navigator.geolocation) {
    toast.warning('Geolocation is not supported by your browser.'); // ⚠️ warning
    return;
  }
  toast.info('Detecting your location…');                           // ℹ️ info
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setTempLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      toast.success('Location captured! Drag the pin to refine if needed.'); // ✅ success
      setLocationStatusMsg('');
    },
    (error) => {
      console.error(error);
      toast.error('Could not auto-detect location. Drag the pin manually.'); // ❌ error
    },
    { enableHighAccuracy: true }
  );
};

const handleSaveLocation = async () => {
  if (!tempLocation) return;
  setIsSavingLocation(true);
  try {
    await updateDoc(doc(db, 'users', user.uid), { workLocation: tempLocation });
    setWorkLocation(tempLocation);
    setMapCenter(tempLocation);
    fetchNearbyTasks(tempLocation);
    setShowLocationModal(false);
    toast.success('Work location saved!');                      // ✅ success
  } catch (error) {
    console.error(error);
    toast.error('Failed to save location. Please try again.'); // ❌ error
  } finally {
    setIsSavingLocation(false);
  }
};
  return (
    <div style={{ fontFamily: theme.fontFamily, minHeight: '100vh', backgroundColor: theme.bg }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 20px' }}>
 {/* ── Pending Invites ────────────────────────────────────────────────── */}
{pendingInvites.length > 0 && (
  <div style={{ marginBottom: '28px' }}>

    {/* Section header */}
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      marginBottom:   '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>🚨</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: theme.textPrimary }}>
          Urgent Assignments
        </span>
        <span style={{
          backgroundColor: theme.danger,
          color:           'white',
          fontSize:        '11px',
          fontWeight:      '800',
          padding:         '2px 8px',
          borderRadius:    theme.radiusFull,
        }}>
          {pendingInvites.length}
        </span>
      </div>
      <span style={{ fontSize: '12px', color: theme.textMuted }}>
        AI‑matched to your skills
      </span>
    </div>

    {/* Cards */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {pendingInvites.map(invite => {
        const score    = invite.criticalScore || 0;
        const teamSize = invite.volunteerTeam?.length || 0;
        const isFull   = teamSize >= (invite.requiredVolunteers || 1);

        // severity label
        const severityLabel = score >= 8 ? 'Critical' : score >= 5 ? 'High' : 'Moderate';

        // which of the volunteer's skills match the task
        const matchedSkills  = skills.filter(s => invite.needSkill?.includes(s));
        const unmatchedSkills = (invite.needSkill || []).filter(s => !skills.includes(s));

        return (
          <div
            key={invite.id}
            style={{
              backgroundColor: theme.bgCard,
              border:          `1px solid ${theme.warningBorder}`,
              borderLeft:      `4px solid ${getSeverityColor(score)}`,
              borderRadius:    theme.radiusLg,
              overflow:        'hidden',
              boxShadow:       theme.shadow,
            }}
          >
            {/* Card body */}
            <div style={{ padding: '14px 16px 12px' }}>

              {/* Top row: severity + distance + time */}
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                marginBottom:   '10px',
                flexWrap:       'wrap',
                gap:            '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    backgroundColor: getSeverityBg(score),
                    color:           getSeverityColor(score),
                    fontSize:        '11px',
                    fontWeight:      '700',
                    padding:         '3px 10px',
                    borderRadius:    theme.radiusFull,
                  }}>
                    ⚡ {score}/10 {severityLabel}
                  </span>
                  {workLocation && invite.location && (
                    <span style={{
                      backgroundColor: theme.warningLight,
                      color:           theme.warning,
                      fontSize:        '11px',
                      fontWeight:      '600',
                      padding:         '3px 10px',
                      borderRadius:    theme.radiusFull,
                      border:          `1px solid ${theme.warningBorder}`,
                    }}>
                      📍 {calculateDistance(
                        workLocation.lat, workLocation.lng,
                        invite.location.lat, invite.location.lng
                      ).toFixed(1)} km
                    </span>
                  )}
                </div>
                {invite.createdAt && (
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>
                    {new Date(invite.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{
                margin:     '0 0 10px 0',
                fontSize:   '15px',
                fontWeight: '600',
                color:      theme.textPrimary,
                lineHeight: 1.4,
              }}>
                {invite.description}
              </p>

              {/* Meta chips */}
              <div style={{
                display:        'flex',
                gap:            '14px',
                fontSize:       '12px',
                color:          theme.textSecondary,
                marginBottom:   '12px',
                flexWrap:       'wrap',
              }}>
                {invite.affectedCount && (
                  <span>👥 {invite.affectedCount} affected</span>
                )}
                <span style={{
                  color: isFull ? theme.danger : theme.success,
                  fontWeight: '600',
                }}>
                  🤝 Team: {teamSize}/{invite.requiredVolunteers || '?'}
                </span>
              </div>

              {/* Skills — matched highlighted green, others muted */}
              {(invite.needSkill?.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {matchedSkills.map((sk, i) => (
                    <span key={i} style={{
                      backgroundColor: theme.primaryBgCard,
                      color:           theme.primaryDark,
                      border:          `1px solid ${theme.primaryBorder}`,
                      fontSize:        '11px',
                      fontWeight:      '700',
                      padding:         '3px 10px',
                      borderRadius:    theme.radiusFull,
                    }}>
                      ✓ {sk}
                    </span>
                  ))}
                  {unmatchedSkills.map((sk, i) => (
                    <span key={i} style={{
                      ...styles.skillBadge,
                      fontSize: '11px',
                    }}>
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons — flush bottom, split */}
            <div style={{
              display:     'flex',
              borderTop:   `1px solid ${theme.warningBorder}`,
            }}>
              <button
                onClick={() => handleAcceptInvite(invite)}
                style={{
                  flex:            1,
                  padding:         '11px',
                  backgroundColor: theme.success,
                  color:           'white',
                  border:          'none',
                  borderRadius:    `0 0 0 ${theme.radiusLg}`,
                  fontWeight:      '700',
                  fontSize:        '13px',
                  cursor:          'pointer',
                  fontFamily:      theme.fontFamily,
                  transition:      'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.primaryDark}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.success}
              >
                ✅ Accept & Join Team
              </button>
              <div style={{ width: '1px', backgroundColor: theme.warningBorder }} />
              <button
                onClick={() => handleDeclineInvite(invite)}
                style={{
                  flex:            1,
                  padding:         '11px',
                  backgroundColor: theme.bgCard,
                  color:           theme.danger,
                  border:          'none',
                  borderRadius:    `0 0 ${theme.radiusLg} 0`,
                  fontWeight:      '600',
                  fontSize:        '13px',
                  cursor:          'pointer',
                  fontFamily:      theme.fontFamily,
                  transition:      'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.dangerLight}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.bgCard}
              >
                ✕ Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
        {/* ── Dashboard header ───────────────────────────────────────────── */}
        <div style={{
          display:         'flex',
          justifyContent:  'space-between',
          alignItems:      'center',
          marginBottom:    '20px',
          flexWrap:        'wrap',
          gap:             '12px',
        }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: theme.textPrimary }}>
              🤝 Volunteer Dashboard
            </h1>
          </div>
          <div style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '8px',
            fontSize:        '13px',
            fontWeight:      '500',
            color:           theme.textSecondary,
            backgroundColor: theme.primaryBg,
            padding:         '8px 14px',
            borderRadius:    theme.radiusFull,
            border:          `1px solid ${theme.primaryBorder}`,
          }}>
            📍
            {workLocation
              ? <><strong style={{ color: theme.textPrimary }}>Base:</strong> {workLocation.lat.toFixed(4)}, {workLocation.lng.toFixed(4)}</>
              : <span style={{ color: theme.danger }}>Base area not set</span>
            }
          </div>
        </div>
 
        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div style={{
          display:         'flex',
          gap:             '6px',
          backgroundColor: theme.primaryBg,
          padding:         '6px',
          borderRadius:    theme.radiusLg,
          marginBottom:    '28px',
          border:          `1px solid ${theme.border}`,
          overflowX:       'auto',
        }}>
          <TabBtn label="⚡ Active Tasks"     active={activeTab === 'active'}  onClick={() => setActiveTab('active')}  badge={activeTasks.length} />
          <TabBtn label="🗺️ Map & Nearby"    active={activeTab === 'nearby'}  onClick={() => setActiveTab('nearby')}  badge={nearbyTasks.length} />
          <TabBtn label="🚨 Create Request"   active={activeTab === 'create'}  onClick={() => setActiveTab('create')} />
          <TabBtn label="📋 History"          active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </div>
 
        {/* ── Tab: Active Tasks ────────────────────────────────────────────── */}
        {activeTab === 'active' && (
          <div>
            {activeTasks.length === 0 ? (
              <div style={{
                textAlign:       'center',
                padding:         '60px 24px',
                backgroundColor: theme.primaryBg,
                borderRadius:    theme.radiusLg,
                border:          `1px solid ${theme.border}`,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <p style={{ margin: 0, fontWeight: '600', color: theme.textSecondary }}>
                  No active tasks right now. Check the map for nearby needs!
                </p>
              </div>
            ) : activeTasks.map(task => {
              const distance = workLocation && task.location
                ? calculateDistance(workLocation.lat, workLocation.lng, task.location.lat, task.location.lng)
                : null;
 
              return (
                <div key={task.id} style={{
                  border:          `1px solid ${theme.border}`,
                  borderLeft:      `5px solid ${theme.primary}`,
                  borderRadius:    theme.radiusLg,
                  padding:         '20px',
                  marginBottom:    '16px',
                  backgroundColor: 'white',
                  boxShadow:       theme.shadow,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{
                      backgroundColor: getSeverityBg(task.criticalScore),
                      color:           getSeverityColor(task.criticalScore),
                      padding:         '4px 12px',
                      borderRadius:    theme.radiusFull,
                      fontSize:        '12px',
                      fontWeight:      '700',
                    }}>
                      ⚡ Severity {task.criticalScore}/10
                    </span>
                    <span style={{
                      backgroundColor: theme.primaryBgCard,
                      color:           theme.primary,
                      padding:         '4px 12px',
                      borderRadius:    theme.radiusFull,
                      fontSize:        '12px',
                      fontWeight:      '700',
                      border:          `1px solid ${theme.primaryBorder}`,
                    }}>
                      ● Active
                    </span>
                  </div>
 
                  {task.createdAt && (
                    <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '10px' }}>
                      📅 {typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toLocaleString()}
                    </div>
                  )}
 
                  <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: theme.textPrimary, lineHeight: 1.55 }}>
                    {task.description}
                  </p>
 
                  {/* Meta grid */}
                  <div style={{
                    display:             'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap:                 '10px',
                    backgroundColor:     theme.primaryBg,
                    padding:             '12px',
                    borderRadius:        theme.radiusMd,
                    marginBottom:        '14px',
                    fontSize:            '13px',
                  }}>
                    {task.affectedCount && (
                      <div><span style={{ color: theme.textMuted }}>👥 Affected</span><br /><strong>{task.affectedCount}</strong></div>
                    )}
                    {distance !== null && (
                      <div><span style={{ color: theme.textMuted }}>📍 Distance</span><br /><strong>{distance.toFixed(1)} km</strong></div>
                    )}
                    {task.volunteerTeam && (
                      <div><span style={{ color: theme.textMuted }}>🤝 Team</span><br /><strong>{task.volunteerTeam.length} / {task.requiredVolunteers || '?'}</strong></div>
                    )}
                  </div>
 
                  {/* Skills */}
                  {task.needSkill?.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '6px' }}>
                        Skills Needed:
                      </span>
                      {task.needSkill.map((sk, i) => (
                        <span key={i} style={styles.skillBadge}>{sk}</span>
                      ))}
                    </div>
                  )}
 
                  {/* Volunteer team mini-profiles */}
                  {task.volunteerTeam?.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Team Members
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {task.volunteerTeam.map(uid => (
                          <VolunteerMiniProfile key={uid} uid={uid} />
                        ))}
                      </div>
                    </div>
                  )}
 
                  {resolvingTaskId === task.id ? (
                    <SubmitResolution
                      task={task}
                      onCancel={() => setResolvingTaskId(null)}
                      onSuccess={() => { setResolvingTaskId(null); fetchAssignedTasks(); }}
                    />
                  ) : (
                    <button
                      onClick={() => setResolvingTaskId(task.id)}
                      style={{ ...styles.btnSuccess, width: '100%', padding: '13px', fontSize: '15px' }}
                    >
                      📸 Mark as Resolved & Upload Proof
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
 
        {activeTab === 'nearby' && (
  <div style={{ display: 'flex', gap: '20px', height: '680px' }}>

    {/* List panel */}
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
        Nearby Issues
      </h3>

      {nearbyTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
          No active tasks nearby.
        </div>
      ) : nearbyTasks.map(req => {
        const teamSize = req.volunteerTeam?.length || 0;
        const isFull   = teamSize >= (req.requiredVolunteers || 1);
        const isMember = req.volunteerTeam?.includes(auth.currentUser?.uid);
        const dist     = workLocation
          ? calculateDistance(workLocation.lat, workLocation.lng, req.location.lat, req.location.lng)
          : 0;

        return (
          <div
            key={req.id}
            onClick={() => setMapCenter({ lat: req.location.lat, lng: req.location.lng })}
            style={{
              backgroundColor: 'white',
              padding:         '14px',
              marginBottom:    '12px',
              borderRadius:    theme.radiusMd,
              boxShadow:       theme.shadow,
              cursor:          'pointer',
              borderLeft:      `4px solid ${getSeverityColor(req.criticalScore)}`,
              border:          `1px solid ${theme.border}`,
              transition:      'box-shadow 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadowMd}
            onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadow}
          >
            {/* Top row: severity + clickable team badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                fontSize:        '12px',
                fontWeight:      '700',
                color:           getSeverityColor(req.criticalScore),
                backgroundColor: getSeverityBg(req.criticalScore),
                padding:         '3px 10px',
                borderRadius:    theme.radiusFull,
              }}>
                ⚡ {req.criticalScore}/10
              </span>

              {/* ── Clickable team badge ───────────────────────────── */}
              <span
                onClick={e => {
                  e.stopPropagation();
                  if (teamSize > 0) setSelectedTeamTask(req);
                }}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '4px',
                  fontSize:        '12px',
                  fontWeight:      '700',
                  color:           isFull ? theme.danger : theme.success,
                  backgroundColor: isFull ? theme.dangerLight : theme.successLight,
                  border:          `1px solid ${isFull ? theme.dangerBorder : theme.successBorder}`,
                  borderRadius:    theme.radiusFull,
                  padding:         '3px 10px',
                  cursor:          teamSize > 0 ? 'pointer' : 'default',
                  transition:      'opacity 0.15s',
                }}
                onMouseEnter={e => { if (teamSize > 0) e.currentTarget.style.opacity = '0.75'; }}
                onMouseLeave={e => { if (teamSize > 0) e.currentTarget.style.opacity = '1'; }}
              >
                🤝 Team: {teamSize}/{req.requiredVolunteers || '?'}
                {teamSize > 0 && <span style={{ opacity: 0.6, fontSize: '11px' }}>↗</span>}
              </span>
            </div>

            {req.createdAt && (
              <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '8px' }}>
                📅 {typeof req.createdAt === 'string' ? req.createdAt : new Date(req.createdAt).toLocaleString()}
              </div>
            )}

            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: theme.textPrimary, lineHeight: 1.45 }}>
              {req.description}
            </p>

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: theme.textSecondary, marginBottom: '10px' }}>
              {req.affectedCount && <span>👥 {req.affectedCount} affected</span>}
              <span>📍 {dist.toFixed(1)} km</span>
            </div>

            {req.needSkill?.length > 0 && (
              <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {req.needSkill.map((sk, i) => (
                  <span key={i} style={{ ...styles.skillBadge, fontSize: '11px' }}>{sk}</span>
                ))}
              </div>
            )}

            {isMember ? (
              <button disabled style={{
                width:           '100%',
                padding:         '9px',
                backgroundColor: theme.successLight,
                color:           theme.success,
                border:          `1px solid ${theme.successBorder}`,
                borderRadius:    theme.radiusSm,
                fontWeight:      '700',
                fontSize:        '13px',
              }}>
                ✓ You're on this team
              </button>
            ) : isFull ? (
              <button disabled style={{
                width:           '100%',
                padding:         '9px',
                backgroundColor: theme.dangerLight,
                color:           theme.danger,
                border:          `1px solid ${theme.dangerBorder}`,
                borderRadius:    theme.radiusSm,
                fontWeight:      '700',
                fontSize:        '13px',
              }}>
                Team Full
              </button>
            ) : (
              <button
                onClick={e => handleJoinTeam(req, e)}
                style={{ ...styles.btnPrimary, padding: '9px', fontSize: '13px' }}
              >
                Join Team
              </button>
            )}
          </div>
        );
      })}
    </div>

    {/* Map panel */}
    <div style={{ flex: 1, borderRadius: theme.radiusLg, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
      {workLocation ? (
        <NearbyTasksMap center={mapCenter} baseLocation={workLocation} tasks={nearbyTasks} />
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📍</div>
          <p style={{ color: theme.textSecondary, fontSize: '14px' }}>
            Set your base location to view the map.
          </p>
        </div>
      )}
    </div>
  </div>
)}


{/* ── Team Modal ─────────────────────────────────────────────────────────── */}
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
        maxWidth:        '560px',
        maxHeight:       '85vh',
        overflowY:       'auto',
        boxShadow:       '0 24px 64px rgba(0,0,0,0.28)',
        border:          `1px solid ${theme.border}`,
      }}
    >
      {/* Sticky header */}
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
              {selectedTeamTask.volunteerTeam.length} of {selectedTeamTask.requiredVolunteers || '?'} members assigned
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

      <div style={{ padding: '18px 20px 22px' }}>

        {/* Request context strip */}
        <div style={{
          padding:         '12px 14px',
          backgroundColor: theme.primaryBgCard,
          border:          `1px solid ${theme.primaryBorder}`,
          borderRadius:    theme.radiusMd,
          marginBottom:    '18px',
          display:         'flex',
          justifyContent:  'space-between',
          alignItems:      'flex-start',
          gap:             '12px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Task
            </div>
            <div style={{ fontSize: '14px', color: theme.textPrimary, lineHeight: 1.4 }}>
              {selectedTeamTask.description}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '12px', color: theme.textSecondary }}>
              {selectedTeamTask.affectedCount && <span>👥 {selectedTeamTask.affectedCount} affected</span>}
              {workLocation && selectedTeamTask.location && (
                <span>📍 {calculateDistance(workLocation.lat, workLocation.lng, selectedTeamTask.location.lat, selectedTeamTask.location.lng).toFixed(1)} km away</span>
              )}
            </div>
          </div>
          <span style={{
            fontSize:        '12px',
            fontWeight:      '700',
            color:           getSeverityColor(selectedTeamTask.criticalScore),
            backgroundColor: getSeverityBg(selectedTeamTask.criticalScore),
            padding:         '3px 10px',
            borderRadius:    theme.radiusFull,
            flexShrink:      0,
          }}>
            ⚡ {selectedTeamTask.criticalScore}/10
          </span>
        </div>

        {/* Capacity bar */}
        {selectedTeamTask.requiredVolunteers && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textSecondary }}>
                Team capacity
              </span>
              <span style={{
                fontSize:        '12px',
                fontWeight:      '700',
                color:           selectedTeamTask.volunteerTeam.length >= selectedTeamTask.requiredVolunteers
                  ? theme.success : theme.warning,
              }}>
                {selectedTeamTask.volunteerTeam.length} / {selectedTeamTask.requiredVolunteers}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: theme.borderLight, borderRadius: theme.radiusFull, overflow: 'hidden' }}>
              <div style={{
                height:          '100%',
                width:           `${Math.min(100, (selectedTeamTask.volunteerTeam.length / selectedTeamTask.requiredVolunteers) * 100)}%`,
                backgroundColor: selectedTeamTask.volunteerTeam.length >= selectedTeamTask.requiredVolunteers
                  ? theme.success : theme.warning,
                borderRadius:    theme.radiusFull,
                transition:      'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedTeamTask.volunteerTeam.map((uid, idx) => (
            <div
              key={uid}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '10px',
              }}
            >
              <span style={{
                width:           '22px',
                height:          '22px',
                borderRadius:    theme.radiusFull,
                backgroundColor: uid === auth.currentUser?.uid ? theme.primaryBgCard : theme.primaryBg,
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
              {uid === auth.currentUser?.uid && (
                <span style={{
                  fontSize:        '11px',
                  fontWeight:      '700',
                  color:           theme.primary,
                  backgroundColor: theme.primaryBg,
                  border:          `1px solid ${theme.primaryBorder}`,
                  borderRadius:    theme.radiusFull,
                  padding:         '2px 8px',
                  flexShrink:      0,
                }}>
                  You
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  </div>
)}
 
        {/* ── Tab: Create Request ──────────────────────────────────────────── */}
        {activeTab === 'create' && (
          <div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6 }}>
              Need additional resources? Submit a request to alert the full network.
            </p>
            <CreateRequest />
          </div>
        )}
 
        {/* ── Tab: History ─────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '17px', fontWeight: '700', color: theme.textPrimary }}>
              Completed & Pending Admin Approval
            </h3>
            {completedTasks.length === 0 ? (
              <div style={{
                textAlign:       'center',
                padding:         '60px 24px',
                backgroundColor: theme.primaryBg,
                borderRadius:    theme.radiusLg,
                border:          `1px solid ${theme.border}`,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <p style={{ margin: 0, color: theme.textSecondary, fontWeight: '500' }}>
                  No completed tasks yet.
                </p>
              </div>
            ) : completedTasks.map(task => (
              <div key={task.id} style={{
                border:          `1px solid ${theme.border}`,
                borderLeft:      `5px solid ${getStatusColor(task.status)}`,
                borderRadius:    theme.radiusLg,
                padding:         '20px',
                marginBottom:    '14px',
                backgroundColor: 'white',
                opacity:         0.85,
                boxShadow:       theme.shadow,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize:        '12px',
                    fontWeight:      '700',
                    color:           getStatusColor(task.status),
                    backgroundColor: task.status === 'resolved' ? '#F3F4F6' : '#FEF3C7',
                    padding:         '4px 12px',
                    borderRadius:    theme.radiusFull,
                    textTransform:   'capitalize',
                  }}>
                    {getStatusLabel(task.status)}
                  </span>
                  <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>
                    Severity: {task.criticalScore}/10
                  </span>
                </div>
 
                {task.createdAt && (
                  <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '8px' }}>
                    📅 {typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toLocaleString()}
                  </div>
                )}
 
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: theme.textPrimary, lineHeight: 1.5 }}>
                  {task.description}
                </p>
 
                {task.affectedCount && (
                  <div style={{ fontSize: '13px', color: theme.textMuted }}>👥 {task.affectedCount} people affected</div>
                )}
 
                {task.needSkill?.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {task.needSkill.map((sk, i) => (
                      <span key={i} style={{ ...styles.skillBadge, opacity: 0.7 }}>{sk}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* ── Base Location Modal ──────────────────────────────────────────────── */}
      {showLocationModal && (
        <div style={{
          position:        'fixed',
          top:             0,
          left:            0,
          width:           '100%',
          height:          '100%',
          backgroundColor: theme.bgOverlay,
          display:         'flex',
          justifyContent:  'center',
          alignItems:      'center',
          zIndex:          1000,
          padding:         '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius:    theme.radiusXl,
            width:           '100%',
            maxWidth:        '600px',
            boxShadow:       theme.shadowLg,
            overflow:        'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              background:  `linear-gradient(135deg, ${theme.primaryDark}, ${theme.primary})`,
              color:       'white',
              padding:     '24px 28px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌿</div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800' }}>
                Welcome to the Team!
              </h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                You've been promoted to Volunteer. Your assigned skills:{' '}
                <strong>{skills.length > 0 ? skills.join(', ') : 'General Help'}</strong>
              </p>
            </div>
 
            {/* Modal body */}
            <div style={{ padding: '24px 28px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: theme.textPrimary }}>
                Set Your Base Operating Area
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                We need your central location so the AI can assign you to nearby crises.{' '}
                <strong>This cannot be easily changed later.</strong>
              </p>
 
              <button
                onClick={handleAutoDetect}
                style={{
                  ...styles.btnPrimary,
                  padding:    '13px',
                  fontSize:   '15px',
                  marginBottom: '12px',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
                }}
              >
                📍 Auto-Detect My Location
              </button>
 
              {locationStatusMsg && (
                <p style={{ color: theme.danger, fontWeight: '600', fontSize: '13px', margin: '0 0 12px 0' }}>
                  {locationStatusMsg}
                </p>
              )}
 
              {tempLocation && (
                <div style={{ marginBottom: '16px' }}>
                  <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <LocationPickerMap location={tempLocation} setLocation={setTempLocation} />
                  </Wrapper>
                  <p style={{ fontSize: '12px', color: theme.textMuted, textAlign: 'center', marginTop: '6px' }}>
                    📌 {tempLocation.lat.toFixed(5)}, {tempLocation.lng.toFixed(5)}
                  </p>
                </div>
              )}
 
              <button
                onClick={handleSaveLocation}
                disabled={!tempLocation || isSavingLocation}
                style={{
                  ...styles.btnSuccess,
                  width:   '100%',
                  padding: '13px',
                  fontSize: '15px',
                  opacity: (!tempLocation || isSavingLocation) ? 0.5 : 1,
                  cursor:  (!tempLocation || isSavingLocation) ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingLocation ? 'Saving…' : '🔒 Confirm & Lock Base Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default VolunteerDashboard;