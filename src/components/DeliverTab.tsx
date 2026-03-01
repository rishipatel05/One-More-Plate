import { useState } from 'react';
import { useApp } from '../lib/store';
import { Eyebrow, Divider } from './UI';
import RouteMap from './RouteMap';

const PAST_DELIVERIES = [
  { emoji: '🍕', restaurant: 'Iron Hill Brewery', detail: 'Feb 24 · 18 portions · Food Bank of DE' },
  { emoji: '🥗', restaurant: 'Caffe Gelato', detail: 'Feb 21 · 12 portions · Senior Center' },
  { emoji: '🍜', restaurant: 'Grain on the Main', detail: 'Feb 19 · 22 portions · UD Pantry' },
];

type RunPhase = 'to_restaurant' | 'to_shelter' | 'complete';
type StepStatus = 'done' | 'current' | 'pending';

interface RunStep {
  icon: string;
  title: string;
  sub: string;
  status: StepStatus;
}

export default function DeliverTab() {
  const { activeRun, showToast, setActiveTab } = useApp();
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [runComplete, setRunComplete] = useState(false);
  const [phase, setPhase] = useState<RunPhase>('to_restaurant');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) { setLocationError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
      { enableHighAccuracy: true }
    );
  };

  const openMapsDirections = (dest: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, '_blank');
  };

  const handlePhotoUpload = () => {
    setPhotoUploaded(true);
    showToast('📸 Photo confirmed!');
  };

  const handlePickupConfirmed = () => {
    setPhase('to_shelter');
    setPhotoUploaded(false);
    showToast('✅ Pickup confirmed — head to the shelter!');
    if (activeRun) openMapsDirections(activeRun.shelter.location);
  };

  const handleCompleteRun = () => {
    setRunComplete(true);
    setPhase('complete');
    showToast('🎉 Run complete! Amazing work Dakshi.');
    setTimeout(() => setActiveTab('account'), 1500);
  };

  if (!activeRun) {
    return (
      <div className="body">
        <Eyebrow>No active run</Eyebrow>
        <div className="empty">Claim a pickup from the Available tab<br />to start a delivery run.</div>
      </div>
    );
  }

  const steps: RunStep[] = phase === 'to_restaurant' ? [
    { icon: '✅', title: 'Run accepted', sub: 'SMS sent to your phone', status: 'done' },
    { icon: '🚗', title: 'Head to restaurant', sub: `${activeRun.post.restaurantName} · tap GPS below`, status: 'current' },
    { icon: '📦', title: 'Collect food & take photo', sub: 'Confirms pickup', status: 'pending' },
    { icon: '🏠', title: 'Drop off at shelter', sub: activeRun.shelter.name, status: 'pending' },
    { icon: '✔️', title: 'Mark run complete', sub: 'You are done!', status: 'pending' },
  ] : phase === 'to_shelter' ? [
    { icon: '✅', title: 'Run accepted', sub: 'SMS sent to your phone', status: 'done' },
    { icon: '✅', title: 'Food collected', sub: activeRun.post.restaurantName, status: 'done' },
    { icon: '🚗', title: 'Head to shelter', sub: `${activeRun.shelter.name} · tap GPS below`, status: 'current' },
    { icon: '📸', title: 'Drop off & take photo', sub: 'Confirms delivery', status: 'pending' },
    { icon: '✔️', title: 'Mark run complete', sub: 'You are done!', status: 'pending' },
  ] : [
    { icon: '✅', title: 'Run accepted', sub: 'SMS sent', status: 'done' },
    { icon: '✅', title: 'Food collected', sub: activeRun.post.restaurantName, status: 'done' },
    { icon: '✅', title: 'Delivered to shelter', sub: activeRun.shelter.name, status: 'done' },
    { icon: '✅', title: 'Photo confirmed', sub: 'Delivery verified', status: 'done' },
    { icon: '🎉', title: 'Run complete!', sub: 'Thank you Dakshi!', status: 'done' },
  ];

  const dest = phase === 'to_restaurant'
    ? activeRun.post.restaurantLocation
    : activeRun.shelter.location;

  const destLabel = phase === 'to_restaurant'
    ? activeRun.post.restaurantName
    : activeRun.shelter.name;

  return (
    <>
      <div className="run-hero" style={{
        background: phase === 'to_shelter' ? 'var(--sage)' :
                    phase === 'complete' ? 'var(--ink)' : 'var(--terracotta)'
      }}>
        <div className="run-status-label">
          {phase === 'to_restaurant' ? 'Active Run · En Route to Pickup' :
           phase === 'to_shelter' ? 'Active Run · En Route to Shelter' : 'Run Complete!'}
        </div>
        <div className="run-status-main">
          {phase === 'to_restaurant' ? `Go to ${activeRun.post.restaurantName}` :
           phase === 'to_shelter' ? `Go to ${activeRun.shelter.name}` : 'Amazing work 🎉'}
        </div>
        <div className="run-status-sub">
          {phase === 'to_restaurant' ? `${activeRun.post.portions} portions · by ${activeRun.post.pickupBy}` :
           phase === 'to_shelter' ? `Drop off ${activeRun.post.portions} portions` : 'Delivery confirmed'}
        </div>
      </div>

      <div className="body" style={{ paddingTop: 18 }}>

        <div className="route-card">
          <div className="route-map">
            <RouteMap
              origin={userLocation ?? activeRun.volunteer.location}
              destination={dest}
              volunteerLocation={userLocation ?? activeRun.volunteer.location}
              originLabel="You"
              destinationLabel={destLabel}
            />
          </div>
          <div className="route-details">
            <div className="route-stat">
              <div className="route-stat-n">
                {phase === 'to_restaurant' ? activeRun.distanceToRestaurant : activeRun.distanceToShelter}
              </div>
              <div className="route-stat-l">Miles</div>
            </div>
            <div className="route-stat">
              <div className="route-stat-n">
                {phase === 'to_restaurant'
                  ? Math.round(activeRun.distanceToRestaurant * 4)
                  : Math.round(activeRun.distanceToShelter * 4)}
              </div>
              <div className="route-stat-l">Min est.</div>
            </div>
            <div className="route-stat">
              <div className="route-stat-n">{activeRun.post.portions}</div>
              <div className="route-stat-l">Portions</div>
            </div>
          </div>
        </div>

        {phase !== 'complete' && (
          <button
            className={`btn ${phase === 'to_shelter' ? 'btn-sage' : ''}`}
            onClick={() => openMapsDirections(dest)}
            style={{ marginBottom: 12 }}
          >
            🗺️ Open GPS → {destLabel}
          </button>
        )}

        {!userLocation && phase !== 'complete' && (
          <button className="btn btn-outline" onClick={getLocation} style={{ marginBottom: 14 }}>
            📍 Use my live location
          </button>
        )}

        {userLocation && (
          <div style={{ fontSize: 12, color: 'var(--sage)', marginBottom: 14, textAlign: 'center', fontWeight: 600 }}>
            📍 Live location active
          </div>
        )}

        {locationError && (
          <div style={{ fontSize: 12, color: 'var(--terracotta)', marginBottom: 14, textAlign: 'center' }}>
            Enable location in browser settings
          </div>
        )}

        <Eyebrow>Run progress</Eyebrow>
        <div className="steps-list">
          {steps.map((step, i) => (
            <div key={i} className="step-row">
              <div className={`step-icon ${step.status}`}>{step.icon}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-sub">{step.sub}</div>
              </div>
              <div className={`step-badge ${step.status}`}>
                {step.status === 'done' ? 'Done' : step.status === 'current' ? 'Now' : 'Next'}
              </div>
            </div>
          ))}
        </div>

        {phase === 'to_restaurant' && (
          <>
            <Eyebrow>Confirm food collected</Eyebrow>
            <div
              className={`photo-upload ${photoUploaded ? 'uploaded' : ''}`}
              onClick={!photoUploaded ? handlePhotoUpload : undefined}
            >
              <div className="photo-icon">{photoUploaded ? '✅' : '📸'}</div>
              <div className="photo-label">{photoUploaded ? 'Photo confirmed' : 'Take a photo of the food'}</div>
              <div className="photo-sub">{photoUploaded ? 'Ready — get shelter directions below' : 'Tap to confirm you collected the food'}</div>
            </div>
            <button
              className="btn btn-sage"
              onClick={handlePickupConfirmed}
              disabled={!photoUploaded}
              style={{ opacity: photoUploaded ? 1 : 0.4 }}
            >
              ✅ Food collected — get directions to shelter →
            </button>
          </>
        )}

        {phase === 'to_shelter' && (
          <>
            <Eyebrow>Confirm delivery</Eyebrow>
            <div
              className={`photo-upload ${photoUploaded ? 'uploaded' : ''}`}
              onClick={!photoUploaded ? handlePhotoUpload : undefined}
            >
              <div className="photo-icon">{photoUploaded ? '✅' : '📸'}</div>
              <div className="photo-label">{photoUploaded ? 'Delivery photo confirmed' : 'Take a photo at the shelter'}</div>
              <div className="photo-sub">{photoUploaded ? 'Tap below to complete the run' : 'Confirms food was delivered'}</div>
            </div>
            <button
              className="btn"
              onClick={handleCompleteRun}
              disabled={!photoUploaded || runComplete}
              style={{ opacity: photoUploaded ? 1 : 0.4 }}
            >
              🎉 Mark run as complete
            </button>
          </>
        )}

        <Divider />

        <Eyebrow>Your past deliveries</Eyebrow>
        {PAST_DELIVERIES.map((d, i) => (
          <div key={i} className="delivery-row">
            <div className="del-icon">{d.emoji}</div>
            <div className="del-info">
              <div className="del-rest">{d.restaurant}</div>
              <div className="del-detail">{d.detail}</div>
            </div>
            <div className="del-badge">✓ Done</div>
          </div>
        ))}
      </div>
    </>
  );
}