import React, { useState } from 'react';
import { auth, db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const SubmitResolution = ({ task, onCancel, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

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
      setError("Please upload at least one image as proof of resolution.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      
      const proofImageUrls = await uploadProofImages();

      const taskRef = doc(db, 'requests', task.id);
      await updateDoc(taskRef, {
        status: 'pending_approval',
        resolution: {
          submittedBy: user.uid,
          proofImages: proofImageUrls,
          notes: notes,
          confirmations: []
        }
      });

      onSuccess(); 
    } catch (err) {
      console.error("Failed to submit resolution:", err);
      setError("Failed to submit proof. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #28a745', borderRadius: '8px', backgroundColor: '#f9fff9', marginTop: '15px' }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#28a745' }}>Submit Proof of Resolution</h4>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Resolution Notes / Details</label>
          <textarea 
            rows="3" 
            style={{ width: '100%', padding: '8px' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what was done to resolve the issue..."
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Upload Proof Images (Required)</label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageChange} 
            required
          />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
            {imagePreviews.map((src, index) => (
              <img key={index} src={src} alt="Proof Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Uploading...' : 'Submit Resolution'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '10px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitResolution;