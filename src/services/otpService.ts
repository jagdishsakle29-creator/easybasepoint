/**
 * EasyBasePoint - Company-Controlled Server-Side OTP Service
 * 
 * Strict Security:
 * - OTP is generated ONLY on the secure backend server.
 * - OTP is NEVER generated on client, NEVER stored in localStorage/sessionStorage,
 *   and NEVER returned in API responses.
 * - Verifications use constant-time hashed matching on the server.
 */

export interface SendOtpResponse {
  ok: boolean;
  success?: boolean;
  status?: string;
  error?: string;
  message: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  maskedContact?: string;
  missingConfig?: string[];
}

export interface VerifyOtpResponse {
  ok: boolean;
  success?: boolean;
  verified?: boolean;
  verificationToken?: string;
  identifier?: string;
  error?: string;
  message: string;
  remainingAttempts?: number;
}

export interface ProviderStatusResponse {
  ok: boolean;
  provider: string;
  providerConfigured: boolean;
  senderId: string;
  allowDevFallbackOtp?: boolean;
  requiredEnvVars?: string[];
}

const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api/auth`;
  }
  return 'http://127.0.0.1:5174/api/auth';
};

export const otpService = {
  /**
   * Request an OTP from Company Backend Gateway
   */
  async requestOtp(identifier: string, channel: 'sms' | 'email' = 'sms'): Promise<SendOtpResponse> {
    try {
      const clean = identifier.trim();
      const res = await fetch(`${getApiBase()}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: clean, channel }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          success: false,
          error: data.error || 'SEND_FAILED',
          message: data.message || 'Failed to send verification code. Please try again.',
          cooldownSeconds: data.retryAfterSeconds || 60,
          missingConfig: data.missingConfig,
        };
      }

      return {
        ok: true,
        success: true,
        status: data.status,
        message: data.message || 'Verification code sent to your registered contact.',
        cooldownSeconds: data.cooldownSeconds || 60,
        expiresInSeconds: data.expiresInSeconds || 300,
        maskedContact: data.maskedContact,
      };
    } catch (err: any) {
      return {
        ok: false,
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error communicating with authentication server. Please check your connection.',
      };
    }
  },

  /**
   * Verify an OTP on Company Backend Gateway
   */
  async verifyOtp(identifier: string, otp: string): Promise<VerifyOtpResponse> {
    try {
      const cleanId = identifier.trim();
      const cleanOtp = otp.trim();

      const res = await fetch(`${getApiBase()}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, otp: cleanOtp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          success: false,
          error: data.error || 'VERIFICATION_FAILED',
          message: data.message || 'Invalid verification code.',
          remainingAttempts: data.remainingAttempts,
        };
      }

      return {
        ok: true,
        success: true,
        verified: true,
        verificationToken: data.verificationToken,
        identifier: data.identifier,
        message: data.message || 'Verification successful!',
      };
    } catch (err: any) {
      return {
        ok: false,
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error connecting to verification gateway.',
      };
    }
  },

  /**
   * Check Gateway Provider Configuration Status
   */
  async getProviderStatus(): Promise<ProviderStatusResponse> {
    try {
      const res = await fetch(`${getApiBase()}/provider-status`);
      if (!res.ok) throw new Error('Status check failed');
      return await res.json();
    } catch {
      return {
        ok: false,
        provider: 'UNKNOWN',
        providerConfigured: false,
        senderId: 'EASYBP',
      };
    }
  },
};
