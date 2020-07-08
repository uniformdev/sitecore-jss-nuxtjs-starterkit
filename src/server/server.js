const nuxt = require('nuxt');
const { showBanner } = require('@nuxt/cli/dist/cli-banner');
// Import server configuration
const serverConfig = require('./server.config');

start();

async function start() {
  const isDev = process.env.NODE_ENV !== 'production';

  // Init Nuxt.js
  const app = await nuxt.loadNuxt(isDev ? 'dev' : 'start');

  // Build only in dev mode.
  // In production mode, the app should be built before starting the server.
  if (isDev) {
    await nuxt.build(app);
  }

  const port = serverConfig.resolveListeningPort();
  await app.listen(port);

  // Show banner when listening
  showBanner(app, false);
}
