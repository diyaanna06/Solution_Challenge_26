import React, { useState, useRef, useEffect } from 'react';
import { auth, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { Wrapper } from '@googlemaps/react-wrapper';

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
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [location, setLocation] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please select it manually on the map.");
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
      alert("You must be logged in to make a request.");
      return;
    }

    if (!location) {
      alert("Please provide the location for this request.");
      return;
    }

    setLoading(true);
    setStatusMsg('Uploading images...');

    try {
      const imageUrls = await uploadImages();
      setStatusMsg('Analyzing data and finding volunteers...');

      const payload = {
        uid: user.uid,
        description,
        location,
        images: imageUrls
      };

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/requests/create`, payload);
      
      setStatusMsg('Request created successfully! Help is on the way.');
      
      setDescription('');
      setImages([]);
      setImagePreviews([]);
      setLocation(null);

    } catch (error) {
      console.error("Submission failed:", error);
      setStatusMsg('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>Create a Help Request</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>What is needed?</label>
          <textarea 
            rows="4" 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the situation, required help, blockages, etc..."
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Upload Images (Optional)</label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
            {imagePreviews.map((src, index) => (
              <img key={index} src={src} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>Exact Location</label>
          
          {!location ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={handleGetLocation} style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                📍 Auto-Detect
              </button>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#dc3545', fontWeight: 'bold' }}>
                Hold and drag the red pin to the exact location.
              </p>
              
              <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <LocationPickerMap location={location} setLocation={setLocation} />
              </Wrapper>
              
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                Saved Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !location}
          style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: (loading || !location) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
        >
          {loading ? 'Processing Request...' : 'Submit Request'}
        </button>

        {statusMsg && (
          <div style={{ marginTop: '15px', padding: '10px', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold', backgroundColor: statusMsg.includes('success') ? '#d4edda' : '#e2e3e5', color: statusMsg.includes('success') ? '#155724' : '#383d41' }}>
            {statusMsg}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateRequest;