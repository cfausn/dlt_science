import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'events', 'crypto'],
      exclude: []
    }),
  ],
  // Configure build options for the library output
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'HederaDonationWidget',
      fileName: (format) => `hedera-widget.${format}.js`,
      formats: ['umd', 'es']
    },
    rollupOptions: {
      // Make React and ReactDOM external
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
