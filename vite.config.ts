import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'ignore-db-updates',
        handleHotUpdate({ file }) {
          if (
            file.includes('social_network_db.json') ||
            file.includes('/data/') ||
            file.includes('\\data\\') ||
            file.includes('/uploads/') ||
            file.includes('\\uploads\\')
          ) {
            return [];
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/data/**',
          '**/data/*',
          '**/data/social_network_db.json',
          '**/social_network_db.json',
          '**/public/uploads/**',
          '**/dist/**',
        ],
      },
    },
  };
});
