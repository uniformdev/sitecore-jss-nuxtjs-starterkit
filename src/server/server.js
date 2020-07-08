const nuxt = require('nuxt');
const { showBanner } = require('@nuxt/cli/dist/cli-banner');

// Allow starting from the command line or starting from exported `start` method.
if (process.argv.some((arg) => arg === '--start')) {
  start();
}

module.exports = {
  start,
};

async function start({ tunnelUrl } = {}) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Init Nuxt.js
  const app = await nuxt.loadNuxt(isDev ? 'dev' : 'start');

  // Build only in dev mode.
  // In production mode, the app should be built before starting the server.
  if (isDev) {
    await nuxt.build(app);
  }

  await app.listen(app.options.server.port);

  // If the server was started with a tunnel (e.g. ngrok) pointing to it, display
  // the tunnel url in the banner for convenience.
  if (tunnelUrl) {
    app.options.cli.badgeMessages = [...app.options.cli.badgeMessages, `Tunnel URL: ${tunnelUrl}`];
  }

  // Show the server banner. Bit of a hack to use `showBanner` from the Nuxt CLI package,
  // but not really another way to do it via Nuxt programmatically.
  showBanner(app);
}
