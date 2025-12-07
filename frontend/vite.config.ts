import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars - prioritize process.env for build-time overrides
  const env = loadEnv(mode, process.cwd(), '');
  const demoMode = process.env.VITE_DEMO_MODE || env.VITE_DEMO_MODE || 'true';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify(demoMode),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  };
});
