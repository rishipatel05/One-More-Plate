import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FoodCondition, GeminiPostAnalysis } from '../types';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const MODEL_CANDIDATES = [
  import.meta.env.VITE_GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
].filter(Boolean) as string[];

interface FoodPhotoValidation {
  isFood: boolean;
  confidence: number;
  reason: string;
}

async function generateTextWithFallbackModels(prompt: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  let lastError: unknown = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('Gemini returned empty response');
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      if (!base64) {
        reject(new Error('Failed to encode image'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export async function validateFoodProofPhoto(file: File): Promise<FoodPhotoValidation> {
  if (!geminiApiKey) {
    return {
      isFood: false,
      confidence: 0,
      reason: 'Gemini key missing. Cannot verify food photo.',
    };
  }

  const prompt = `
You are verifying delivery proof photos for a food rescue app.
Decide if this image clearly shows real food (meals, ingredients, packaged food trays, dishes).

Return ONLY valid JSON:
{
  "isFood": true or false,
  "confidence": number from 0 to 1,
  "reason": "very short reason"
}
`;

  try {
    const base64 = await fileToBase64(file);
    let lastError: unknown = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type || 'image/jpeg',
              data: base64,
            },
          },
        ]);
        const raw = result.response.text().replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw) as Partial<FoodPhotoValidation>;
        const isFood = Boolean(parsed.isFood);
        const confidence = clampConfidence(Number(parsed.confidence ?? 0));
        const reason = String(parsed.reason ?? '').trim() || (isFood ? 'Food detected.' : 'Food not detected.');
        return { isFood, confidence, reason };
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error('No model produced validation response');
  } catch (err) {
    console.error('Gemini image validation failed:', err);
    return {
      isFood: false,
      confidence: 0,
      reason: 'Could not verify this image as food. Please try another photo.',
    };
  }
}

export async function analyzeAndStructureFoodPost(
  restaurantName: string,
  foodDescription: string,
  portions: number,
  pickupBy: string,
  condition: FoodCondition,
  dropoffShelterName = 'Food Bank of Delaware'
): Promise<GeminiPostAnalysis> {
  const prompt = `
You are a food rescue coordinator for One More Plate, a Newark Delaware food rescue platform.
Analyze this surplus food post and return a JSON response.

Restaurant: ${restaurantName}
Food: ${foodDescription}
Portions: ${portions}
Pickup by: ${pickupBy}
Condition: ${condition}
Nearest shelter: ${dropoffShelterName}

Return ONLY valid JSON with this exact structure:
{
  "structuredDescription": "Clean 1-sentence summary of available food",
  "estimatedKg": <number, estimate total kg based on portions>,
  "estimatedCo2Saved": <number, kg CO2 saved vs landfill, roughly 2.5x food weight>,
  "urgencyLevel": <"low" | "medium" | "high" based on condition and time>,
  "dispatchMessage": "SMS notification to send volunteers, include emoji, restaurant name, food, portions, pickup time, drop-off shelter",
  "tags": ["array", "of", "3-5", "short", "descriptive", "tags"],
  "distributionRecommendation": "One sentence on best way to distribute this food"
}
`;

  try {
    const text = (await generateTextWithFallbackModels(prompt)).replace(/```json|```/g, '').trim();
    return JSON.parse(text) as GeminiPostAnalysis;
  } catch (err) {
    console.error('Gemini API error:', err);
    // Fallback if API fails
    const kg = +(portions * 0.22).toFixed(1);
    return {
      structuredDescription: `${restaurantName} has ${portions} portions of ${foodDescription} available for pickup by ${pickupBy}.`,
      estimatedKg: kg,
      estimatedCo2Saved: +(kg * 2.5).toFixed(1),
      urgencyLevel: condition === 'hot' ? 'high' : condition === 'cold' ? 'low' : 'medium',
      dispatchMessage: `🍽️ Food pickup available!\n\n📍 ${restaurantName} · Newark, DE\n🥘 ${foodDescription} — ${portions} portions\n⏰ Collect by ${pickupBy}\n🏠 Drop off: ${dropoffShelterName}\n\nTap to claim this run.`,
      tags: [condition === 'hot' ? '🔥 Hot' : '♨️ Warm', `${portions} portions`, 'Pickup tonight'],
      distributionRecommendation: `Distribute immediately — suitable for direct hot meal service at the shelter.`,
    };
  }
}

export async function generateVolunteerMatchMessage(
  volunteerName: string,
  restaurantName: string,
  foodDescription: string,
  portions: number,
  pickupBy: string,
  distanceMiles: number
): Promise<string> {
  const prompt = `
Write a brief, friendly SMS notification message for a food rescue volunteer.
Keep it under 80 words. Use a warm but urgent tone. Include emojis.

Volunteer: ${volunteerName}
Restaurant: ${restaurantName}
Food: ${foodDescription}
Portions: ${portions}
Pickup by: ${pickupBy}
Distance from volunteer: ${distanceMiles} miles

End with: "Reply YES to claim this run."
Return only the message text, no JSON.
`;

  try {
    return await generateTextWithFallbackModels(prompt);
  } catch {
    return `Hi ${volunteerName}! 🍽️\n\n${restaurantName} has ${portions} portions of ${foodDescription} — just ${distanceMiles}mi from you. Pickup by ${pickupBy}.\n\nReply YES to claim this run.`;
  }
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickByMessage(message: string, options: string[]): string {
  return options[hashString(message) % options.length];
}

function generateRuleBasedRestaurantReply(
  driverMessage: string,
  context: {
    restaurantName: string;
    foodDescription: string;
    portions: number;
    pickupBy: string;
    shelterName: string;
  }
): string {
  const msg = driverMessage.toLowerCase();

  if (/(where|front|back|entrance|door|pickup)/.test(msg)) {
    return pickByMessage(driverMessage, [
      'Please use the front host stand and ask for the food rescue pickup. We will bring it out.',
      'Pickup is at the side service door. Ring once and mention One More Plate.',
      'Come to the front desk and tell the team you are here for the shelter delivery pickup.',
    ]);
  }

  if (/(eta|away|minutes|minute|arrive|there soon)/.test(msg)) {
    return pickByMessage(driverMessage, [
      `Perfect, thanks for the ETA. We will keep ${context.foodDescription} warm until you arrive.`,
      `Thanks for the update. We have ${context.portions} portions staged and labeled for quick handoff.`,
      `Sounds good. We are packing everything now so pickup stays quick when you get here.`,
    ]);
  }

  if (/(allergy|allergen|nut|gluten|dairy|vegan|vegetarian)/.test(msg)) {
    return pickByMessage(driverMessage, [
      'No known nut ingredients in this batch, but we still recommend sharing standard allergy caution with the shelter.',
      'There is dairy in part of this order; containers are labeled so the shelter can sort quickly.',
      'Some items include gluten. We separated containers and marked what we could clearly identify.',
    ]);
  }

  if (/(late|traffic|delay|running behind)/.test(msg)) {
    return pickByMessage(driverMessage, [
      'No problem, thanks for letting us know. We can hold until pickup by the listed time.',
      'Understood. We will keep the order ready and hand off as soon as you arrive.',
      'Thanks for the heads up. Just message when you are 2-3 minutes out.',
    ]);
  }

  if (/(thanks|thank you|thx)/.test(msg)) {
    return 'Thank you for helping with this rescue run. See you shortly at pickup.';
  }

  return pickByMessage(driverMessage, [
    `Copy that. We have ${context.foodDescription} (${context.portions} portions) ready for pickup by ${context.pickupBy}.`,
    `Got it. Team is preparing the handoff now, and we will be ready before ${context.pickupBy}.`,
    `Thanks for the message. We are set for pickup and will confirm handoff for ${context.shelterName}.`,
  ]);
}

export async function generateMockRestaurantReply(
  driverMessage: string,
  context: {
    restaurantName: string;
    foodDescription: string;
    portions: number;
    pickupBy: string;
    shelterName: string;
    }
): Promise<string> {
  const prompt = `
You are roleplaying a restaurant team member replying to a food rescue delivery driver in a demo chat.
This chat is for a hackathon demo. Keep replies realistic, concise, and helpful.

Context:
- Restaurant: ${context.restaurantName}
- Food: ${context.foodDescription}
- Portions: ${context.portions}
- Pickup by: ${context.pickupBy}
- Shelter drop-off: ${context.shelterName}

Driver message:
"${driverMessage}"

Return one short message (1-2 sentences), plain text only, no JSON.
`;

  try {
    const reply = await generateTextWithFallbackModels(prompt);
    return reply.replace(/^["'`]+|["'`]+$/g, '').trim().slice(0, 240);
  } catch (err) {
    console.warn('Gemini chat reply failed, using rule-based fallback:', err);
    return generateRuleBasedRestaurantReply(driverMessage, context);
  }
}
