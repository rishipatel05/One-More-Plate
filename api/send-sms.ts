import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing to or message' });
  }

  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: to,
        message,
        key: 'textbelt',
      }),
    });

    const data = await response.json() as { success: boolean; error?: string; quotaRemaining?: number };

    if (!data.success) {
      console.error('Textbelt error:', data.error);
      return res.status(400).json({ error: data.error });
    }

    console.log('SMS sent! Quota remaining:', data.quotaRemaining);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SMS error:', err);
    return res.status(500).json({ error: 'Failed to send SMS' });
  }
}