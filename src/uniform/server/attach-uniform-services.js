const { attachUniformServicesToServer } = require('@uniformdev/common-server');
const { NuxtBuildAndExportEngine } = require('@uniformdev/nuxt-server');
const { createPublishProvider } = require('@uniformdev/publishing-all');

// Get Uniform config
const uniformConfig = require('../../uniform.config');

// Import a logger
const { consoleLogger } = require('../logging/consoleLogger');

module.exports = {
  attachUniformServices,
};

// Setup Uniform config and attach Uniform-specific middleware to the existing server.
function attachUniformServices(server, { uniformServerConfig, logger } = {}) {
  const resolvedUniformServerConfig = uniformServerConfig || uniformConfig.getUniformServerConfig();
  const buildAndExportEngine = new NuxtBuildAndExportEngine(resolvedUniformServerConfig);

  const options = {
    uniformServerConfig: resolvedUniformServerConfig,
    publishProvider: createPublishProvider(),
  };

  attachUniformServicesToServer(server, buildAndExportEngine, logger || consoleLogger, options);
}
