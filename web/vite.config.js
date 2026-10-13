import { defineConfig } from 'vite';
import assetHashes from './vite_asset_hashes.js'; // content-hashed GLB/JSON/texture names for the CDN (build only)

export default defineConfig({
  plugins: [assetHashes()],
  build: {
    target: 'esnext',
    rollupOptions: { input: { main: 'index.html', gate: 'gate.html', world: 'world.html', chars: 'chars.html', creatures: 'creatures.html', boats: 'boats.html' } },
  },
  esbuild: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
});
