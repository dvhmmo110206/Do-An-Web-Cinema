import { resolve } from 'path';
import { defineConfig } from 'vite';
import htmlInject from 'vite-plugin-html-inject';

export default defineConfig({
  plugins: [htmlInject()],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        search: resolve(__dirname, 'pages/search_page.html'),
        watch: resolve(__dirname, 'pages/watch_a_film_page.html'),
        series: resolve(__dirname, 'pages/series_detail.html'),
        my_list: resolve(__dirname, 'pages/my_list.html'),
        login: resolve(__dirname, 'pages/login.html'),
        register: resolve(__dirname, 'pages/register.html'),
        pricing: resolve(__dirname, 'pages/pricing.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        select_profile: resolve(__dirname, 'pages/select_profile.html'),
        checkout: resolve(__dirname, 'pages/checkout.html'),
        about: resolve(__dirname, 'pages/about.html'),
        contact: resolve(__dirname, 'pages/contact.html'),
        help: resolve(__dirname, 'pages/help.html'),
        not_found: resolve(__dirname, 'pages/404.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
