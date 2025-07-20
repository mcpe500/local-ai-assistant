import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 8100,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'www',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'onnx-runtime': ['onnxruntime-web'],
          'ionic-react': ['@ionic/react', '@ionic/react-router'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
});