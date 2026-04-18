import React, { useState, useRef, useEffect } from 'react';
import { auth, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Wrapper } from '@googlemaps/react-wrapper';
import { theme, styles } from '../theme';
import ImageUploader from './ImageUploder.jsx';


 
const LocationPickerMap = ({ location, setLocation }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
      });

      markerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapInstance.current,
        draggable: true,
        title: "Drag to exact location",
        animation: window.google.maps.Animation.DROP,
      });

      markerRef.current.addListener('dragend', () => {
        const newPos = markerRef.current.getPosition();
        setLocation({ lat: newPos.lat(), lng: newPos.lng() });
      });
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && markerRef.current && location) {
      mapInstance.current.setCenter(location);
      markerRef.current.setPosition(location);
    }
  }, [location]);

  return <div ref={mapRef} style={{ width: '100%', height: '250px', borderRadius: '8px', marginTop: '10px', border: '1px solid #ccc' }} />;
};

 
const CreateRequest = () => {
  const [description, setDescription] = useState('');
  const [images,      setImages]      = useState([]);   
  const [location,    setLocation]    = useState(null);
  const [loading,     setLoading]     = useState(false);
 const handleGetLocation = () => {
  if (!navigator.geolocation) {
    toast.warning('Geolocation is not supported by your browser.'); // ⚠️ warning
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      toast.success('Location detected successfully!');              // ✅ success
    },
    (error) => {
      console.error(error);
      toast.error('Unable to retrieve location. Select it manually on the map.'); // ❌ error
    },
    { enableHighAccuracy: true }
  );
};

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const image of images) {
      const imageRef = ref(storage, `requests/${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(snapshot.ref);
      uploadedUrls.push(downloadURL);
    }
    return uploadedUrls;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const user = auth.currentUser;

  if (!user) {
    toast.warning('You must be logged in to submit a request.');   // ⚠️ warning
    return;
  }
  if (!location) {
    toast.warning('Please provide the location for this request.'); // ⚠️ warning
    return;
  }

  setLoading(true);
  const uploadingToast = toast.loading('Uploading images…');        // ⏳ loading

  try {
    const imageUrls = await uploadImages();
    toast.update(uploadingToast, {
      render: 'Analysing data and finding volunteers…',             // ⏳ update
      type:   'info',
      isLoading: true,
    });

    const payload = { uid: user.uid, description, location, images: imageUrls };
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/requests/create`, payload);

    toast.update(uploadingToast, {
      render:    'Request created! Help is on the way. 🚀',         // ✅ final update
      type:      'success',
      isLoading: false,
      autoClose: 5000,
    });

    setDescription('');
    setImages([]);
    setLocation(null);
  } catch (error) {
    console.error(error);
    toast.update(uploadingToast, {
      render:    'Failed to create request. Please try again.',     // ❌ final update
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
      maxWidth:        '600px',
      margin:          '0 auto',
      fontFamily:      theme.fontFamily,
    }}>
      {/* Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius:    '16px',
        border:          `1px solid ${theme.border}`,
        boxShadow:       theme.shadowMd,
        overflow:        'hidden',
      }}>
        {/* Header strip */}
        <div style={{
          background:  `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 100%)`,
          padding:     '22px 28px',
          display:     'flex',
          alignItems:  'center',
          gap:         '14px',
        }}>
          <div style={{
            width:           '42px',
            height:          '42px',
            borderRadius:    '10px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '20px',
            flexShrink:      0,
          }}>🚨</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>
              Create a Help Request
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>
              AI will analyse severity and alert nearby volunteers
            </p>
          </div>
        </div>
 
        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
 
          {/* ── Description ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>What is needed?</label>
            <textarea
              rows="4"
              style={{
                ...styles.input,
                resize:     'vertical',
                lineHeight: '1.6',
                minHeight:  '110px',
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the situation — who needs help, what resources are required, any access blockages…"
              required
            />
          </div>
 
          {/* ── Image Uploader ───────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <ImageUploader
              images={images}
              setImages={setImages}
              maxImages={8}
              label="Attach Images"
              hint="Drag & drop photos of the situation, or click to browse"
            />
          </div>
 
          {/* ── Location ─────────────────────────────────────────────────── */}
          <div style={{
            marginBottom:    '28px',
            padding:         '20px',
            backgroundColor: theme.primaryBg,
            borderRadius:    '12px',
            border:          `1px solid ${theme.primaryBorder}`,
          }}>
            <label style={{ ...styles.label, marginBottom: '14px' }}>📍 Exact Location</label>
 
            {!location ? (
              <div>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                  We need the precise GPS coordinates so volunteers can navigate directly to the site.
                </p>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  style={{
                    ...styles.btnPrimary,
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'center',
                    gap:           '8px',
                    padding:       '12px',
                    background:    `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
                    borderRadius:  '10px',
                    fontSize:      '14px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📍</span>
                  Auto-Detect My Location
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '8px',
                  marginBottom:    '10px',
                  padding:         '8px 12px',
                  backgroundColor: theme.successLight,
                  borderRadius:    '8px',
                  border:          `1px solid ${theme.successBorder}`,
                }}>
                  <span style={{ fontSize: '14px' }}>✅</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: theme.success }}>
                    Location detected — drag the pin to fine-tune
                  </span>
                </div>
 
                {/* Map renders here */}
                
                <div style={{
                  height:          '260px',
                  borderRadius:    '10px',
                  backgroundColor: theme.borderLight,
                  border:          `1px solid ${theme.border}`,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  color:           theme.textMuted,
                  fontSize:        '13px',
                  marginBottom:    '10px',
                }}>
                  <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                  <LocationPickerMap location={location} setLocation={setLocation} />
                </Wrapper>
                </div>
 
                <div style={{
                  display:    'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: theme.textMuted, fontFamily: 'monospace' }}>
                    📌 {location.lat?.toFixed(6)}, {location.lng?.toFixed(6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocation(null)}
                    style={{
                      background:     'none',
                      border:         'none',
                      color:          theme.danger,
                      fontSize:       '12px',
                      fontWeight:     '600',
                      cursor:         'pointer',
                      textDecoration: 'underline',
                      padding:        0,
                    }}
                  >
                    Re-detect
                  </button>
                </div>
              </div>
            )}
          </div>
 
          {/* ── Summary chip row ─────────────────────────────────────────── */}
          {(images.length > 0 || location) && (
            <div style={{
              display:         'flex',
              gap:             '8px',
              flexWrap:        'wrap',
              marginBottom:    '20px',
              padding:         '12px 14px',
              backgroundColor: theme.primaryBg,
              borderRadius:    '10px',
              border:          `1px solid ${theme.primaryBorder}`,
            }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'center', marginRight: '4px' }}>
                Ready:
              </span>
              {description && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: theme.primary, backgroundColor: 'white', border: `1px solid ${theme.primaryBorder}`, padding: '3px 10px', borderRadius: '999px' }}>
                  ✏️ Description
                </span>
              )}
              {images.length > 0 && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: theme.primary, backgroundColor: 'white', border: `1px solid ${theme.primaryBorder}`, padding: '3px 10px', borderRadius: '999px' }}>
                  🖼️ {images.length} photo{images.length !== 1 ? 's' : ''}
                </span>
              )}
              {location && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: theme.primary, backgroundColor: 'white', border: `1px solid ${theme.primaryBorder}`, padding: '3px 10px', borderRadius: '999px' }}>
                  📍 Location
                </span>
              )}
            </div>
          )}
 
          {/* ── Submit ───────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading || !location}
            style={{
              ...styles.btnPrimary,
              padding:       '14px',
              fontSize:      '15px',
              fontWeight:    '800',
              borderRadius:  '10px',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '8px',
              opacity:       (loading || !location) ? 0.5 : 1,
              cursor:        (loading || !location) ? 'not-allowed' : 'pointer',
              background:    (loading || !location)
                ? theme.textMuted
                : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
              boxShadow:     (loading || !location) ? 'none' : `0 4px 16px rgba(46,125,82,0.35)`,
              transition:    'opacity 0.2s, box-shadow 0.2s',
            }}
          >
            {loading ? (
              <>
                <span style={{ fontSize: '16px' }}>⏳</span>
                Processing Request…
              </>
            ) : (
              <>
                <span style={{ fontSize: '16px' }}>🚀</span>
                Submit Help Request
                {!location && <span style={{ fontSize: '12px', opacity: 0.8 }}>(location required)</span>}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
 
export default CreateRequest;