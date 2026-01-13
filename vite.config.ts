
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This provides process.env support in the browser as required by the project guidelines
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY),
      SUPABASE_URL: JSON.stringify(process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: JSON.stringify(process.env.SUPABASE_ANON_KEY),
    },
  },
});
