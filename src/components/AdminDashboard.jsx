import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Wrapper } from '@googlemaps/react-wrapper';
import CreateRequest from './CreateRequest';

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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('issues'); // Set 'issues' as default tab
  const [allIssues, setAllIssues] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [standardUsers, setStandardUsers] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
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
    if (!window.confirm("Approve this resolution?")) return;
    setActionLoading(taskId);
    try {
      await updateDoc(doc(db, 'requests', taskId), { status: 'resolved', resolvedAt: new Date().toISOString() });
      setPendingTasks(prev => prev.filter(task => task.id !== taskId));
      fetchAllIssues();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (taskId) => {
    const reason = window.prompt("Reason for rejection?");
    if (reason === null) return;
    setActionLoading(taskId);
    try {
      await updateDoc(doc(db, 'requests', taskId), { status: 'active', resolution: null, adminFeedback: reason });
      setPendingTasks(prev => prev.filter(task => task.id !== taskId));
      fetchAllIssues();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkillChange = (uid, value) => {
    setPromotionData(prev => ({ ...prev, [uid]: value }));
  };

  const handlePromoteToVolunteer = async (userObj) => {
    if (!userObj.phoneVerified) {
      alert("⚠️ Warning: This user has not verified their phone number. They must complete phone verification before they can be promoted to a volunteer.");
      return;
    }

    const uid = userObj.id;
    const skillsString = promotionData[uid];
    
    if (!skillsString) {
      alert("Please enter at least one skill before promoting.");
      return;
    }

    const skillsArray = skillsString.split(',').map(skill => skill.trim().toLowerCase());
    setActionLoading(uid);

    try {
      await updateDoc(doc(db, 'users', uid), {
        role: 'volunteer',
        skills: skillsArray
      });
      
      const updatedUser = { ...userObj, role: 'volunteer', skills: skillsArray };
      setStandardUsers(prev => prev.filter(u => u.id !== uid));
      setVolunteers(prev => [updatedUser, ...prev]);
      
      alert("User successfully promoted to Volunteer!");
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Failed to promote user.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#007bff'; 
      case 'pending_approval': return '#f0ad4e'; 
      case 'resolved': return '#28a745'; 
      default: return '#666';
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Admin Dashboard...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '20px' }}>
      <h2>Admin Dashboard</h2>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('issues')}
          style={{ fontWeight: activeTab === 'issues' ? 'bold' : 'normal', padding: '8px 16px', cursor: 'pointer', background: activeTab === 'issues' ? '#e2e3e5' : 'transparent', border: 'none', borderRadius: '4px' }}
        >
          All Issues & Tracking
        </button>
        <button 
          onClick={() => setActiveTab('approvals')}
          style={{ fontWeight: activeTab === 'approvals' ? 'bold' : 'normal', padding: '8px 16px', cursor: 'pointer', background: activeTab === 'approvals' ? '#e2e3e5' : 'transparent', border: 'none', borderRadius: '4px' }}
        >
          Resolution Approvals ({pendingTasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ fontWeight: activeTab === 'users' ? 'bold' : 'normal', padding: '8px 16px', cursor: 'pointer', background: activeTab === 'users' ? '#e2e3e5' : 'transparent', border: 'none', borderRadius: '4px' }}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ fontWeight: activeTab === 'create' ? 'bold' : 'normal', padding: '8px 16px', cursor: 'pointer', background: activeTab === 'create' ? '#e2e3e5' : 'transparent', border: 'none', borderRadius: '4px' }}
        >
          Create Request
        </button>
      </div>

      {activeTab === 'issues' && (
        <div style={{ display: 'flex', gap: '20px', height: '650px' }}>
          
          <div style={{ width: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa' }}>
            <h3 style={{ marginTop: 0 }}>All Recorded Requests</h3>
            {allIssues.length === 0 ? <p>No issues reported yet.</p> : (
              allIssues.map(issue => (
                <div 
                  key={issue.id} 
                  onClick={() => {
                    if (issue.location) {
                      setSelectedIssueLocation(issue.location);
                      setSelectedIssueId(issue.id);
                    }
                  }}
                  style={{ 
                    border: '1px solid #ccc', 
                    padding: '15px', 
                    marginBottom: '10px', 
                    borderRadius: '6px', 
                    backgroundColor: selectedIssueId === issue.id ? '#e9ecef' : '#fff',
                    cursor: issue.location ? 'pointer' : 'default',
                    borderLeft: `5px solid ${getStatusColor(issue.status)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'capitalize', color: getStatusColor(issue.status) }}>
                      {issue.status?.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '13px', color: '#c00', fontWeight: 'bold' }}>Severity: {issue.criticalScore}/10</span>
                  </div>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#333' }}>{issue.description}</p>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'No date'}</span>
                    <span>Team: {issue.volunteerTeam?.length || 0} Vols</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
            {selectedIssueLocation ? (
              <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <AdminLocationMap center={selectedIssueLocation} />
              </Wrapper>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', borderRadius: '8px', border: '1px solid #ddd' }}>
                <p style={{ color: '#666' }}>No location data available to display map.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'create' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>Submit a New Request (Admin Override)</h3>
          <p style={{ color: '#555', marginBottom: '20px' }}>create a new emergency request into the system.</p>
          <CreateRequest />
        </div>
      )}

      {activeTab === 'approvals' && (
        <div>
          {pendingTasks.length === 0 ? <p>No pending approvals at this time.</p> : (
             pendingTasks.map(task => (
                <div key={task.id} style={{ border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px', padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #f0ad4e' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#c00' }}>Severity: {task.criticalScore}/10</span>
                    <span style={{ fontWeight: 'bold', color: '#f0ad4e' }}>Status: Pending Approval</span>
                  </div>
                  
                  {task.createdAt && (
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                      Reported: {typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toLocaleString()}
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 5px 0' }}>Original Request:</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '15px' }}>{task.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                    {task.affectedCount && <div><strong>👥 Affected:</strong> {task.affectedCount}</div>}
                    {task.requiredVolunteers && <div><strong>🤝 Assigned Team:</strong> {task.volunteerTeam?.length}/{task.requiredVolunteers}</div>}
                    {task.needSkill && <div><strong>🛠️ Required Skills:</strong> {task.needSkill.join(', ')}</div>}
                  </div>

                  {/* Resolution Proof Details */}
                  <div style={{ padding: '15px', backgroundColor: '#eefbfa', border: '1px solid #bee5eb', borderRadius: '6px', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Resolution Details Submitted:</h4>
                    {task.resolution?.notes ? (
                      <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>{task.resolution.notes}</p>
                    ) : (
                      <p style={{ fontSize: '14px', margin: '0 0 10px 0', fontStyle: 'italic', color: '#666' }}>No text notes provided by volunteer.</p>
                    )}
                    
                    {task.resolution?.images && task.resolution.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                        {task.resolution.images.map((imgUrl, idx) => (
                          <a key={idx} href={imgUrl} target="_blank" rel="noreferrer">
                            <img src={imgUrl} alt="Resolution Proof" style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleApprove(task.id)} disabled={actionLoading === task.id} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {actionLoading === task.id ? 'Processing...' : 'Approve & Mark Resolved'}
                    </button>
                    <button onClick={() => handleReject(task.id)} disabled={actionLoading === task.id} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Reject & Re-open
                    </button>
                  </div>
                </div>
             ))
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ display: 'flex', gap: '20px' }}>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Standard Users</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>Assign skills to promote to Volunteer.</p>
            {standardUsers.length === 0 ? <p>No standard users found.</p> : (
              standardUsers.map(u => (
                <div key={u.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Name:</strong> {u.name || 'N/A'} <br/>
                    <strong>Phone:</strong> {u.phone || 'N/A'}
                    {u.phoneVerified ? (
                      <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '12px', fontWeight: 'bold' }}>✅ Verified</span>
                    ) : (
                      <span style={{ marginLeft: '10px', color: '#dc3545', fontSize: '12px', fontWeight: 'bold' }}>⚠️ Unverified</span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Skills (e.g. medical, heavy lifting)" 
                      value={promotionData[u.id] || ''}
                      onChange={(e) => handleSkillChange(u.id, e.target.value)}
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button 
                      onClick={() => handlePromoteToVolunteer(u)}
                      disabled={actionLoading === u.id}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: u.phoneVerified ? '#007bff' : '#6c757d', 
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                      }}
                    >
                      {actionLoading === u.id ? 'Promoting...' : 'Promote'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Active Volunteers</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>Currently enrolled volunteer team.</p>
            {volunteers.length === 0 ? <p>No volunteers currently active.</p> : (
              volunteers.map(v => (
                <div key={v.id} style={{ border: '1px solid #b8daff', padding: '15px', marginBottom: '10px', borderRadius: '8px', backgroundColor: '#e2e3e5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{v.name || 'Unnamed Volunteer'}</strong>
                    <span style={{ fontSize: '12px', color: '#0056b3', fontWeight: 'bold' }}>Volunteer</span>
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '5px' }}>
                    <strong>Phone:</strong> {v.phone} <span style={{ color: '#28a745' }}>✅</span><br/>
                    <strong>Skills:</strong> {v.skills?.join(', ') || 'General Help'}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;