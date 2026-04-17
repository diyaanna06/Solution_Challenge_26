import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const SetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      
      setMessage('A secure link to set your password has been sent to your email. Please check your inbox.');
      setEmail(''); 
    } catch (err) {
      console.error("Error sending email:", err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send the setup link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Set or Reset Password</h2>
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
        Enter your email address to receive a secure link to set up your password for the first time.
      </p>

      {message && <div style={{ color: 'green', marginBottom: '15px', fontWeight: 'bold' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}

      <form onSubmit={handleSendResetLink}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email Address:</label>
          <input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '95%', padding: '10px', marginBottom: '15px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: '10px 20px', width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Sending Link...' : 'Send Setup Link'}
        </button>
      </form>
    </div>
  );
};

export default SetPassword;