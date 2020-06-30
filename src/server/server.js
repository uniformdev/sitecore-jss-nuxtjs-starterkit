const express = require('express');
const consola = require('consola');
const { Nuxt, Builder } = require('nuxt');
const cors = require('cors');
const compression = require('compression');

// Import Nuxt.js config
const nuxtConfig = require('../nuxt.config.js');

// Import JSS scripts and config
const { attachJssServices } = require('./jss/attach-jss-services');

// Import server configuration
const serverConfig = require('./server.config');

const serverUrl = serverConfig.resolveServerUrl();
const publicServerUrl = serverConfig.resolvePublicServerUrl();

// Import Uniform setup
const { attachUniformServices } = require('../uniform/server/attach-uniform-services');

const jssMode = process.env.JSS_MODE || 'connected';
const dev = process.env.NODE_ENV !== 'production';

start();

// TODO: align with new programmatic usage example: https://nuxtjs.org/api/nuxt
async function start() {
  // Init Nuxt.js
  if (dev) {
    nuxtConfig.dev = true;
  }
  const app = new Nuxt(nuxtConfig);

  // Build only in dev mode.
  // In production mode, the app should be built before starting the server.
  if (dev) {
    const builder = new Builder(app);
    await builder.build();
  } else {
    await app.ready();
  }

  // Create the Express.js instance
  const server = express();

  // Attach compression middleware to ensure responses are gzip compressed.
  server.use(compression());
  // Attach CORS middleware to ensure the server allows CORS requests.
  server.use(cors());
  // Attach static asset handler
  server.use(express.static('static'));

  // Attach Uniform-specific middleware / functionality to the server.
  // IMPORTANT: be sure to attach Uniform middleware prior to any JSS proxy
  // middleware or other middleware that uses a "catch-all" handler, e.g. `server.use('*')`.
  // Otherwise, requests for Uniform services will be handled by the catch-all. This is
  // likely true for any other non-Uniform middleware you attach as well.
  attachUniformServices(server);

  // Attach/enable/disable any JSS services.
  await attachJssServices(server, app, {
    disconnectedMode: {
      enabled: jssMode === 'disconnected',
    },
    proxy: {
      enabled: jssMode !== 'disconnected',
      isDevEnv: dev,
    },
    renderingHost: {
      enabled: true,
      renderingHostPublicUrl: publicServerUrl.url || serverUrl.url,
    },
  });

  console.log('registering catch-all');
  // Assign default Nuxt request handler, this _should_ handle any requests
  // not handled by JSS disconnected mode services or rendering host.
  server.get('*', (req, res, next) => {
    // make the console a little less noisy
    if (!req.url.startsWith('/_nuxt') && !req.url.startsWith('/__webpack_hmr')) {
      console.log('nuxt app handling request', req.url);
    }

    // We add a custom property to the `res` object with the status code received in the proxy response.
    // This allows us to render an error within the app. Otherwise, the app (at least in the case of Nuxt),
    // will set the status code to 200 by default and only change it if an error occurs during render.

    // TODO: revisit this
    // res.actualStatusCode = res.statusCode;

    return app.render(req, res, next);
  });

  // Start the server
  server.listen(serverConfig.resolveListeningPort());
  consola.ready({
    message: `Server listening on ${serverUrl.url}`,
    badge: true,
  });
}
