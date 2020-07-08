const nodePath = require('path');
const { configureRouter } = require('./configure-router');

module.exports = initialize;

function initialize({ dataFetcherType } = {}) {
  if (!dataFetcherType) {
    throw new Error('JSS Standard module must be initialized with a `dataFetcherType` specified.');
  }
  // Add JSS data-fetcher module
  this.addModule(['~/modules/jss/data-fetcher/initialize', { dataFetcherType }]);

  // Add JSS Placeholder plugin
  this.addPlugin(nodePath.resolve(__dirname, 'sitecore-jss-placeholder-plugin.js'));

  // Add JSS Config plugin
  this.addPlugin(nodePath.resolve(__dirname, 'sitecore-jss-config-runtime-plugin.js'));

  const nuxtConfig = this.options;

  // Configure JSS router customizations.
  configureRouter(nuxtConfig);

  const nuxtApp = this.nuxt;

  // IMPORTANT: Other JSS plugins may be dependent on the data fetcher and/or config plugins,
  // so we need to ensure that those plugins are installed before any other
  // JSS plugins. Unfortunately, Nuxt modules do not "push" plugins into the plugins
  // array. Instead, when calling `this.addPlugin` from a module, a plugin is added
  // to the  "front" of the array, i.e. `unshift`.
  // The current Nuxt-recommended approach for guaranteeing plugin install order is
  // to use the `extendPlugins` hook or `extendPlugins` config option:
  // https://nuxtjs.org/api/configuration-extend-plugins
  nuxtApp.hook('builder:extendPlugins', (plugins) => {
    const dataFetcherPluginIndex = plugins.findIndex(
      (plugin) => plugin.src.indexOf('data-fetcher-plugin') !== -1
    );

    if (dataFetcherPluginIndex !== -1) {
      const dataFetcherPlugin = plugins[dataFetcherPluginIndex];
      plugins.splice(dataFetcherPluginIndex, 1);
      plugins.unshift(dataFetcherPlugin);
    }

    const configPluginIndex = plugins.findIndex(
      (plugin) => plugin.src.indexOf('jss-config-runtime-plugin') !== -1
    );

    if (configPluginIndex !== -1) {
      const configPlugin = plugins[configPluginIndex];
      plugins.splice(configPluginIndex, 1);
      plugins.unshift(configPlugin);
    }
  });
}
