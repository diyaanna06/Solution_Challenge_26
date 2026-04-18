import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';

 
const SetPassword = () => {
const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  
 const handleSendResetLink = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await sendPasswordResetEmail(auth, email);
    toast.success('Setup link sent! Check your inbox.');              // ✅ success
    setEmail('');
  } catch (err) {
    console.error(err);
    if      (err.code === 'auth/user-not-found')  toast.error('No account found with this email address.'); // ❌
    else if (err.code === 'auth/invalid-email')   toast.error('Please enter a valid email address.');        // ❌
    else                                          toast.error('Failed to send setup link. Please try again.'); // ❌
  } finally {
    setLoading(false);
  }
};

 
  return (
    <div style={{
      minHeight:      'calc(100vh - 60px)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryBg,
      padding:        '24px 16px',
      fontFamily:     theme.fontFamily,
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '800', color: theme.textPrimary }}>
            Set Up Password
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6 }}>
            Enter your email to receive a secure link to set up or reset your password.
          </p>
        </div>
 
        <form onSubmit={handleSendResetLink}>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              padding:    '13px',
              opacity:    loading ? 0.6 : 1,
              cursor:     loading ? 'not-allowed' : 'pointer',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
            }}
          >
            {loading ? 'Sending Link…' : 'Send Setup Link'}
          </button>
        </form>
      </div>
    </div>
  );
};


export default SetPassword;