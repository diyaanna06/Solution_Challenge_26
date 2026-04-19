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
 
const ProfileDropdown = ({ user, userData, onClose, onNameSaved }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameValue,   setNameValue]   = useState(userData?.name || '');
  const [saving,      setSaving]      = useState(false);

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      toast.warning('Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: nameValue.trim() });
      onNameSaved(nameValue.trim());
      setEditingName(false);
      toast.success('Name updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = {
    admin:     '🛡️ Admin',
    volunteer: '🤝 Volunteer',
    user:      '👤 User',
  }[userData?.role] || '👤 User';

  const roleColor = {
    admin:     { bg: '#FEF3C7', color: '#854F0B', border: '#FDE68A' },
    volunteer: { bg: theme.primaryBg, color: theme.primary, border: theme.primaryBorder },
    user:      { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
  }[userData?.role] || { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset:    0,
          zIndex:   199,
        }}
      />

      {/* Dropdown panel */}
      <div style={{
        position:        'absolute',
        top:             '68px',
        right:           '20px',
        width:           '300px',
        backgroundColor: 'white',
        borderRadius:    theme.radiusXl,
        boxShadow:       '0 8px 32px rgba(0,0,0,0.18)',
        border:          `1px solid ${theme.border}`,
        zIndex:          200,
        overflow:        'hidden',
        fontFamily:      theme.fontFamily,
      }}>
        {/* Header — avatar + role */}
        <div style={{
          background:   `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 100%)`,
          padding:      '20px 20px 16px',
          textAlign:    'center',
          position:     'relative',
        }}>
          {/* Avatar */}
          <div style={{
            width:           '64px',
            height:          '64px',
            borderRadius:    '50%',
            overflow:        'hidden',
            margin:          '0 auto 10px',
            border:          '3px solid rgba(255,255,255,0.4)',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
          }}>
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '26px', fontWeight: '700', color: 'white' }}>
                {(userData?.name || userData?.email || '?')[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* Role badge */}
          <span style={{
            fontSize:        '11px',
            fontWeight:      '700',
            color:           roleColor.color,
            backgroundColor: roleColor.bg,
            border:          `1px solid ${roleColor.border}`,
            borderRadius:    theme.radiusFull,
            padding:         '3px 12px',
          }}>
            {roleLabel}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>

          {/* Name field */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize:      '11px',
              fontWeight:    '700',
              color:         theme.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom:  '6px',
            }}>
              Display Name
            </div>

            {editingName ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  style={{
                    flex:         1,
                    padding:      '8px 12px',
                    border:       `1.5px solid ${theme.primary}`,
                    borderRadius: theme.radiusSm,
                    fontSize:     '14px',
                    color:        theme.textPrimary,
                    fontFamily:   theme.fontFamily,
                    outline:      'none',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  style={{
                    padding:         '8px 12px',
                    backgroundColor: theme.success,
                    color:           'white',
                    border:          'none',
                    borderRadius:    theme.radiusSm,
                    fontSize:        '13px',
                    fontWeight:      '700',
                    cursor:          saving ? 'not-allowed' : 'pointer',
                    opacity:         saving ? 0.7 : 1,
                    fontFamily:      theme.fontFamily,
                  }}
                >
                  {saving ? '…' : '✓'}
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(userData?.name || ''); }}
                  style={{
                    padding:         '8px 10px',
                    backgroundColor: theme.dangerLight,
                    color:           theme.danger,
                    border:          `1px solid ${theme.dangerBorder}`,
                    borderRadius:    theme.radiusSm,
                    fontSize:        '13px',
                    cursor:          'pointer',
                    fontFamily:      theme.fontFamily,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                padding:      '8px 12px',
                backgroundColor: theme.primaryBg,
                border:       `1px solid ${theme.border}`,
                borderRadius: theme.radiusSm,
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: theme.textPrimary }}>
                  {userData?.name || '—'}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  style={{
                    background:   'none',
                    border:       'none',
                    cursor:       'pointer',
                    fontSize:     '12px',
                    fontWeight:   '600',
                    color:        theme.primary,
                    padding:      '2px 6px',
                    borderRadius: theme.radiusSm,
                    fontFamily:   theme.fontFamily,
                  }}
                >
                  ✏️ Edit
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize:      '11px',
              fontWeight:    '700',
              color:         theme.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom:  '5px',
            }}>
              Email
            </div>
            <div style={{
              padding:         '8px 12px',
              backgroundColor: theme.primaryBg,
              border:          `1px solid ${theme.border}`,
              borderRadius:    theme.radiusSm,
              fontSize:        '13px',
              color:           theme.textSecondary,
              wordBreak:       'break-all',
            }}>
              {userData?.email || user?.email || '—'}
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize:      '11px',
              fontWeight:    '700',
              color:         theme.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom:  '5px',
            }}>
              Phone
            </div>
            <div style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '8px',
              padding:         '8px 12px',
              backgroundColor: theme.primaryBg,
              border:          `1px solid ${theme.border}`,
              borderRadius:    theme.radiusSm,
              fontSize:        '13px',
              color:           userData?.phone ? theme.textSecondary : theme.textMuted,
            }}>
              <span>{userData?.phone || 'Not verified yet'}</span>
              {userData?.phoneVerified && (
                <span style={{
                  marginLeft:      'auto',
                  fontSize:        '10px',
                  fontWeight:      '700',
                  color:           theme.success,
                  backgroundColor: theme.successLight,
                  border:          `1px solid ${theme.successBorder}`,
                  borderRadius:    theme.radiusFull,
                  padding:         '2px 7px',
                }}>
                  ✓ verified
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: theme.borderLight, marginBottom: '14px' }} />

          {/* Member since */}
          {userData?.createdAt && (
            <div style={{
              fontSize:  '12px',
              color:     theme.textMuted,
              textAlign: 'center',
            }}>
              Member since {new Date(userData.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};


// ── Updated Navbar ────────────────────────────────────────────────────────
const Navbar = ({ user, userData, onLogout, onNameSaved }) => {
  const navigate          = useNavigate();
  const location          = useLocation();
  const isHome            = location.pathname === '/home';
  const [showProfile, setShowProfile] = useState(false);

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
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', padding: 0 }}
      >
        <img src="main2.svg" alt="Disaster Relief Network" style={{ width: '200px' }} />
      </button>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
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

            {/* ── Avatar button — opens profile dropdown ── */}
            <button
              onClick={() => setShowProfile(p => !p)}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '8px',
                background:      'rgba(255,255,255,0.1)',
                border:          '1.5px solid rgba(255,255,255,0.25)',
                borderRadius:    theme.radiusFull,
                padding:         '4px 12px 4px 4px',
                cursor:          'pointer',
                transition:      'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              {/* Mini avatar */}
              <div style={{
                width:           '28px',
                height:          '28px',
                borderRadius:    '50%',
                overflow:        'hidden',
                backgroundColor: 'rgba(255,255,255,0.25)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                flexShrink:      0,
              }}>
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
                    {(userData?.name || userData?.email || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: '500', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userData?.name?.split(' ')[0] || 'Profile'}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginLeft: '2px' }}>
                {showProfile ? '▲' : '▼'}
              </span>
            </button>

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

            {/* Profile dropdown */}
            {showProfile && (
              <ProfileDropdown
                user={user}
                userData={userData}
                onClose={() => setShowProfile(false)}
                onNameSaved={(name) => { onNameSaved(name); setShowProfile(false); }}
              />
            )}
          </>
        ) : (
          <>
            {!isHome && (
              <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                About
              </button>
            )}
            <button onClick={() => navigate('/login')} style={{ padding: '7px 18px', backgroundColor: 'white', color: theme.primaryDark, border: 'none', borderRadius: theme.radiusSm, cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
              Sign In
            </button>
          </>
        )}
      </div>
    </header>
  );
};
 

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
 
 if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontFamily: theme.fontFamily,
        backgroundColor: theme.bg 
      }}>
        Loading...
      </div>
    );
  }
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
        <Navbar
  user={user}
  userData={userData}
  onLogout={handleLogout}
  onNameSaved={(name) => setUserData(prev => ({ ...prev, name }))}
/>
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