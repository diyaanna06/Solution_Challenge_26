import React, { useState } from 'react';
import { auth, db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { theme, styles} from '../theme'; 
import ImageUploader from './ImageUploder.jsx';

const SubmitResolution = ({ task, onCancel, onSuccess }) => {
  const [notes,   setNotes]   = useState('');
  const [images,  setImages]  = useState([]);   // File[]
  const [loading, setLoading] = useState(false);
 
 
  const uploadProofImages = async () => {
    const uploadedUrls = [];
    for (const image of images) {
      const imageRef = ref(storage, `resolutions/${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(snapshot.ref);
      uploadedUrls.push(downloadURL);
    }
    return uploadedUrls;
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (images.length === 0) {
    toast.warning('Please upload at least one image as proof of resolution.'); // ⚠️ warning
    return;
  }

  setLoading(true);
  const loadingToast = toast.loading('Uploading proof images…');               // ⏳ loading

  try {
    const user = auth.currentUser;
    const proofImageUrls = await uploadProofImages();
    await updateDoc(doc(db, 'requests', task.id), {
      status: 'pending_approval',
      resolution: {
        submittedBy:  user.uid,
        proofImages:  proofImageUrls,
        notes,
        confirmations: [],
      },
    });
    toast.update(loadingToast, {
      render:    'Resolution submitted for admin review!',                      // ✅ success
      type:      'success',
      isLoading: false,
      autoClose: 4000,
    });
    onSuccess();
  } catch (err) {
    console.error(err);
    toast.update(loadingToast, {
      render:    'Failed to submit proof. Please try again.',                   // ❌ error
      type:      'error',
      isLoading: false,
      autoClose: 4000,
    });
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={{
      marginTop:  '20px',
      fontFamily: theme.fontFamily,
    }}>
      {/* Section header */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '12px',
        marginBottom:    '20px',
        padding:         '16px 20px',
        backgroundColor: theme.successLight,
        borderRadius:    '12px 12px 0 0',
        border:          `1.5px solid ${theme.successBorder}`,
        borderBottom:    'none',
      }}>
        <div style={{
          width:           '40px',
          height:          '40px',
          borderRadius:    '10px',
          backgroundColor: theme.success,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '20px',
          flexShrink:      0,
        }}>
          📸
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.success }}>
            Submit Proof of Resolution
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: theme.textSecondary }}>
            Upload evidence and notes — an admin will review and close this request
          </p>
        </div>
      </div>
 
      {/* Form card */}
      <div style={{
        backgroundColor: 'white',
        border:          `1.5px solid ${theme.successBorder}`,
        borderTop:       'none',
        borderRadius:    '0 0 12px 12px',
        padding:         '24px',
      }}>
        <form onSubmit={handleSubmit}>
 
          {/* ── Notes ───────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>Resolution Notes</label>
            <textarea
              rows="3"
              style={{
                ...styles.input,
                resize:     'vertical',
                lineHeight: '1.6',
                minHeight:  '90px',
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was done to resolve this? Any remaining follow-ups? Materials or resources used?"
              required
            />
          </div>
 
          {/* ── Proof Images ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            {/* Required callout */}
            <div style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '8px',
              marginBottom:    '12px',
              padding:         '9px 12px',
              backgroundColor: images.length === 0 ? '#FFF7ED' : theme.successLight,
              borderRadius:    '8px',
              border:          `1px solid ${images.length === 0 ? '#FED7AA' : theme.successBorder}`,
              transition:      'all 0.3s',
            }}>
              <span style={{ fontSize: '15px' }}>{images.length === 0 ? '⚠️' : '✅'}</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: images.length === 0 ? '#C2410C' : theme.success }}>
                {images.length === 0
                  ? 'At least 1 proof image is required to submit'
                  : `${images.length} proof image${images.length !== 1 ? 's' : ''} attached — good to go!`}
              </span>
            </div>
 
            <ImageUploader
              images={images}
              setImages={setImages}
              maxImages={6}
              required
              label="Proof Images"
              hint="Drag & drop before/after photos, or click to browse"
            />
          </div>
 
          {/* ── Task reference chip ──────────────────────────────────────── */}
          {task && (
            <div style={{
              marginBottom:    '24px',
              padding:         '12px 14px',
              backgroundColor: theme.primaryBg,
              borderRadius:    '8px',
              border:          `1px solid ${theme.primaryBorder}`,
              fontSize:        '12px',
              color:           theme.textSecondary,
            }}>
              <strong style={{ color: theme.textPrimary }}>Resolving:</strong>{' '}
              {task.description?.slice(0, 120)}{task.description?.length > 120 ? '…' : ''}
            </div>
          )}
 
          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading || images.length === 0}
              style={{
                ...styles.btnSuccess,
                flex:          1,
                padding:       '13px',
                fontSize:      '14px',
                fontWeight:    '800',
                borderRadius:  '10px',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                gap:           '8px',
                opacity:       (loading || images.length === 0) ? 0.5 : 1,
                cursor:        (loading || images.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow:     (loading || images.length === 0) ? 'none' : `0 4px 14px rgba(22,163,74,0.3)`,
              }}
            >
              {loading ? '⏳ Uploading…' : '✅ Submit Resolution'}
            </button>
 
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding:         '13px 20px',
                backgroundColor: 'white',
                color:           theme.textSecondary,
                border:          `1.5px solid ${theme.border}`,
                borderRadius:    '10px',
                cursor:          loading ? 'not-allowed' : 'pointer',
                fontWeight:      '700',
                fontSize:        '14px',
                flexShrink:      0,
                opacity:         loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
 
export default SubmitResolution;
