import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Single env file: apps/api/.env (shared with the serverless webhook). */
const API_ENV_DIR = path.resolve(__dirname, '../api');

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, API_ENV_DIR, '');
  const supabaseUrl = loaded.VITE_SUPABASE_URL || loaded.SUPABASE_URL || '';
  const supabaseAnon = loaded.VITE_SUPABASE_ANON_KEY || loaded.SUPABASE_ANON_KEY || '';

  return {
    plugins: [react()],
    envDir: API_ENV_DIR,
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnon)
    },
    server: {
      port: 5179
    }
  };
});
