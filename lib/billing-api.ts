/**
 * Billing API Client
 * Typed functions for interacting with the billing API
 */

const BILLING_API_BASE = process.env.NEXT_PUBLIC_BILLING_API_BASE || "/api/billing";

// Response types
export interface VerifyTokenResponse {
  success: true;
  valid: true;
}

export interface MinutesRemainingResponse {
  success: true;
  remaining_minutes: number;
}

export interface SetMinutesResponse {
  success: true;
  remaining_minutes: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

/**
 * Verify a token
 * @param token - The token to verify
 * @returns Promise with verification result
 * @throws Error with WordPress error message if verification fails
 */
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch(`${BILLING_API_BASE}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.valid) {
      const errorMessage = data.message || data.error || "Token verification failed";
      throw new Error(errorMessage);
    }

    return data as VerifyTokenResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to verify token");
  }
}

/**
 * Get remaining minutes for a token
 * @param token - The token to check
 * @returns Promise with remaining minutes
 * @throws Error with WordPress error message if request fails
 */
export async function getMinutesRemaining(token: string): Promise<MinutesRemainingResponse> {
  try {
    const response = await fetch(`${BILLING_API_BASE}/minutes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok || !data.success || typeof data.remaining_minutes !== "number") {
      const errorMessage = data.message || data.error || "Failed to retrieve remaining minutes";
      throw new Error(errorMessage);
    }

    return data as MinutesRemainingResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get remaining minutes");
  }
}

/**
 * Set minutes for a token
 * @param token - The token to update
 * @param minutes - The number of minutes to set
 * @returns Promise with updated remaining minutes
 * @throws Error with WordPress error message if request fails
 */
export async function setMinutes(token: string, minutes: number): Promise<SetMinutesResponse> {
  try {
    const response = await fetch(`${BILLING_API_BASE}/set-minutes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, minutes }),
    });

    const data = await response.json();

    if (!response.ok || !data.success || typeof data.remaining_minutes !== "number") {
      const errorMessage = data.message || data.error || "Failed to set minutes";
      throw new Error(errorMessage);
    }

    return data as SetMinutesResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to set minutes");
  }
}

