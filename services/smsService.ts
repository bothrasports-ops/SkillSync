
/**
 * Production-Ready SMS Service Pattern
 *
 * In a real production app, the 'sendOTP' method would call your backend API,
 * which would then use the Twilio/Vonage SDK to send the message.
 * NEVER call Twilio directly from the frontend.
 */

class SmsService {
  private activeCode: string | null = null;
  private lastSentAt: number = 0;

  /**
   * Sends an OTP to the provided phone number.
   * Includes simulation logic for development and the pattern for production.
   */
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    // 1. Rate Limiting Check (Frontend side)
    const now = Date.now();
    if (now - this.lastSentAt < 30000) { // 30s cooldown
        return { success: false, message: "Please wait before requesting a new code." };
    }

    // 2. Production Pattern (Commented out for this demo environment)
    /*
    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const result = await response.json();
        return result;
    } catch (e) {
        return { success: false, message: "Network error" };
    }
    */

    // 3. Simulation Logic
    console.log(`[PROD SIM] Calling SMS Gateway for: ${phone}`);

    // Simulate real network latency (800ms to 1.5s)
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.activeCode = code;
    this.lastSentAt = now;

    // Trigger a window event that the UI can listen to for the "Simulated SMS" banner
    window.dispatchEvent(new CustomEvent('ts-simulated-sms', {
        detail: { code, phone }
    }));

    return { success: true, message: "Verification code sent." };
  }

  /**
   * Verifies the OTP.
   * In production, this would be a POST request to your backend.
   */
  async verifyOTP(code: string): Promise<{ success: boolean }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const isValid = code === this.activeCode;
    // In demo, we also allow '1234' for convenience
    if (isValid || code === '1234') {
        this.activeCode = null; // Clear after use
        return { success: true };
    }
    return { success: false };
  }
}

export const smsService = new SmsService();
