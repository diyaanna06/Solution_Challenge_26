import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const PhoneVerification = ({ userData, setUserData }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [status, setStatus] = useState('');
  const [otp, setOtp] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeRecaptcha = () => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setStatus('reCAPTCHA expired. Please refresh and try again.');
          }
        });
        window.recaptchaVerifier.render().catch(console.error);
      }
    };

    initializeRecaptcha();

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const formatPhoneStrict = (phone) => {
    return phone.replace(/[^0-9+]/g, ''); 
  };

  const sendOtp = async () => {
    if (!phoneNumber.startsWith('+')) {
      setStatus('Error: Please include your country code (e.g., +1 or +91).');
      return;
    }

    setIsChecking(true);
    setStatus('Checking phone number...');
    const strictPhone = formatPhoneStrict(phoneNumber);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', strictPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setStatus('Error: This phone number is already registered to another user.');
        setIsChecking(false);
        return; 
      }

      setStatus('Sending OTP...');
      const appVerifier = window.recaptchaVerifier;
      const provider = new PhoneAuthProvider(auth);
      
      const vId = await provider.verifyPhoneNumber(strictPhone, appVerifier);
      setVerificationId(vId);
      setStatus('OTP Sent! Check your messages.');

    } catch (error) {
      console.error("Error sending OTP:", error);
      setStatus('Failed to send OTP. Please refresh the page to try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const verifyOtpAndLink = async () => {
    setStatus('Verifying and Linking...');
    setIsChecking(true);
    const strictPhone = formatPhoneStrict(phoneNumber);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await linkWithCredential(auth.currentUser, credential);
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { 
        phone: strictPhone,
        phoneVerified: true 
      });
      
      setStatus('Phone verified successfully!');
      
      window.location.href = '/'; 
      
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setStatus('Verification failed. Please check the code and try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#333', marginTop: 0, textAlign: 'center' }}>Verify Your Phone</h2>
      <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '20px' }}>
        We require phone verification to secure your account and prevent spam.
      </p>

      <div id="recaptcha-container"></div>

      {!verificationId ? (
        <div>
          <input 
            type="tel" 
            placeholder="+1 234 567 8900" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          <button 
            onClick={sendOtp} 
            disabled={isChecking || !phoneNumber}
            style={{ width: '100%', padding: '12px', backgroundColor: isChecking ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isChecking ? 'not-allowed' : 'pointer' }}
          >
            {isChecking ? 'Processing...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div>
          <input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          <button 
            onClick={verifyOtpAndLink} 
            disabled={isChecking || !otp}
            style={{ width: '100%', padding: '12px', backgroundColor: isChecking ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: isChecking ? 'not-allowed' : 'pointer' }}
          >
            {isChecking ? 'Verifying...' : 'Verify & Link Phone'}
          </button>
        </div>
      )}
      
      <p style={{ textAlign: 'center', marginTop: '15px', color: status.includes('Error') || status.includes('Failed') ? '#d9534f' : '#28a745', minHeight: '20px' }}>
        {status}
      </p>
    </div>
  );
};

export default PhoneVerification;