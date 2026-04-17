import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { messaging } from './config/firebase';

import PhoneVerification from './components/PhoneVerification';
import SetPassword from './components/SetPassword';
import CreateRequest from './components/CreateRequest';
import VolunteerDashboard from './components/VolunteerDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
const requestAndSaveFcmToken = async (uid) => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // 2. Generate the token
        const currentToken = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
        });

        if (currentToken) {
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, { fcmToken: currentToken });
          console.log("FCM Token saved successfully.");
        } else {
          console.log('No registration token available.');
        }
      } else {
        console.log('Notification permission denied by user.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token: ', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          // Request token for existing user
          requestAndSaveFcmToken(currentUser.uid); 
        } else {
          const newProfile = { 
            role: 'user', 
            email: currentUser.email || '',
            name: currentUser.displayName || '', 
            phone: currentUser.phoneNumber || '',
            phoneVerified: false, 
            photoURL: currentUser.photoURL || '',
            createdAt: new Date().toISOString(),
            skills: [],           
            workLocation: null,
            fcmToken: null
          };
          
          await setDoc(userRef, newProfile);
          setUserData(newProfile);
          // Request token for new user
          requestAndSaveFcmToken(currentUser.uid); 
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Application...</div>;
  }

  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '10px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#333', color: 'white', borderRadius: '4px', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Disaster Relief Network</h1>
          {user && (
            <div>
              <span style={{ marginRight: '15px' }}>Role: {userData?.role || 'user'}</span>
              <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
            </div>
          )}
        </header>

        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/verify-phone" element={!user ? <Login /> : <PhoneVerification/>} />

          <Route 
            path="/" 
            element={
              !user ? <Navigate to="/login" /> :
              userData?.role === 'admin' ? <AdminDashboard /> :
              userData?.role === 'volunteer' ? <VolunteerDashboard /> :
              <UserDashboard userData={userData} setUserData={setUserData} />
            } 
            />
          

        </Routes>
      </div>
    </Router>
  );
}

export default App;