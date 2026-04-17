import React, { useEffect, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const MapInner = ({ center, baseLocation, zoom, tasks }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);

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
    if (mapRef.current) {
      // Clear old markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      if (baseLocation) {
        const volunteerMarker = new window.google.maps.Marker({
          position: baseLocation,
          map: mapRef.current,
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', 
          title: 'Your Base Work Area',
        });
        markersRef.current.push(volunteerMarker);
      }

      tasks.forEach(task => {
        if (task.location && task.location.lat && task.location.lng) {
          const marker = new window.google.maps.Marker({
            position: { lat: task.location.lat, lng: task.location.lng },
            map: mapRef.current,
            title: task.description,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 5px; max-width: 200px;">
                <h4 style="margin: 0 0 5px 0; color: #d9534f;">Severity: ${task.criticalScore}/10</h4>
                <p style="margin: 0; font-size: 13px;">${task.description}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold;">Needed Skills: ${task.needSkill?.join(', ')}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapRef.current, marker);
          });

          markersRef.current.push(marker);
        }
      });
    }
  }, [tasks, baseLocation]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '8px', border: '1px solid #ccc' }} />;
};

const NearbyTasksMap = ({ center, baseLocation, tasks }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return <div style={{ padding: '20px', color: 'red' }}>Error: Google Maps API key is missing in .env</div>;
  if (!baseLocation) return <div>Please set your work location to view the map.</div>;

  return (
    <Wrapper apiKey={apiKey}>
      <MapInner center={center} baseLocation={baseLocation} zoom={12} tasks={tasks} />
    </Wrapper>
  );
};

export default NearbyTasksMap;