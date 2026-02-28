import { useState } from 'react';
import { useApp } from '../lib/store';
import { Eyebrow, Divider } from './UI';
import RouteMap from './RouteMap';

const PAST_DELIVERIES = [
  { emoji: '🍕', restaurant: 'Iron Hill Brewery', detail: 'Feb 24 · 18 portions · Food Bank of DE' },
  { emoji: '🥗', restaurant: 'Caffe Gelato', detail: 'Feb 21 · 12 portions · Senior Center' },
  { emoji: '🍜', restaurant: 'Grain on the Main', detail: 'Feb 19 · 22 portions · UD Pantry' },
];

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

  const handlePhotoUpload = () => {
    setPhotoUploaded(true);
    showToast('📸 Photo uploaded successfully');
  };

  const handleCompleteRun = () => {
    setRunComplete(true);
    showToast('🎉 Run complete! +1 badge earned.');
    setTimeout(() => setActiveTab('account'), 1200);
  };

  const steps: RunStep[] = [
    { icon: '✅', title: 'Run accepted', sub: '10:14pm · Notified via WhatsApp', status: 'done' },
    { icon: '🚗', title: 'Heading to restaurant', sub: `${activeRun?.post.restaurantName} · ${activeRun?.distanceToRestaurant}mi · ETA 3 min`, status: 'current' },
    { icon: '📦', title: 'Collect food', sub: 'Ask for the manager, use side entrance', status: 'pending' },
    { icon: '🏠', title: 'Drop off at shelter', sub: `${activeRun?.shelter.name} · ${activeRun?.distanceToShelter}mi`, status: 'pending' },
    { icon: '📸', title: 'Confirm delivery', sub: 'Upload a photo to complete the run', status: 'pending' },
  ];

  if (!activeRun) {
    return (
      <div className="body">
        <Eyebrow>No active run</Eyebrow>
        <div className="empty">
          Claim a pickup from the Available tab<br />to start a delivery run.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Run hero */}
      <div className="run-hero">
        <div className="run-status-label">Active Run · In Progress</div>
        <div className="run-status-main">En route to pickup</div>
        <div className="run-status-sub">{activeRun.post.restaurantName} · {activeRun.distanceToRestaurant} mi away</div>
      </div>

      <div className="body" style={{ paddingTop: 18 }}>

        {/* Google Maps route */}
        <div className="route-card">
          <div className="route-map">
            <RouteMap
              origin={activeRun.post.restaurantLocation}
              destination={activeRun.shelter.location}
              volunteerLocation={activeRun.volunteer.location}
              originLabel={activeRun.post.restaurantName}
              destinationLabel={activeRun.shelter.name}
            />
          </div>
          <div className="route-details">
            <div className="route-stat">
              <div className="route-stat-n">{(activeRun.distanceToRestaurant + activeRun.distanceToShelter).toFixed(1)}</div>
              <div className="route-stat-l">Total miles</div>
            </div>
            <div className="route-stat">
              <div className="route-stat-n">{Math.round((activeRun.distanceToRestaurant + activeRun.distanceToShelter) * 6)}</div>
              <div className="route-stat-l">Min est.</div>
            </div>
            <div className="route-stat">
              <div className="route-stat-n">{activeRun.post.portions}</div>
              <div className="route-stat-l">Portions</div>
            </div>
          </div>
        </div>

        {/* Steps */}
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

        {/* Photo upload */}
        <Eyebrow>Confirm delivery</Eyebrow>
        <div
          className={`photo-upload ${photoUploaded ? 'uploaded' : ''}`}
          onClick={!photoUploaded ? handlePhotoUpload : undefined}
        >
          <div className="photo-icon">{photoUploaded ? '✅' : '📸'}</div>
          <div className="photo-label">{photoUploaded ? 'Photo confirmed' : 'Take a photo at drop-off'}</div>
          <div className="photo-sub">{photoUploaded ? 'Delivery photo uploaded successfully' : 'Confirms the delivery to the shelter'}</div>
        </div>

        <button
          className="btn btn-sage"
          onClick={handleCompleteRun}
          disabled={!photoUploaded || runComplete}
          style={{ opacity: photoUploaded ? 1 : 0.4 }}
        >
          {runComplete ? '✓ Run complete!' : 'Mark run as complete'}
        </button>

        <Divider />

        {/* Past deliveries */}
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
