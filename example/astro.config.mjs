import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import dashtro from 'dashtro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    dashtro({
      database_url: 'duckdb:./data/analytics.duckdb',
    }),
  ],
});
