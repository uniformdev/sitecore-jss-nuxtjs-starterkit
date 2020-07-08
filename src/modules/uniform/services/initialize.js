const fs = require('fs');
const {
  attachUniformServicesToServer,
  parseUniformServerConfig,
} = require('@uniformdev/common-server');
const {
  NuxtBuildAndExportEngine,
  config: getUniformNuxtConfig,
} = require('@uniformdev/nuxt-server');
const { createPublishProvider } = require('@uniformdev/publishing-all');

// Import a logger
const { consoleLogger } = require('./logging/consoleLogger');

module.exports = initialize;

function initialize(moduleOptions) {
  if (!moduleOptions.enabled) {
    return;
  }

  // In Nuxt modules, the current Nuxt instance is available via `this.nuxt`.
  const nuxtApp = this.nuxt;

  extendNuxtConfig(this.options);
  setupMiddleware(nuxtApp, moduleOptions);
}

function extendNuxtConfig(nuxtConfig) {
  const uniformNuxtConfig = getUniformNuxtConfig(consoleLogger);

  nuxtConfig.env = {
    ...nuxtConfig.env,
    ...uniformNuxtConfig.env,
  };

  nuxtConfig.generate = {
    ...nuxtConfig.generate,
    routes: uniformNuxtConfig.generate.routes,
  };
}

function setupMiddleware(nuxtApp, moduleOptions) {
  // We use the `render:setupMiddleware` Nuxt hook instead of `this.addMiddleware` because using
  // `this.addMiddleware` results in a `server.use(middleware)` call. However, for Uniform services,
  // we only want to register middleware for specific request methods and paths.
  // NOTE: the `render:setupMiddleware` hook is fired before any other middleware are registered.
  nuxtApp.hook('render:setupMiddleware', async (server) => {
    // Setup Uniform config and attach Uniform-specific middleware to the existing server.
    const uniformServerConfig = resolveUniformServerConfig(nuxtApp);

    const buildAndExportEngine = new NuxtBuildAndExportEngine(uniformServerConfig);

    const options = {
      uniformServerConfig,
      publishProvider: createPublishProvider(),
    };

    attachUniformServicesToServer(
      server,
      buildAndExportEngine,
      moduleOptions.logger || consoleLogger,
      options
    );
  });
}

function resolveUniformServerConfig(nuxtApp) {
  let uniformServerConfig;

  // Attempt to resolve a path to `src/uniform.config`
  const uniformConfigPath = nuxtApp.resolver.resolveAlias('~/uniform.config.js');

  // If `uniform.config.js` file exists, get config from there.
  if (fs.existsSync(uniformConfigPath)) {
    const uniformConfig = require(uniformConfigPath);
    // If the config module exports a `getUniformServerConfig` function, call it.
    if (typeof uniformConfig.getUniformServerConfig === 'function') {
      uniformServerConfig = uniformConfig.getUniformServerConfig();
    } else {
      // Otherwise, assume the config module exports a config object.
      uniformServerConfig = uniformConfig;
    }
  } else {
    // Otherwise, use `parseUniformServerConfig` method from Uniform library to
    // resolve config from environment variables.
    uniformServerConfig = parseUniformServerConfig(process.env);
  }

  return uniformServerConfig;
}
