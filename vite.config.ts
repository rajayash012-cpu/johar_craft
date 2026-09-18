import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { handleEnhanceRequest } from './server/proxy';

function deepImageProxyPlugin(): Plugin {
  return {
    name: 'deep-image-proxy-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req as { url?: string }).url || '';
        if (url.startsWith('/api/enhance-image') || url.startsWith('/api/image-enhance')) {
          handleEnhanceRequest(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req as { url?: string }).url || '';
        if (url.startsWith('/api/enhance-image') || url.startsWith('/api/image-enhance')) {
          handleEnhanceRequest(req, res);
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), deepImageProxyPlugin()],
  server: {
    watch: {
      ignored: ['**/scratch/**'],
    },
  },
});
