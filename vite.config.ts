import { defineConfig } from 'vite';

// Relative base so the build can be opened from any path or static host.
export default defineConfig({
  base: './',
  build: { target: 'es2020' },
});
