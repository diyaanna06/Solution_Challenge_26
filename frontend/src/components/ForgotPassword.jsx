import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>Reset Password</h2>
      <p style={{ textAlign: 'center', color: '#555', fontSize: '14px', marginBottom: '20px' }}>
        Enter the email address associated with your account and we'll send you a link to reset your password.
      </p>

      {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
      {message && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{message}</div>}

      <form onSubmit={handleResetPassword}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Send Reset Link
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => navigate('/login')} 
          style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
        >
          &larr; Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;