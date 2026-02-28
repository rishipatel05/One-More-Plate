import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '../types';

interface RouteMapProps {
  origin: LatLng;
  destination: LatLng;
  volunteerLocation: LatLng;
  originLabel: string;
  destinationLabel: string;
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export default function RouteMap({ origin, destination, volunteerLocation, originLabel, destinationLabel }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setError(true);
      return;
    }

    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: volunteerLocation,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#f0ebe0' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#3d3028' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e8e0d0' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ddd4c0' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8d8e8' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4e8d4' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    mapInstance.current = map;

    // Restaurant marker
    new google.maps.Marker({
      position: origin,
      map,
      title: originLabel,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#c4522a',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      label: { text: '🍽', fontSize: '14px' },
    });

    // Shelter marker
    new google.maps.Marker({
      position: destination,
      map,
      title: destinationLabel,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#5c7a5e',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      label: { text: '🏠', fontSize: '14px' },
    });

    // Volunteer marker (animated)
    new google.maps.Marker({
      position: volunteerLocation,
      map,
      title: 'Volunteer',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
      label: { text: '🚗', fontSize: '16px' },
      zIndex: 10,
    });

    // Draw route
    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#c4522a',
        strokeOpacity: 0.7,
        strokeWeight: 4,
      },
    });
    renderer.setMap(map);
    directionsRenderer.current = renderer;

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        waypoints: [{ location: volunteerLocation, stopover: false }],
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === 'OK' && result) renderer.setDirections(result);
      }
    );
  }, [loaded, origin, destination, volunteerLocation, originLabel, destinationLabel]);

  if (error) {
    return (
      <div className="map-fallback">
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <div style={{ fontSize: 12, color: 'var(--warm-grey)', textAlign: 'center', lineHeight: 1.5 }}>
          Add your Google Maps API key<br />in <code>.env</code> to see the live route
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, width: '100%', padding: '0 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🍽️</div>
            <div style={{ fontSize: 10, color: 'var(--warm-grey)' }}>{originLabel}</div>
          </div>
          <div style={{ fontSize: 20, alignSelf: 'center', color: 'var(--terracotta)' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🚗</div>
            <div style={{ fontSize: 10, color: 'var(--warm-grey)' }}>Volunteer</div>
          </div>
          <div style={{ fontSize: 20, alignSelf: 'center', color: 'var(--terracotta)' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🏠</div>
            <div style={{ fontSize: 10, color: 'var(--warm-grey)' }}>{destinationLabel}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="map-fallback">
        <div className="plate-spin" style={{ fontSize: 28 }}>🍽️</div>
        <div style={{ fontSize: 12, color: 'var(--warm-grey)' }}>Loading map…</div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
