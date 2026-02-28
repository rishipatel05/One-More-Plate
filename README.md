# One More Plate 🍽️

Food rescue platform for Newark, Delaware.

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Add API keys to `.env`
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Gemini key:** https://aistudio.google.com/app/apikey  
**Google Maps key:** https://console.cloud.google.com → Enable "Maps JavaScript API" + "Directions API"

### 3. Run
```bash
npm run dev
```
Open http://localhost:5173

---

## Stack
- React 18 + TypeScript + Vite
- Gemini 1.5 Flash — structures food posts, generates WhatsApp messages
- Google Maps JS API — live route from restaurant → volunteer → shelter
- React Context — global state

## Project Structure
```
src/
├── components/
│   ├── PostTab.tsx       ← Gemini API integration here
│   ├── DeliverTab.tsx    ← Google Maps route here
│   ├── FeedTab.tsx
│   ├── VolunteerTab.tsx
│   ├── AccountTab.tsx
│   ├── RouteMap.tsx      ← Maps component
│   └── UI.tsx
├── lib/
│   ├── gemini.ts         ← All Gemini API calls
│   └── store.tsx         ← Global state
├── types/index.ts
└── data/seed.ts          ← Newark, DE mock data
```

## Demo Flow (for presentation)
1. **Post tab** → enter restaurant, food, hit Post → watch Gemini process it
2. See WhatsApp notification → click Yes → shelter gets ETA
3. **Available tab** → your post appears in feed
4. **Delivery tab** → live Google Maps route
5. Upload photo → complete run → lands on Account
6. **Account** → badges, shelter toggles, community stats
