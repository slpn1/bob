export const clientEnv = {
  // ... existing env vars ...

  // DALL-E 3
  DALL_E_3_ENDPOINT: process.env.DALL_E_3_ENDPOINT || '',
  DALL_E_3_API_KEY: process.env.DALL_E_3_API_KEY || '',
} as const; 