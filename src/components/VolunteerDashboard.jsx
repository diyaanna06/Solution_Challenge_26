import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, getDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import SubmitResolution from './SubmitResolution';
import NearbyTasksMap from './NearbyTasksMap';
import { Wrapper } from '@googlemaps/react-wrapper';
import CreateRequest from './CreateRequest';

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
  const [selectedRequest, setSelectedRequest] = useState(null);

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
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, {
        invitedVolunteers: arrayRemove(user.uid), 
        volunteerTeam: arrayUnion(user.uid)       
      });
      alert("Successfully joined the team!");
      fetchPendingInvites(); 
      fetchAssignedTasks();  
      if (workLocation) fetchNearbyTasks(workLocation);
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleDeclineInvite = async (request) => {
    try {
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, {
        invitedVolunteers: arrayRemove(user.uid)
      });
      fetchPendingInvites();
    } catch (error) {
      console.error("Error declining invite:", error);
    }
  };


  const handleJoinTeam = async (request, e) => {
    e.stopPropagation(); 
    if (!user) return;

    try {
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, {
        volunteerTeam: arrayUnion(user.uid)
      });
      alert("Successfully joined the team!");
      fetchAssignedTasks(); 
      if (workLocation) fetchNearbyTasks(workLocation); 
    } catch (error) {
      console.error("Error joining team:", error);
      alert("Failed to join the team.");
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
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationStatusMsg("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTempLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatusMsg("Location captured! Drag the pin to refine it if needed.");
      },
      (error) => {
        console.error("Error updating location:", error);
        setLocationStatusMsg("Failed to auto-detect. Please manually drag the pin.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveLocation = async () => {
    if (!tempLocation) return;
    setIsSavingLocation(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { workLocation: tempLocation });
      setWorkLocation(tempLocation);
      setMapCenter(tempLocation);
      fetchNearbyTasks(tempLocation); 
      setShowLocationModal(false);
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Failed to save location. Try again.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Dashboard...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '20px' }}>
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {pendingInvites.map(invite => (
            <div key={invite.id} style={{ 
              backgroundColor: '#ffeeba', border: '1px solid #ffc107', 
              padding: '15px', borderRadius: '8px', marginBottom: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>🚨 Urgent Assignment Request!</h3>
              <p style={{ margin: '0 0 10px 0' }}>The AI has selected you for a priority task: <strong>{invite.description}</strong></p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleAcceptInvite(invite)}
                  style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Accept & Join Team
                </button>
                <button 
                  onClick={() => handleDeclineInvite(invite)}
                  style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <h2>Volunteer Dashboard</h2>

      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#555', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '6px', display: 'inline-block' }}>
        {workLocation ? (
          <>📍 <strong>Base Operating Area:</strong> {workLocation.lat.toFixed(4)}, {workLocation.lng.toFixed(4)}</>
        ) : (
          <>📍 Work Area: Not Set</>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('active')} style={{ fontWeight: activeTab === 'active' ? 'bold' : 'normal', padding: '8px 16px', border: 'none', background: activeTab === 'active' ? '#e2e3e5' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}>
          Active Tasks ({activeTasks.length})
        </button>
        <button onClick={() => setActiveTab('nearby')} style={{ fontWeight: activeTab === 'nearby' ? 'bold' : 'normal', padding: '8px 16px', border: 'none', background: activeTab === 'nearby' ? '#e2e3e5' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}>
          Map & Nearby Tasks
        </button>
        <button onClick={() => setActiveTab('create')} style={{ fontWeight: activeTab === 'create' ? 'bold' : 'normal', padding: '8px 16px', border: 'none', background: activeTab === 'create' ? '#e2e3e5' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}>
          Create Request
        </button>
        <button onClick={() => setActiveTab('history')} style={{ fontWeight: activeTab === 'history' ? 'bold' : 'normal', padding: '8px 16px', border: 'none', background: activeTab === 'history' ? '#e2e3e5' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}>
          History & Pending
        </button>
      </div>

      <div style={{ padding: '10px 0' }}>
        
        {activeTab === 'active' && (
          <div>
            <h3>Your Assigned Tasks</h3>
            {activeTasks.length === 0 ? <p>No active tasks right now.</p> : (
              activeTasks.map(task => {
                // Calculate distance if both locations are available
                const distance = workLocation && task.location 
                  ? calculateDistance(workLocation.lat, workLocation.lng, task.location.lat, task.location.lng) 
                  : null;

                return (
                  <div key={task.id} style={{ border: '1px solid #ddd', padding: '15px', margin: '15px 0', borderRadius: '8px', backgroundColor: '#fff', borderLeft: '4px solid #007bff' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '5px' }}>
                      <span style={{ color: '#c00' }}>Severity: {task.criticalScore}/10</span>
                      <span style={{ color: '#007bff' }}>Status: Active</span>
                    </div>
                    {task.createdAt && (
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                        📅 {typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toLocaleString()}
                      </div>
                    )}
                    <p style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>{task.description}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                      {task.affectedCount && <div><strong>👥 Affected:</strong> {task.affectedCount}</div>}
                      {distance !== null && <div><strong>📍 Distance:</strong> {distance.toFixed(1)} km</div>}
                      {task.volunteerTeam && <div><strong>🤝 Team Size:</strong> {task.volunteerTeam.length} / {task.requiredVolunteers || '?'}</div>}
                    </div>

                    {task.needSkill && task.needSkill.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', marginRight: '5px' }}>Skills Needed:</span>
                        {task.needSkill.map((skill, idx) => (
                          <span key={idx} style={{ display: 'inline-block', backgroundColor: '#e2e3e5', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '5px', marginBottom: '5px', color: '#383d41' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {resolvingTaskId === task.id ? (
                      <SubmitResolution 
                        task={task} 
                        onCancel={() => setResolvingTaskId(null)} 
                        onSuccess={() => {
                          setResolvingTaskId(null);
                          fetchAssignedTasks();
                        }} 
                      />
                    ) : (
                      <button 
                        onClick={() => setResolvingTaskId(task.id)}
                        style={{ width: '100%', backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Mark as Resolved & Upload Proof
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div>
            <h3>Submit a New Request</h3>
            <p style={{ color: '#555', marginBottom: '20px' }}>Need assistance? Submit a request to alert the network.</p>
            <CreateRequest />
          </div>
        )}

        {activeTab === 'nearby' && (
          <div style={{ display: 'flex', gap: '20px', height: '650px', marginTop: '10px' }}>
            
            <div style={{ width: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa' }}>
              <h3 style={{ marginTop: 0 }}>Nearby Issues</h3>
              
              {nearbyTasks.length === 0 ? <p>No nearby tasks currently active.</p> : null}

              {nearbyTasks.map((req) => {
                const teamSize = req.volunteerTeam?.length || 0;
                const isFull = teamSize >= (req.requiredVolunteers || 1);
                const isMember = req.volunteerTeam?.includes(auth.currentUser?.uid);
                const distance = calculateDistance(workLocation.lat, workLocation.lng, req.location.lat, req.location.lng);

                return (
                  <div 
                    key={req.id} 
                    onClick={() => {
                      setMapCenter({ lat: req.location.lat, lng: req.location.lng });
                      setSelectedRequest(req);
                    }}
                    style={{ backgroundColor: '#fff', padding: '15px', marginBottom: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', borderLeft: `4px solid ${req.criticalScore >= 7 ? '#dc3545' : '#ffc107'}`}}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '5px' }}>
                      <span style={{ color: '#c00' }}>Severity: {req.criticalScore}/10</span>
                      <span style={{ color: isFull ? '#dc3545' : '#28a745' }}>Team: {teamSize}/{req.requiredVolunteers || '?'}</span>
                    </div>

                    {req.createdAt && (
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                        📅 {typeof req.createdAt === 'string' ? req.createdAt : new Date(req.createdAt).toLocaleString()}
                      </div>
                    )}
                    
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{req.description}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                      {req.affectedCount && <div><strong>👥 Affected:</strong> {req.affectedCount}</div>}
                      <div><strong>📍 Distance:</strong> {distance.toFixed(1)} km</div>
                    </div>

                    {req.needSkill && req.needSkill.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Skills Needed:</span>
                        {req.needSkill.map((skill, idx) => (
                          <span key={idx} style={{ display: 'inline-block', backgroundColor: '#e2e3e5', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', marginRight: '5px', marginBottom: '5px', color: '#383d41' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {isMember ? (
                      <button disabled style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>✓ You are on this team</button>
                    ) : isFull ? (
                      <button disabled style={{ width: '100%', padding: '10px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Team Full</button>
                    ) : (
                      <button onClick={(e) => handleJoinTeam(req, e)} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Join Team</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
              {workLocation ? (
                <NearbyTasksMap center={mapCenter} baseLocation={workLocation} tasks={nearbyTasks} />
              ) : (
                <p style={{ padding: '20px' }}>Please set your work location to view the map.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3>Completed & Pending Admin Approval</h3>
            {completedTasks.length === 0 ? <p>No history yet.</p> : (
              completedTasks.map(task => {
                const distance = workLocation && task.location 
                  ? calculateDistance(workLocation.lat, workLocation.lng, task.location.lat, task.location.lng) 
                  : null;

                return (
                  <div key={task.id} style={{ border: '1px solid #ddd', padding: '15px', margin: '15px 0', borderRadius: '8px', opacity: 0.8, backgroundColor: '#f8f9fa' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '5px' }}>
                      <span style={{ color: '#555' }}>Severity: {task.criticalScore}/10</span>
                      <span style={{ color: task.status === 'resolved' ? '#28a745' : '#f0ad4e', textTransform: 'capitalize' }}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    {task.createdAt && (
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                        📅 {typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toLocaleString()}
                      </div>
                    )}
                    
                    <p style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#444' }}>{task.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      {task.affectedCount && <div><strong>👥 Affected:</strong> {task.affectedCount}</div>}
                    </div>
                    {task.needSkill && task.needSkill.length > 0 && (
                      <div style={{ marginBottom: '5px' }}>
                        {task.needSkill.map((skill, idx) => (
                          <span key={idx} style={{ display: 'inline-block', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', marginRight: '5px', marginBottom: '5px', color: '#666' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {showLocationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', position: 'relative' }}>
            
            <div style={{ marginBottom: '15px' }}>
              <h2 style={{ color: '#007bff', marginTop: 0 }}>Welcome to the Team!</h2>
              <p style={{ fontSize: '15px', color: '#333' }}>
                An Admin has promoted you. Your assigned skills are: <strong>{skills.length > 0 ? skills.join(', ') : 'General Help'}</strong>.
              </p>
            </div>

            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Set Your Base Operating Area</h3>
            <p style={{ fontSize: '14px', color: '#555' }}>We need to know your central location so the AI can assign you to nearby crises. <strong>This cannot be easily changed later.</strong></p>
            
            <button 
              onClick={handleAutoDetect} 
              style={{ width: '100%', padding: '12px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}
            >
              📍 Auto-Detect My Location
            </button>

            {locationStatusMsg && <p style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '14px', margin: '5px 0' }}>{locationStatusMsg}</p>}

            {tempLocation && (
              <div style={{ marginBottom: '15px' }}>
                <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                  <LocationPickerMap location={tempLocation} setLocation={setTempLocation} />
                </Wrapper>
                <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '5px' }}>
                  Coordinates: {tempLocation.lat.toFixed(5)}, {tempLocation.lng.toFixed(5)}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={handleSaveLocation} 
                disabled={!tempLocation || isSavingLocation}
                style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: (!tempLocation || isSavingLocation) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isSavingLocation ? 'Saving...' : 'Confirm & Lock Base Location'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VolunteerDashboard;