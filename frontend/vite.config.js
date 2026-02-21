import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from "url";

// https://vite.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@components": resolve(dirname(fileURLToPath(import.meta.url)), 'src/components'),
      "@constants": resolve(dirname(fileURLToPath(import.meta.url)), 'src/constants'),
      "@store": resolve(dirname(fileURLToPath(import.meta.url)), 'src/store'),
      "@hoc": resolve(dirname(fileURLToPath(import.meta.url)), 'src/hoc'),
      "@windows": resolve(dirname(fileURLToPath(import.meta.url)), 'src/features/windows'),
      "@services": resolve(dirname(fileURLToPath(import.meta.url)), 'src/services'),
      "@hooks": resolve(dirname(fileURLToPath(import.meta.url)), 'src/hooks'),
      "@utils": resolve(dirname(fileURLToPath(import.meta.url)), 'src/utils'),
      "@features": resolve(dirname(fileURLToPath(import.meta.url)), 'src/features'),
      "@style": resolve(dirname(fileURLToPath(import.meta.url)), 'src/style'),
    }
  }
})
