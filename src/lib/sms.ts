export async function sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+1${to.replace(/\D/g, '')}`, message }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        console.error('SMS failed:', data.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('SMS error:', err);
      return false;
    }
  }
  
  export function buildPickupSMS(
    restaurantName: string,
    foodDescription: string,
    portions: number,
    pickupBy: string,
    restaurantAddress: string
  ): string {
    return `🍽️ ONE MORE PLATE — Food pickup available!
  
  📍 ${restaurantName}
  ${restaurantAddress}
  
  🥘 ${foodDescription}
  👥 ${portions} portions
  ⏰ Pickup by ${pickupBy}
  
  Open the app to claim this run:
  one-more-plate.vercel.app
  
  Reply STOP to unsubscribe.`;
  }