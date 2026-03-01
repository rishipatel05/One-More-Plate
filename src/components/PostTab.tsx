import { useState } from 'react';
import { analyzeAndStructureFoodPost } from '../lib/gemini';
import { addPostToDb } from '../lib/db';
import { sendSMS, buildPickupSMS } from '../lib/sms';
import { useApp } from '../lib/store';
import { GeminiCard, Tag, Button, ShelterNotif, Eyebrow } from './UI';
import type { FoodCondition, FoodPost, GeminiPostAnalysis } from '../types';
import { NEWARK_CENTER } from '../data/seed';

type PostState = 'form' | 'processing' | 'result';

const PROC_STEPS = [
  ['Reading your post with Gemini…', 'Identifying food types & quantities'],
  ['Estimating impact…', 'Calculating CO₂ savings & kg food'],
  ['Finding nearest volunteers…', 'Checking availability within 1 mile'],
  ['Dispatching SMS notifications…', 'Sending to 3 active volunteers'],
];

export default function PostTab() {
  const { showToast, updateStats } = useApp();
  const [state, setState] = useState<PostState>('form');
  const [procStep, setProcStep] = useState(0);
  const [analysis, setAnalysis] = useState<GeminiPostAnalysis | null>(null);
  const [currentPost, setCurrentPost] = useState<FoodPost | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [skippedVol, setSkippedVol] = useState(false);
  const [shelterShown, setShelterShown] = useState(false);

  const [name, setName] = useState('');
  const [food, setFood] = useState('');
  const [portions, setPortions] = useState('');
  const [time, setTime] = useState('23:00');
  const [condition, setCondition] = useState<FoodCondition>('hot');

  const fmtTime = (val: string) => {
    const [h, m] = val.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m}${hr >= 12 ? 'pm' : 'am'}`;
  };

  const handleSubmit = async () => {
    const rName = name || 'Your Restaurant';
    const rFood = food || 'mixed dishes';
    const rPortions = parseInt(portions) || 20;
    const rTime = fmtTime(time);

    setState('processing');
    setProcStep(0);

    for (let i = 0; i < PROC_STEPS.length; i++) {
      setProcStep(i);
      await new Promise(r => setTimeout(r, 700));
    }

    const result = await analyzeAndStructureFoodPost(rName, rFood, rPortions, rTime, condition);
    setAnalysis(result);

    const post: FoodPost = {
      id: Date.now().toString(),
      restaurantName: rName,
      restaurantAddress: `${rName}, Newark, DE 19711`,
      restaurantLocation: NEWARK_CENTER,
      foodDescription: rFood,
      portions: rPortions,
      pickupBy: rTime,
      condition,
      postedAt: new Date(),
      claimed: false,
      geminiSummary: result,
    };

    const saved = await addPostToDb({
      restaurantName: rName,
      restaurantAddress: `${rName}, Newark, DE 19711`,
      restaurantLocation: NEWARK_CENTER,
      foodDescription: rFood,
      portions: rPortions,
      pickupBy: rTime,
      condition,
      geminiSummary: result,
    });

    // Send real SMS to Dakshi
    sendSMS('3027470804', buildPickupSMS(
      rName,
      rFood,
      rPortions,
      rTime,
      `${rName}, Newark, DE 19711`
    ));

    setCurrentPost(saved ?? post);
    setState('result');
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setShelterShown(true);
    updateStats({ mealsThisWeek: 20, kgSaved: 5, co2Avoided: 10 });
    showToast('🎉 Run confirmed — shelter notified!');
  };

  const handleSkip = () => setSkippedVol(true);

  const handleReset = () => {
    setState('form');
    setAnalysis(null);
    setCurrentPost(null);
    setConfirmed(false);
    setSkippedVol(false);
    setShelterShown(false);
    setName(''); setFood(''); setPortions(''); setTime('23:00'); setCondition('hot');
  };

  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + 25);
  const etaStr = eta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const volName = skippedVol ? 'Sarah K.' : 'Dakshi K.';
  const volDist = skippedVol ? '0.7' : '0.4';

  return (
    <div className="body">
      {state === 'form' && (
        <>
          <Eyebrow>Closing up? Tell us what's left.</Eyebrow>
          <div className="field">
            <label>Restaurant</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Harvest Moon Brewing" />
          </div>
          <div className="field">
            <label>What do you have?</label>
            <textarea value={food} onChange={e => setFood(e.target.value)} rows={3} placeholder="e.g. 30 portions pasta, bread rolls, minestrone" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Portions</label>
              <input type="number" value={portions} onChange={e => setPortions(e.target.value)} placeholder="30" min={1} />
            </div>
            <div className="field">
              <label>Pickup by</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Temperature</label>
            <select value={condition} onChange={e => setCondition(e.target.value as FoodCondition)}>
              <option value="hot">🔥 Hot — just off the stove</option>
              <option value="warm">♨️ Warm</option>
              <option value="room">🫙 Room temperature</option>
              <option value="cold">❄️ Cold / refrigerated</option>
            </select>
          </div>
          <Button onClick={handleSubmit}>Post to nearby volunteers →</Button>
        </>
      )}

      {state === 'processing' && (
        <div className="processing">
          <div className="plate-spin">🍽️</div>
          <div className="proc-step">{PROC_STEPS[procStep]?.[0]}</div>
          <div className="proc-sub">{PROC_STEPS[procStep]?.[1]}</div>
        </div>
      )}

      {state === 'result' && analysis && currentPost && (
        <>
          <GeminiCard label="Gemini · Structured & Dispatched">
            <div style={{ marginBottom: 10 }}>
              {analysis.tags.map(t => <Tag key={t} variant={t.includes('🌱') ? 'green' : 'red'}>{t}</Tag>)}
              <Tag variant="green">🌱 ~{analysis.estimatedCo2Saved}kg CO₂ saved</Tag>
              <Tag variant="green">📦 ~{analysis.estimatedKg}kg food</Tag>
              <Tag variant={analysis.urgencyLevel === 'high' ? 'red' : 'default'}>
                {analysis.urgencyLevel === 'high' ? '🔴 Urgent' : analysis.urgencyLevel === 'medium' ? '🟡 Tonight' : '🟢 Flexible'}
              </Tag>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink2)' }}>
              {analysis.structuredDescription} <strong>{analysis.distributionRecommendation}</strong>
            </p>
          </GeminiCard>

          <div className="wa-wrap">
            <div className="wa-bar">
              <div className="wa-av">🧑</div>
              <div>
                <div className="wa-name">{volName} — Volunteer</div>
                <div className="wa-dist">{volDist} miles away · SMS sent ✓</div>
              </div>
            </div>
            <div className="wa-chat">
              <div className="wa-msg">
                <div className="wa-msg-text" style={{ whiteSpace: 'pre-line' }}>{analysis.whatsappMessage}</div>
                <div className="wa-msg-time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {!confirmed ? (
                <div className="wa-btns">
                  <button className="wa-btn yes" onClick={handleConfirm}>✓ Yes, I'll go</button>
                  {!skippedVol
                    ? <button className="wa-btn no" onClick={handleSkip}>✗ Can't make it</button>
                    : <div style={{ padding: '8px', fontSize: 11, color: '#999' }}>Sarah K. notified…</div>
                  }
                </div>
              ) : (
                <div className="wa-btns">
                  <button className="wa-btn yes confirmed">✓ Confirmed!</button>
                </div>
              )}
            </div>
          </div>

          {shelterShown && (
            <ShelterNotif>
              <strong>{volName}</strong> is on the way.<br />
              Estimated arrival: <strong>{etaStr}</strong><br /><br />
              Please have someone at the main entrance to receive the delivery.
            </ShelterNotif>
          )}

          <div className="timeline">
            <div className="t-row"><div className="t-dot done" /><div className="t-text done">Restaurant posted surplus</div></div>
            <div className="t-row"><div className="t-dot done" /><div className="t-text done">Gemini structured post — SMS sent to volunteers</div></div>
            <div className="t-row">
              <div className={`t-dot ${confirmed ? 'done' : 'now'}`} />
              <div className={`t-text ${confirmed ? 'done' : ''}`}>
                {confirmed ? `${volName} confirmed — en route` : 'Waiting for volunteer confirmation…'}
              </div>
            </div>
            <div className="t-row">
              <div className={`t-dot ${shelterShown ? 'done' : ''}`} />
              <div className={`t-text ${shelterShown ? 'done' : ''}`}>
                {shelterShown ? `Shelter notified · ETA ${etaStr}` : 'Shelter notified with ETA'}
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={handleReset} className="mt-16">Post another →</Button>
        </>
      )}
    </div>
  );
}