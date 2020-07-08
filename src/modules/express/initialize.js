const express = require('express');
const compression = require('compression');

module.exports = initialize;

// Nuxt uses `connect` as a server when starting a Nuxt app.
// This module "hacks" around the use of connect by injecting an `express` server
// instance into the Nuxt server instance just prior to server startup, i.e.
// in the `render:before` hook.
function initialize(moduleOptions) {
  // Nuxt config is available via `this.options`
  const nuxtConfig = this.options;

  this.nuxt.hook('render:before', async (nuxtServer) => {
    // `connect` has a `stack` property that Nuxt uses for removing/replacing middleware.
    // `express` has a similar property but it is on the Express `router` object that is attached
    // to an express instance.
    // For compatibility, we use the Express `lazyrouter` method to ensure the `server._router`
    // property is initialized and defined. Then we add a `stack` property to the Express server
    // object and assign the Express router.stack property.
    // This seems to be sufficient to satisfy the Nuxt usage of connect.
    const expressApp = express();
    expressApp.lazyrouter();
    expressApp.stack = expressApp._router.stack;

    // Add compression middleware.
    expressApp.use(compression());

    // Disable built-in Nuxt/connect compressor. Nuxt only activates compression for production mode.
    // We want to enable compression regardless of mode for consistency. In particular, there may
    // be other middleware that modify the response headers and content length.
    nuxtConfig.render = {
      ...nuxtConfig.render,
      compressor: null,
    };

    // Assign the Express server/app to the `app` property on the Nuxt server instance. This will
    // replace the default `connect` app created by Nuxt.
    nuxtServer.app = expressApp;
  });
}
