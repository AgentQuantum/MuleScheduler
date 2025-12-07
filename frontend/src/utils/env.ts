/**
 * Environment utilities - provides access to Vite environment variables
 * in a way that can be easily mocked in tests.
 */

export const env = {
  get VITE_API_BASE_URL(): string {
    return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  },
  get VITE_DEMO_MODE(): boolean {
    return (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  },
  get DEV(): boolean {
    return (import.meta as any).env?.DEV === true;
  },
  get MODE(): string {
    return (import.meta as any).env?.MODE || 'development';
  },
};

export const isDemoMode = (): boolean => {
  return env.VITE_DEMO_MODE || env.DEV;
};
