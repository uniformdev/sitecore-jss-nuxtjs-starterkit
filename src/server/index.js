const express = require('express');
const consola = require('consola');
const { Nuxt, Builder } = require('nuxt');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const Router = require('vue-router');
const nodePath = require('path');
const { attachUniformServicesToServer } = require('@uniformdev/common-server');
const { NuxtBuildAndExportEngine } = require('@uniformdev/nuxt-server');
const { createPublishProvider } = require('@uniformdev/publishing-all');

// Process values provided in `.env` file(s)
const uniformConfig = require('../uniform.config').getUniformServerConfig();
console.log('site name', uniformConfig.UNIFORM_API_SITENAME);

// Import Nuxt.js config
const nuxtConfig = require('../nuxt.config.js');

// Import JSS scripts and config
const { getJssRenderingHostMiddleware } = require('./nuxt-jss-rendering-host-middleware');
// const { attachDisconnectedServices } = require('./disconnected-mode-middleware');
const { attachProxyMiddleware } = require('./proxy-middleware');
const scJssConfig = require('../scjssconfig.json');
const packageConfig = require('../package.json');
scJssConfig.jssAppName = packageConfig.config.appName;

// Import a logger
const { consoleLogger } = require('../utils/logging/consoleLogger');

// Resolve values
const { resolveServerUrls } = require('./util');

const {
  server: { parts: serverUrlParts, url: serverUrl },
  tunnel: { url: tunnelUrl },
} = resolveServerUrls();

const jssMode = process.env.JSS_MODE || 'connected';
const dev = process.env.NODE_ENV !== 'production';

start();

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

  // Setup body parsing middleware for incoming POST requests. This is used
  // primarily for JSS rendering host.
  const jsonBodyParser = bodyParser.json({ limit: '2mb' });

  // Setup the JSS rendering host route.
  // The URL that is called is configured via JSS app config, e.g. `<app serverSideRenderingEngineEndpointUrl="" />`
  server.post(
    '/jss-render',
    jsonBodyParser,
    getJssRenderingHostMiddleware(app, scJssConfig, {
      serverUrl: tunnelUrl || serverUrl,
    })
  );

  // Attach Uniform-specific middleware / functionality to the server.
  // IMPORTANT: be sure to attach Uniform middleware prior to any JSS proxy
  // middleware or other middleware that uses a "catch-all" handler, e.g. `server.use('*')`.
  // Otherwise, requests for Uniform services will be handled by the catch-all. This is
  // likely true for any other non-Uniform middleware you attach as well.
  attachUniformServices(server, uniformConfig);

  if (jssMode === 'disconnected') {
    // Setup JSS disconnected mode support.
    // Only attach this when starting in `disconnected` mode. In any other mode, we don't
    // need the disconnected layout service, dictionary service, media service.
    // attachDisconnectedServices(server);
  } else {
    // Attach connected mode services, e.g. proxy middleware
    attachConnectedModeServices(server);
  }

  // Assign default Nuxt request handler, this _should_ handle any requests
  // not handled by JSS disconnected mode services or rendering host.
  server.use((req, res, next) => {
    // make the console a little less noisy
    if (!req.url.startsWith('/_nuxt') && !req.url.startsWith('/__webpack_hmr')) {
      console.log('nuxt app handling request', req.url);
    }

    // We add a custom property to the `res` object with the status code received in the proxy response.
    // This allows us to render an error within the app. Otherwise, the app (at least in the case of Nuxt),
    // will set the status code to 200 by default and only change it if an error occurs during render.
    res.actualStatusCode = res.statusCode;

    return app.render(req, res, next);
  });

  // Start the server
  server.listen(serverUrlParts.port, serverUrlParts.hostname);
  consola.ready({
    message: `Server listening on ${serverUrl}`,
    badge: true,
  });
}

function attachConnectedModeServices(server) {
  attachProxy(server);
}

function attachProxy(server) {
  // Obtain a list of the configured Sitecore routes for the app.
  // These route patterns are currently defined in nuxt.config.js via the `router.extendRoutes` property.
  const routes = [];
  nuxtConfig.router.extendRoutes(routes, nodePath.resolve);
  const router = new Router({
    mode: 'abstract',
    routes,
  });

  const layoutServiceRouteResolver = (req) => {
    const match = router.match(req.url);
    const defaultRoute = {
      params: {
        sitecoreRoute: '/',
      },
    };

    if (!match || !match.params) {
      return defaultRoute;
    }

    if (!match.params.sitecoreRoute) {
      match.params.sitecoreRoute = defaultRoute.params.sitecoreRoute;
    }

    return match;
  };

  attachProxyMiddleware({
    server,
    jssConfig: scJssConfig,
    isDevEnv: dev,
    layoutServiceRouteResolver,
  });
}

// Setup Uniform config and attach Uniform-specific middleware to the existing server.
function attachUniformServices(server, uniformServerConfig) {
  const buildAndExportEngine = new NuxtBuildAndExportEngine(uniformServerConfig);

  const options = {
    uniformServerConfig,
    publishProvider: createPublishProvider(),
  };

  attachUniformServicesToServer(server, buildAndExportEngine, consoleLogger, options);
}
