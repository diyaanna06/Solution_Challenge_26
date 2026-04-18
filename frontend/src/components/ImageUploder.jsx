import React, { useRef, useState, useCallback } from 'react';
import { theme } from '../theme';
 
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
 
const ImageUploader = ({
  images = [],
  setImages,
  maxImages = 8,
  required = false,
  label = 'Upload Images',
  hint = 'Drag & drop or click to browse',
}) => {
  const inputRef   = useRef(null);
  const [dragging, setDragging]   = useState(false);
  const [lightbox, setLightbox]   = useState(null); // index of previewed image
 
  // ── helpers ─────────────────────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const remaining = maxImages - images.length;
    const toAdd = valid.slice(0, remaining);
    if (toAdd.length === 0) return;
    setImages([...images, ...toAdd]);
  }, [images, maxImages, setImages]);
 
  const removeImage = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    if (lightbox === idx) setLightbox(null);
    else if (lightbox > idx) setLightbox(lightbox - 1);
  };
 
  // ── drag handlers ────────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };
 
  const isFull = images.length >= maxImages;
 
  // ── object URLs for preview (memo-free — small lists) ───────────────────────
  const urls = images.map(f => URL.createObjectURL(f));
 
  return (
    <div style={{ fontFamily: theme.fontFamily }}>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <label style={{
          fontSize:      '11px',
          fontWeight:    '700',
          color:         theme.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
        }}>
          {label}{required && <span style={{ color: theme.danger, marginLeft: 2 }}>*</span>}
        </label>
        <span style={{ fontSize: '12px', color: images.length >= maxImages ? theme.danger : theme.textMuted, fontWeight: '600' }}>
          {images.length} / {maxImages}
        </span>
      </div>
 
      {/* Drop zone — hidden when full */}
      {!isFull && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border:          `2px dashed ${dragging ? theme.primary : theme.border}`,
            borderRadius:    '12px',
            padding:         '32px 20px',
            textAlign:       'center',
            cursor:          'pointer',
            backgroundColor: dragging ? theme.primaryBg : '#FAFCFB',
            transition:      'all 0.2s ease',
            marginBottom:    images.length > 0 ? '16px' : 0,
          }}
        >
          {/* Upload icon */}
          <div style={{
            width:           '48px',
            height:          '48px',
            borderRadius:    '12px',
            backgroundColor: dragging ? theme.primaryBgCard : 'white',
            border:          `1px solid ${dragging ? theme.primaryBorder : theme.border}`,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            margin:          '0 auto 14px',
            fontSize:        '22px',
            transition:      'all 0.2s',
            boxShadow:       dragging ? `0 0 0 4px ${theme.primaryBg}` : 'none',
          }}>
            {dragging ? '📂' : '🖼️'}
          </div>
 
          <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: dragging ? theme.primary : theme.textPrimary }}>
            {dragging ? 'Drop images here' : hint}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>
            JPG, PNG, WEBP · Up to {maxImages} images · Each under 10 MB
          </p>
 
          <div style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '6px',
            marginTop:       '14px',
            padding:         '8px 18px',
            backgroundColor: theme.primary,
            color:           'white',
            borderRadius:    '8px',
            fontSize:        '13px',
            fontWeight:      '700',
            pointerEvents:   'none',
          }}>
            Browse Files
          </div>
        </div>
      )}
 
      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        required={required && images.length === 0}
        style={{ display: 'none' }}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />
 
      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap:                 '10px',
        }}>
          {images.map((file, idx) => (
            <div
              key={idx}
              style={{
                position:     'relative',
                borderRadius: '10px',
                overflow:     'hidden',
                aspectRatio:  '1',
                border:       `1px solid ${theme.border}`,
                cursor:       'pointer',
                boxShadow:    theme.shadow,
                backgroundColor: theme.borderLight,
              }}
            >
              {/* Thumbnail */}
              <img
                src={urls[idx]}
                alt={`Preview ${idx + 1}`}
                onClick={() => setLightbox(idx)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}
              />
 
              {/* Overlay on hover */}
              <div
                onClick={() => setLightbox(idx)}
                style={{
                  position:        'absolute',
                  inset:           0,
                  backgroundColor: 'rgba(0,0,0,0)',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  transition:      'background 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)'}
                onMouseOut={e  => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0)'}
              >
                <span style={{ color: 'white', fontSize: '18px', opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}>🔍</span>
              </div>
 
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                style={{
                  position:        'absolute',
                  top:             '5px',
                  right:           '5px',
                  width:           '22px',
                  height:          '22px',
                  borderRadius:    '50%',
                  backgroundColor: 'rgba(220,38,38,0.92)',
                  border:          '1.5px solid white',
                  color:           'white',
                  fontSize:        '12px',
                  fontWeight:      '800',
                  lineHeight:      '1',
                  cursor:          'pointer',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  boxShadow:       '0 1px 4px rgba(0,0,0,0.3)',
                  zIndex:          2,
                  padding:         0,
                }}
              >
                ×
              </button>
 
              {/* File size badge */}
              <div style={{
                position:        'absolute',
                bottom:          '5px',
                left:            '5px',
                backgroundColor: 'rgba(0,0,0,0.55)',
                color:           'white',
                fontSize:        '9px',
                fontWeight:      '600',
                padding:         '2px 5px',
                borderRadius:    '4px',
                backdropFilter:  'blur(2px)',
                letterSpacing:   '0.3px',
              }}>
                {formatBytes(file.size)}
              </div>
 
              {/* Index badge */}
              <div style={{
                position:        'absolute',
                bottom:          '5px',
                right:           '5px',
                backgroundColor: 'rgba(0,0,0,0.55)',
                color:           'white',
                fontSize:        '9px',
                fontWeight:      '700',
                padding:         '2px 5px',
                borderRadius:    '4px',
                backdropFilter:  'blur(2px)',
              }}>
                {idx + 1}
              </div>
            </div>
          ))}
 
          {/* Add-more tile (when not full) */}
          {!isFull && (
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                aspectRatio:     '1',
                borderRadius:    '10px',
                border:          `2px dashed ${theme.border}`,
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                cursor:          'pointer',
                color:           theme.textMuted,
                fontSize:        '13px',
                fontWeight:      '600',
                gap:             '6px',
                transition:      'border-color 0.2s, background 0.2s',
                backgroundColor: '#FAFCFB',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.backgroundColor = theme.primaryBg; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = theme.border;  e.currentTarget.style.backgroundColor = '#FAFCFB'; }}
            >
              <span style={{ fontSize: '22px' }}>＋</span>
              <span style={{ fontSize: '11px' }}>Add more</span>
            </div>
          )}
        </div>
      )}
 
      {/* Capacity bar */}
      {images.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '4px', backgroundColor: theme.borderLight, borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height:          '100%',
              width:           `${(images.length / maxImages) * 100}%`,
              backgroundColor: images.length >= maxImages ? theme.danger : theme.primary,
              borderRadius:    '999px',
              transition:      'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600', whiteSpace: 'nowrap' }}>
            {isFull ? '⚠️ Limit reached' : `${maxImages - images.length} slot${maxImages - images.length !== 1 ? 's' : ''} left`}
          </span>
        </div>
      )}
 
      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position:        'fixed',
            inset:           0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          9999,
            padding:         '20px',
            backdropFilter:  'blur(6px)',
          }}
        >
          {/* Image */}
          <img
            src={urls[lightbox]}
            alt="Full preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth:     '92vw',
              maxHeight:    '80vh',
              objectFit:    'contain',
              borderRadius: '12px',
              boxShadow:    '0 24px 80px rgba(0,0,0,0.6)',
              border:       '2px solid rgba(255,255,255,0.08)',
            }}
          />
 
          {/* Caption */}
          <div style={{
            marginTop:  '14px',
            display:    'flex',
            alignItems: 'center',
            gap:        '16px',
            color:      'rgba(255,255,255,0.7)',
            fontSize:   '13px',
            fontWeight: '500',
          }}>
            <span>{images[lightbox]?.name}</span>
            <span>·</span>
            <span>{formatBytes(images[lightbox]?.size)}</span>
            <span>·</span>
            <span>{lightbox + 1} of {images.length}</span>
          </div>
 
          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {lightbox > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
                style={{ padding: '8px 18px', backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                ← Prev
              </button>
            )}
            <button
              onClick={() => setLightbox(null)}
              style={{ padding: '8px 18px', backgroundColor: 'rgba(220,38,38,0.8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
            >
              ✕ Close
            </button>
            {lightbox < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
                style={{ padding: '8px 18px', backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Next →
              </button>
            )}
          </div>
 
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', padding: '4px', maxWidth: '80vw' }}>
              {urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`thumb ${i}`}
                  onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                  style={{
                    width:        '52px',
                    height:       '52px',
                    objectFit:    'cover',
                    borderRadius: '6px',
                    cursor:       'pointer',
                    border:       i === lightbox ? `2px solid ${theme.primaryLight}` : '2px solid transparent',
                    opacity:      i === lightbox ? 1 : 0.55,
                    flexShrink:   0,
                    transition:   'opacity 0.15s, border-color 0.15s',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
 
export default ImageUploader;