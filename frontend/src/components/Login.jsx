import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { theme, styles } from '../theme';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider
} from 'firebase/auth';

const Login = () => {
  // ── keep your existing state & handlers ────────────────────────────────────
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
const handleAuth = async (e) => {
  e.preventDefault();
  try {
    if (isRegistering) {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created! Welcome aboard.');           
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');                    
    }
  } catch (err) {
    console.error(err);
    toast.error(err.message);                                       
  }
};

const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    toast.success('Signed in with Google!');                       
  } catch (err) {
    console.error(err);
    toast.error(err.message);                                       
  }
};


  return (
    <div style={{
      minHeight:       'calc(100vh - 60px)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: theme.primaryBg,
      padding:         '24px 16px',
      fontFamily:      theme.fontFamily,
    }}>
      <div style={{
        width:           '100%',
        maxWidth:        '420px',
        backgroundColor: 'white',
        borderRadius:    theme.radiusXl,
        padding:         '40px 36px',
        boxShadow:       theme.shadowMd,
        border:          `1px solid ${theme.border}`,
      }}>
        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌿</div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: theme.textPrimary }}>
            {isRegistering ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary }}>
            {isRegistering
              ? 'Join the Disaster Relief Network'
              : 'Sign in to your Relief Network account'}
          </p>
        </div>
 
        {/* Inline error (keep as fallback; prefer toast.error in handlers) */}
        {error && (
          <div style={{
            padding:         '10px 14px',
            backgroundColor: theme.dangerLight,
            color:           theme.danger,
            borderRadius:    theme.radiusMd,
            marginBottom:    '20px',
            fontSize:        '13px',
            fontWeight:      '500',
            border:          `1px solid ${theme.dangerBorder}`,
          }}>
            {error}
          </div>
        )}
 
        {/* Email / Password form */}
        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>
 
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={styles.input}
            />
          </div>
 
          <button
            type="submit"
            style={{
              ...styles.btnPrimary,
              padding:    '13px',
              fontSize:   '15px',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
            }}
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('rahulverma@gmail.com');
              setPassword('123456');
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '10px',
              borderRadius: theme.radiusMd,
              border: `1px dashed ${theme.border}`,
              background: theme.primaryBg,
              cursor: 'pointer',
              fontSize: '13px'
            }}
            >
            Use Admin Test Credentials
            </button>
             <button
            type="button"
            onClick={() => {
              setEmail('rahulverma@gmail.com');
              setPassword('123456');
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '10px',
              borderRadius: theme.radiusMd,
              border: `1px dashed ${theme.border}`,
              background: theme.primaryBg,
              cursor: 'pointer',
              fontSize: '13px'
            }}
            >
            Use Volunteer Test Credentials
            </button>
             <button
            type="button"
            onClick={() => {
              setEmail('rahulverma@gmail.com');
              setPassword('123456');
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '10px',
              borderRadius: theme.radiusMd,
              border: `1px dashed ${theme.border}`,
              background: theme.primaryBg,
              cursor: 'pointer',
              fontSize: '13px'
            }}
            >
            Use User Test Credentials
            </button>
        </form>
 
        {/* Forgot password */}
        {!isRegistering && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                background:     'none',
                border:         'none',
                color:          theme.textMuted,
                cursor:         'pointer',
                fontSize:       '13px',
                textDecoration: 'underline',
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}
 
        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${theme.border}` }} />
          <span style={{ padding: '0 14px', color: theme.textMuted, fontSize: '13px' }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${theme.border}` }} />
        </div>
 
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width:           '100%',
            padding:         '12px',
            backgroundColor: 'white',
            color:           theme.textPrimary,
            border:          `1.5px solid ${theme.border}`,
            borderRadius:    theme.radiusMd,
            cursor:          'pointer',
            fontWeight:      '600',
            fontSize:        '14px',
            display:         'flex',
            justifyContent:  'center',
            alignItems:      'center',
            gap:             '10px',
            boxShadow:       theme.shadow,
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: '18px' }}
          />
          Continue with Google
        </button>

        {/* Toggle register / login */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: theme.textSecondary }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{
              background:     'none',
              border:         'none',
              color:          theme.primary,
              cursor:         'pointer',
              fontWeight:     '700',
              fontSize:       '14px',
              textDecoration: 'underline',
            }}
          >
            {isRegistering ? 'Sign in here' : 'Sign up here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;