/**
 * Mock for utils/env.ts - provides test values for Vite environment variables
 */

export const env = {
  VITE_API_BASE_URL: 'http://localhost:5000/api',
  VITE_DEMO_MODE: true,
  DEV: true,
  MODE: 'test',
};

export const isDemoMode = (): boolean => {
  return true;
};

