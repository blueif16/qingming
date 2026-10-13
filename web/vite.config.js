import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: { input: { main: 'index.html', gate: 'gate.html', world: 'world.html', chars: 'chars.html', creatures: 'creatures.html', boats: 'boats.html' } },
  },
  esbuild: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
});
