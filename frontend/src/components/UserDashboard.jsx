import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CreateRequest from './CreateRequest';

const UserDashboard = ({ userData, setUserData }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const navigate = useNavigate();

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'requests'),
        where('createdByUid', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMyRequests(requests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyRequests();
    }
  }, [activeTab]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#007bff'; 
      case 'pending_approval': return '#f0ad4e'; 
      case 'resolved': return '#28a745'; 
      default: return '#666';
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '10px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Welcome, {userData?.name || 'User'}</h2>
        <div>
          {userData?.phoneVerified ? (
            <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
              ✅ Verified
            </span>
          ) : (
            <button 
              onClick={() => navigate('/verify-phone')}
              style={{ backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', padding: '5px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ⚠️ Not Verified (Click to Verify)
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ 
            fontWeight: activeTab === 'create' ? 'bold' : 'normal',
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'create' ? '#e9ecef' : 'transparent',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Request Help
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'history' ? '#e9ecef' : 'transparent',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          My Requests
        </button>
      </div>

      {activeTab === 'create' && (
        <div>
          <p style={{ color: '#555', marginBottom: '20px' }}>Submit a new request for assistance. Our AI will analyze the severity and alert nearby volunteers.</p>
          
          {!userData?.phoneVerified ? (
            <div style={{ padding: '30px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0, color: '#856404' }}>Verification Required</h3>
              <p style={{ color: '#856404', marginBottom: '20px' }}>You must verify your phone number to ensure real requests before you can submit a help request.</p>
              <button
                onClick={() => navigate('/verify-phone')}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Verify Phone Now
              </button>
            </div>
          ) : (
            <CreateRequest />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2>My Request History</h2>
          
          {loadingRequests ? (
            <p>Loading your requests...</p>
          ) : myRequests.length === 0 ? (
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              You have not submitted any help requests yet.
            </div>
          ) : (
            myRequests.map(req => (
              <div key={req.id} style={{ border: '1px solid #ddd', padding: '15px', margin: '15px 0', borderRadius: '8px', backgroundColor: '#fff' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Status: 
                    <span style={{ color: getStatusColor(req.status), marginLeft: '5px', textTransform: 'capitalize' }}>
                      {req.status?.replace('_', ' ')}
                    </span>
                  </strong>
                  {req.criticalScore && (
                    <span style={{ fontSize: '12px', backgroundColor: '#fee', padding: '4px 8px', borderRadius: '12px', color: '#c00', fontWeight: 'bold' }}>
                      Severity: {req.criticalScore}/10
                    </span>
                  )}
                </div>
                
                {req.createdAt && (
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                    📅 {typeof req.createdAt === 'string' ? req.createdAt : new Date(req.createdAt).toLocaleString()}
                  </div>
                )}

                <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>{req.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                  {req.affectedCount && <div><strong>👥 Affected:</strong> {req.affectedCount} people</div>}
                  {req.requiredVolunteers && <div><strong>🤝 Vols Needed:</strong> {req.requiredVolunteers}</div>}
                  {req.location && <div><strong>📍 Location:</strong> {req.location.lat.toFixed(4)}, {req.location.lng.toFixed(4)}</div>}
                  
                  {req.volunteerTeam && (
                    <div style={{ color: req.volunteerTeam.length >= req.requiredVolunteers ? '#28a745' : '#e67e22', fontWeight: 'bold' }}>
                      🛡️ Assigned: {req.volunteerTeam.length}/{req.requiredVolunteers}
                    </div>
                  )}
                </div>

                {req.needSkill && req.needSkill.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', marginRight: '8px' }}>Tools/Skills Needed:</span>
                    {req.needSkill.map((skill, index) => (
                      <span key={index} style={{ display: 'inline-block', backgroundColor: '#e2e3e5', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '5px', marginBottom: '5px', color: '#383d41' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {req.adminFeedback && req.status === 'active' && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '13px', borderLeft: '4px solid #ffeeba' }}>
                    <strong>Admin Note:</strong> {req.adminFeedback}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default UserDashboard;