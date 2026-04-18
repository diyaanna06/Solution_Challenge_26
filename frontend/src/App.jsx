import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { messaging } from './config/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
 
import PhoneVerification  from './components/PhoneVerification';
import SetPassword        from './components/SetPassword';
import VolunteerDashboard from './components/VolunteerDashboard';
import AdminDashboard     from './components/AdminDashboard';
import UserDashboard      from './components/UserDashboard';
import Login              from './components/Login';
import ForgotPassword     from './components/ForgotPassword';
import HomePage           from './components/HomePage';
import VolunteerOnboarding from './components/VolunteerOnboarding';
 
import { theme } from './theme';
 
// ── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ user, userData, onLogout }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isHome    = location.pathname === '/home';
 
  const roleLabel = {
    admin:     '🛡️ Admin',
    volunteer: '🤝 Volunteer',
    user:      '👤 User',
  }[userData?.role] || '👤 User';
 
  return (
    <header style={{
      display:         'flex',
      justifyContent:  'space-between',
      alignItems:      'center',
      padding:         '0 24px',
      height:          '60px',
      backgroundColor: theme.primaryDark,
      color:           'white',
      boxShadow:       '0 2px 8px rgba(0,0,0,0.25)',
      position:        'sticky',
      top:             0,
      zIndex:          100,
    }}>
      {/* Brand */}
      <button
        onClick={() => navigate(user ? '/' : '/home')}
        style={{
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          display:     'flex',
          alignItems:  'center',
          gap:         '10px',
          color:       'white',
          padding:     0,
        }}
      >
        <img src="main2.svg" alt="..." style={{width:'200px'}}/>
      </button>
 
      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <>
            <span style={{
              fontSize:        '12px',
              fontWeight:      '600',
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding:         '4px 12px',
              borderRadius:    theme.radiusFull,
              letterSpacing:   '0.3px',
            }}>
              {roleLabel}
            </span>
            {userData?.name && (
              <span style={{ fontSize: '13px', opacity: 0.85 }}>
                {userData.name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={onLogout}
              style={{
                padding:         '6px 14px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color:           'white',
                border:          '1px solid rgba(255,255,255,0.3)',
                borderRadius:    theme.radiusSm,
                cursor:          'pointer',
                fontSize:        '13px',
                fontWeight:      '600',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {!isHome && (
              <button
                onClick={() => navigate('/home')}
                style={{
                  background:   'none',
                  border:       'none',
                  color:        'rgba(255,255,255,0.8)',
                  cursor:       'pointer',
                  fontSize:     '13px',
                  fontWeight:   '500',
                }}
              >
                About
              </button>
            )}
            <button
              onClick={() => navigate('/login')}
              style={{
                padding:         '7px 18px',
                backgroundColor: 'white',
                color:           theme.primaryDark,
                border:          'none',
                borderRadius:    theme.radiusSm,
                cursor:          'pointer',
                fontSize:        '13px',
                fontWeight:      '700',
              }}
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </header>
  );
};
 
// ── Loading Screen ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       '100vh',
    backgroundColor: theme.primaryBg,
    fontFamily:      theme.fontFamily,
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.primary }}>
      Loading Relief Network…
    </div>
    <div style={{
      marginTop:       '20px',
      width:           '180px',
      height:          '4px',
      backgroundColor: theme.border,
      borderRadius:    theme.radiusFull,
      overflow:        'hidden',
    }}>
      <div style={{
        width:           '60%',
        height:          '100%',
        backgroundColor: theme.primary,
        borderRadius:    theme.radiusFull,
        animation:       'slide 1.2s ease-in-out infinite',
      }} />
    </div>
    <style>{`
      @keyframes slide {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }
    `}</style>
  </div>
);
 
// ── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [user,     setUser]     = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading,  setLoading]  = useState(true);
 
  const requestAndSaveFcmToken = async (uid) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        if (currentToken) {
          await updateDoc(doc(db, 'users', uid), { fcmToken: currentToken });
        }
      }
    } catch (error) {
      console.error('FCM token error:', error);
    }
  };
 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef  = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          requestAndSaveFcmToken(currentUser.uid);
        } else {
          const newProfile = {
            role:          'user',
            email:         currentUser.email         || '',
            name:          currentUser.displayName   || '',
            phone:         currentUser.phoneNumber   || '',
            phoneVerified: false,
            photoURL:      currentUser.photoURL      || '',
            createdAt:     new Date().toISOString(),
            skills:        [],
            workLocation:  null,
            fcmToken:      null,
          };
          await setDoc(userRef, newProfile);
          setUserData(newProfile);
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
    toast.success('Logged out successfully.');
  };
 
  if (loading) return <LoadingScreen />;
 
  return (
    <Router>
      {/* Toast container — green themed */}
      <ToastContainer
  position="top-center"
  autoClose={4000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
  toastStyle={{
    fontFamily:   theme.fontFamily,
    borderRadius: theme.radiusMd,
    fontSize:     '14px',
  }}
  style={{ top: '70px' }} 
/>
 
      <div style={{ fontFamily: theme.fontFamily, minHeight: '100vh', backgroundColor: theme.bg }}>
        <Navbar user={user} userData={userData} onLogout={handleLogout} />
 
        <main>
          <Routes>
            {/* Public homepage */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/onboarding" element={<VolunteerOnboarding />} />
 
            {/* Auth routes */}
            <Route path="/login"          element={!user ? <Login />          : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
            <Route path="/set-password"   element={<SetPassword />} />
            <Route path="/verify-phone"   element={!user ? <Login />          : <PhoneVerification />} />
 
            {/* Role-based dashboard */}
            <Route
              path="/"
              element={
                !user ? <Navigate to="/home" /> :
                userData?.role === 'admin'     ? <AdminDashboard /> :
                userData?.role === 'volunteer' ? <VolunteerDashboard /> :
                <UserDashboard userData={userData} setUserData={setUserData} />
              }
            />
          </Routes>
        </main>
         <footer style={{
        backgroundColor: theme.primaryDark,
        color: 'rgba(255,255,255,0.65)',
        padding: '28px 20px',
        textAlign: 'center',
        fontSize: '13px',
      }}>
        <img src="main2.svg" alt="..." style={{width:'300px'}}/>
        <div style={{ marginBottom:'20px'}}>Connecting communities with compassion and technology · India</div>
         <div style={{ display:'flex', gap:'24px', justifyContent:'center', flexWrap:'wrap' }}>
          {['Powered by Gemini AI', 'Google Maps', 'Firebase'].map((t, i) => (
            <span key={i} style={{ fontSize:'11px', color:'rgba(255,255,255,0.22)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>{t}</span>
          ))}
        </div>
      </footer>
      </div>
    </Router>
  );
}
 
export default App;