import React, { useEffect, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const ICON_DEFAULT  = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
const ICON_SELECTED = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
const ICON_BASE     = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

const MapInner = ({ center, baseLocation, zoom, tasks, selectedTaskId }) => {
  const mapRef       = useRef(null);
  const containerRef = useRef(null);
  const markersRef   = useRef([]); 
  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center,
        zoom,
        disableDefaultUI: false,
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.panTo(center);
    }
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];

    if (baseLocation) {
      const volunteerMarker = new window.google.maps.Marker({
        position: baseLocation,
        map:      mapRef.current,
        icon:     ICON_BASE,
        title:    'Your Base Work Area',
        zIndex:   10,
      });
      markersRef.current.push({ id: '__base__', marker: volunteerMarker });
    }

    tasks.forEach(task => {
      if (!task.location?.lat || !task.location?.lng) return;

      const isSelected = task.id === selectedTaskId;

      const marker = new window.google.maps.Marker({
        position: { lat: task.location.lat, lng: task.location.lng },
        map:      mapRef.current,
        title:    task.description,
        icon:     isSelected ? ICON_SELECTED : ICON_DEFAULT,
        zIndex:   isSelected ? 5 : 1,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding:6px; max-width:220px; font-family:sans-serif;">
            <div style="
              display:inline-block;
              background:#fff3cd;
              color:#856404;
              border:1px solid #ffc107;
              border-radius:20px;
              padding:2px 10px;
              font-size:12px;
              font-weight:700;
              margin-bottom:6px;
            ">⚡ Severity ${task.criticalScore}/10</div>
            <p style="margin:0 0 6px 0; font-size:13px; color:#111; line-height:1.4;">
              ${task.description}
            </p>
            ${task.needSkill?.length
              ? `<p style="margin:0; font-size:12px; color:#555;">
                   <strong>Skills:</strong> ${task.needSkill.join(', ')}
                 </p>`
              : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current, marker);
      });

      markersRef.current.push({ id: task.id, marker });
    });
  }, [tasks, baseLocation]);

  useEffect(() => {
    markersRef.current.forEach(({ id, marker }) => {
      if (id === '__base__') return;
      const isSelected = id === selectedTaskId;
      marker.setIcon(isSelected ? ICON_SELECTED : ICON_DEFAULT);
      marker.setZIndex(isSelected ? 5 : 1);
      marker.setAnimation(
        isSelected ? window.google.maps.Animation.BOUNCE : null
      );
    });
  }, [selectedTaskId]);

  return (
    <div
      ref={containerRef}
      style={{
        width:        '100%',
        height:       '100%',
        minHeight:    '500px',
        borderRadius: '8px',
      }}
    />
  );
};

const NearbyTasksMap = ({ center, baseLocation, tasks, selectedTaskId }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey)      return <div style={{ padding: '20px', color: 'red' }}>Error: Google Maps API key is missing in .env</div>;
  if (!baseLocation) return <div>Please set your work location to view the map.</div>;

  return (
    <Wrapper apiKey={apiKey}>
      <MapInner
        center={center}
        baseLocation={baseLocation}
        zoom={12}
        tasks={tasks}
        selectedTaskId={selectedTaskId}
      />
    </Wrapper>
  );
};

export default NearbyTasksMap;