import "server-only";

import { AI_API_KEY, applySecretChange, decryptSecret, encryptSecret, SecretUnreadable, secretState, type SecretChange, type SecretState } from "@/lib/secrets";

import { API_KEY_UNREADABLE } from "./provider-options";

// Hosted-provider API keys are stored encrypted (SET-1, PRD §11), with the
// helpers in src/lib/secrets.ts under the AI key's own derived key.

export { API_KEY_UNREADABLE };

/** Thrown when a stored key can't be decrypted. Its message never contains key material. */
export class ApiKeyUnreadable extends Error {
  override name = "ApiKeyUnreadable";
  constructor() {
    super(API_KEY_UNREADABLE);
  }
}

export function encryptApiKey(apiKey: string, secret?: string): string {
  return encryptSecret(AI_API_KEY, apiKey, secret);
}

export function decryptApiKey(stored: string, secret?: string): string {
  try {
    return decryptSecret(AI_API_KEY, stored, secret);
  } catch (error) {
    if (error instanceof SecretUnreadable) throw new ApiKeyUnreadable();
    throw error;
  }
}

/** What the settings screen may know about the saved key: never the key itself. */
export type ApiKeyState = SecretState;

export function apiKeyState(stored: string | null, secret?: string): ApiKeyState {
  return secretState(AI_API_KEY, stored, secret);
}

/** How a settings save changes the key (see SecretChange). */
export type ApiKeyChange = SecretChange;

/** The new value of `Settings.apiKeyEnc` after `change`. */
export function applyApiKeyChange(stored: string | null, change: ApiKeyChange, secret?: string): string | null {
  return applySecretChange(AI_API_KEY, stored, change, secret);
}
