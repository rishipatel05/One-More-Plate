import { useEffect, useState } from 'react';
import { useApp } from '../lib/store';
import { Eyebrow, Divider, NeedPill, Toggle } from './UI';
import { SHELTERS } from '../data/seed';

function useAnimatedNumber(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(start);
      if (start >= target) clearInterval(t);
    }, duration / 40);
    return () => clearInterval(t);
  }, [target, duration]);
  return value;
}

export default function AccountTab() {
  const { user, setUser, stats } = useApp();
  const [preferredIds, setPreferredIds] = useState(user.preferredShelterIds);

  const runs = useAnimatedNumber(user.totalRuns);
  const meals = useAnimatedNumber(user.totalMealsRescued);
  const kg = useAnimatedNumber(user.totalKgSaved);
  const communityMeals = useAnimatedNumber(stats.mealsThisWeek);
  const communityKg = useAnimatedNumber(stats.kgSaved);
  const communityCo2 = useAnimatedNumber(stats.co2Avoided);
  const communityRest = useAnimatedNumber(stats.activeRestaurants);

  const toggleShelter = (id: string) => {
    const updated = preferredIds.includes(id)
      ? preferredIds.filter(s => s !== id)
      : [...preferredIds, id];
    setPreferredIds(updated);
    setUser({ ...user, preferredShelterIds: updated });
  };

  const initial = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <>
      <div className="account-hero">
        <div className="avatar">{initial}</div>
        <div>
          <div className="account-name">{user.firstName} {user.lastName}</div>
          <div className="account-role">⭐ Regular Volunteer</div>
          <div className="account-since">Member since {user.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="stats-3">
        <div className="acc-stat"><div className="acc-stat-n">{runs}</div><div className="acc-stat-l">Runs</div></div>
        <div className="acc-stat"><div className="acc-stat-n">{meals}</div><div className="acc-stat-l">Meals</div></div>
        <div className="acc-stat"><div className="acc-stat-n">{kg}</div><div className="acc-stat-l">kg saved</div></div>
      </div>

      <div className="body">
        <Eyebrow>Badges</Eyebrow>
        <div className="badges-grid">
          {user.badges.map(badge => (
            <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : ''}`}>
              <div className="badge-icon">{badge.emoji}</div>
              <div className="badge-name">{badge.name}</div>
              <div className="badge-desc">{badge.description}</div>
            </div>
          ))}
        </div>

        <Divider />

        <Eyebrow>Preferred drop-off shelters</Eyebrow>
        {SHELTERS.map(shelter => (
          <div key={shelter.id} className="shelter-pref">
            <div className="sp-icon">{shelter.emoji}</div>
            <div className="sp-info">
              <div className="sp-name">{shelter.name}</div>
              <div className="sp-dist">{shelter.address.split(',').slice(1).join(',').trim()}</div>
            </div>
            <Toggle
              on={preferredIds.includes(shelter.id)}
              onChange={() => toggleShelter(shelter.id)}
            />
          </div>
        ))}

        <Divider />

        <Eyebrow>Newark community impact this week</Eyebrow>
        <div className="impact-hero">
          <div className="impact-label">Meals rescued this week</div>
          <div className="impact-num">{communityMeals}</div>
          <div className="impact-sub">plates that found a home</div>
        </div>
        <div className="stats-row">
          <div className="stat-box"><div className="stat-n">{communityKg}</div><div className="stat-l">kg food saved</div></div>
          <div className="stat-box"><div className="stat-n">{communityCo2}</div><div className="stat-l">kg CO₂ avoided</div></div>
          <div className="stat-box"><div className="stat-n">{communityRest}</div><div className="stat-l">restaurants</div></div>
        </div>

        <Divider />
        <Eyebrow>Where the food goes</Eyebrow>
        {SHELTERS.map(s => (
          <div key={s.id} className="shelter-row">
            <div className="sh-emoji">{s.emoji}</div>
            <div className="sh-info">
              <div className="sh-name">{s.name}</div>
              <div className="sh-dist">{s.distanceMiles} miles · {s.address.split(',')[1]?.trim()}</div>
            </div>
            <NeedPill level={s.needLevel} />
          </div>
        ))}
      </div>
    </>
  );
}
