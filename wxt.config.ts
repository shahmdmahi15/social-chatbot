import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Social Auto-Chat AI (Messenger Agent)',
    description: 'Real-time autonomous AI chatbot pretending to be you on Facebook Messenger with multi-language (English, Bangla, Banglish) support and Agent Router integration.',
    version: '1.0.0',
    permissions: [
      'storage',
      'sidePanel',
      'tabs',
      'activeTab',
      'scripting',
      'declarativeNetRequest',
    ],
    host_permissions: [
      '*://*.facebook.com/*',
      '*://*.messenger.com/*',
      '*://*.agentrouter.org/*',
      'https://*/*',
    ],
    action: {
      default_title: 'Open Social Auto-Chat AI Panel',
      default_icon: {
        16: 'icons/icon-16.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
      },
    },
    icons: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
});
