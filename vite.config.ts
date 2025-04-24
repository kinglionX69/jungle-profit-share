import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom']
  },
  optimizeDeps: {
    force: true,
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@mui/material', 
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      '@mui/system',
      'prop-types',
      'notistack',
      '@tanstack/react-query'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Create separate chunks for React-related packages
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
          
          // MUI and related packages
          if (id.includes('node_modules/@mui/') || 
              id.includes('node_modules/@emotion/')) {
            return 'mui-vendor';
          }
          
          // Other major dependencies
          if (id.includes('node_modules/notistack/')) {
            return 'notistack-vendor';
          }
          
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'query-vendor';
          }
        }
      }
    },
    target: 'es2020'
  },
  // Add these settings to help with module resolution
  define: {
    'process.env': {},
  },
  // Ensure proper module resolution
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
