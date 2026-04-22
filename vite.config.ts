import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // GitHub Pages deploys to /repo-name/ — set base if GITHUB_PAGES=true
  const base = process.env.GITHUB_PAGES === 'true' ? `/${process.env.REPO_NAME || 'gradeai'}/` : '/';
  return {
    base,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.ALEM_API_KEY':    JSON.stringify(env.ALEM_API_KEY),
      'process.env.RAGFLOW_API_KEY': JSON.stringify(env.RAGFLOW_API_KEY),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
