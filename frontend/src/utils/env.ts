/**
 * Environment utilities - provides access to Vite environment variables
 * in a way that can be easily mocked in tests.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importMeta = import.meta as any;

export const env = {
  get VITE_API_BASE_URL(): string {
    return importMeta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  },
  get VITE_DEMO_MODE(): boolean {
    return importMeta.env?.VITE_DEMO_MODE === 'true';
  },
  get DEV(): boolean {
    return importMeta.env?.DEV === true;
  },
  get MODE(): string {
    return importMeta.env?.MODE || 'development';
  },
};

export const isDemoMode = (): boolean => {
  return env.VITE_DEMO_MODE || env.DEV;
};
