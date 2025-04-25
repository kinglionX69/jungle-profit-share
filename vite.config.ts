
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { lovableTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    open: true,
  },
  plugins: [
    react(),
    lovableTagger(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
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
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'utils': ['notistack', '@tanstack/react-query']
        }
      }
    },
  },
  define: {
    'process.env': {},
  }
}));
