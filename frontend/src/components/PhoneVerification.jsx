import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { theme, styles } from '../theme';
 
const PhoneVerification = () => {
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
  toast.warning('reCAPTCHA expired. Please refresh and try again.'); 
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
    toast.warning('Please include your country code (e.g. +91 or +1).'); 
    return;
  }
  setIsChecking(true);
  const loadingToast = toast.loading('Checking phone number…');           

  const strictPhone = formatPhoneStrict(phoneNumber);
  try {
    const q = query(collection(db, 'users'), where('phone', '==', strictPhone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      toast.update(loadingToast, {
        render:    'This phone number is already registered to another account.',
        type:      'error',                                              
        isLoading: false,
        autoClose: 4000,
      });
      setIsChecking(false);
      return;
    }

    toast.update(loadingToast, { render: 'Sending OTP…', isLoading: true });
    const vId = await new PhoneAuthProvider(auth).verifyPhoneNumber(strictPhone, window.recaptchaVerifier);
    setVerificationId(vId);
    toast.update(loadingToast, {
      render:    'OTP sent! Check your messages.',                        
      type:      'success',
      isLoading: false,
      autoClose: 4000,
    });
  } catch (error) {
    console.error(error);
    toast.update(loadingToast, {
      render:    'Failed to send OTP. Please refresh and try again.',    
      type:      'error',
      isLoading: false,
      autoClose: 4000,
    });
  } finally {
    setIsChecking(false);
  }
};

const verifyOtpAndLink = async () => {
  setIsChecking(true);
  const loadingToast = toast.loading('Verifying OTP…');                 
  const strictPhone = formatPhoneStrict(phoneNumber);
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    await linkWithCredential(auth.currentUser, credential);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      phone: strictPhone,
      phoneVerified: true,
    });
    toast.update(loadingToast, {
      render:    'Phone verified successfully! Redirecting…',             
      type:      'success',
      isLoading: false,
      autoClose: 3000,
    });
    setTimeout(() => { window.location.href = '/'; }, 3000);
  } catch (error) {
    console.error(error);
    toast.update(loadingToast, {
      render:    'Verification failed. Check the code and try again.',   
      type:      'error',
      isLoading: false,
      autoClose: 4000,
    });
  } finally {
    setIsChecking(false);
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
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📱</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '800', color: theme.textPrimary }}>
            Verify Your Phone
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6 }}>
            Phone verification keeps the network secure and helps us reach you in the field.
          </p>
        </div>
 
        {/* reCAPTCHA mount point */}
        <div id="recaptcha-container" />
 
        {!verificationId ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.input}
              />
            </div>
            <button
              onClick={sendOtp}
              disabled={isChecking || !phoneNumber}
              style={{
                ...styles.btnPrimary,
                padding:    '13px',
                opacity:    (isChecking || !phoneNumber) ? 0.6 : 1,
                cursor:     (isChecking || !phoneNumber) ? 'not-allowed' : 'pointer',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
              }}
            >
              {isChecking ? 'Processing…' : 'Send Verification Code'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>6-Digit OTP</label>
              <input
                type="text"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                style={{ ...styles.input, letterSpacing: '8px', fontSize: '18px', textAlign: 'center' }}
              />
            </div>
            <button
              onClick={verifyOtpAndLink}
              disabled={isChecking || !otp}
              style={{
                ...styles.btnSuccess,
                width:      '100%',
                padding:    '13px',
                opacity:    (isChecking || !otp) ? 0.6 : 1,
                cursor:     (isChecking || !otp) ? 'not-allowed' : 'pointer',
              }}
            >
              {isChecking ? 'Verifying…' : 'Verify & Link Phone'}
            </button>
          </div>
        )}
 
        {/* Inline status (shows OTP flow progress) */}
        {status && (
          <p style={{
            textAlign:  'center',
            marginTop:  '16px',
            fontSize:   '14px',
            fontWeight: '500',
            color:      status.includes('Error') || status.includes('Failed') ? theme.danger : theme.success,
          }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
};
 
export default PhoneVerification;