import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { theme, styles } from '../theme';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
const handleResetPassword = async (e) => {
  e.preventDefault();
  try {
    await sendPasswordResetEmail(auth, email);
    toast.success('Password reset email sent! Check your inbox.'); // ✅ success
    setEmail('');
  } catch (err) {
    console.error(err);
    toast.error(err.message);                                       // ❌ error
  }
};

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryBg,
      padding: '24px 16px',
      fontFamily: theme.fontFamily,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'white',
        borderRadius: theme.radiusXl,
        padding: '40px 36px',
        boxShadow: theme.shadowMd,
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔑</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '800', color: theme.textPrimary }}>
            Reset Password
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6 }}>
            Enter the email address linked to your account and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '20px' }}>
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
          <button
            type="submit"
            style={{
              ...styles.btnPrimary,
              padding: '13px',
              fontSize: '15px',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
            }}
          >
            Send Reset Link
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;