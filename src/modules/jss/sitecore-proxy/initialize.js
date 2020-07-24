// NOTE: for some reason, using ES module syntax (import/export) didn't work for
// this file and subsequent imported files. Had to use CommonJS module syntax
// to prevent "invalid syntax" errors on Nuxt startup. Oddly, all other modules
// seem to work fine with ESM syntax. It wasn't worth investigating further.

const { getProxyMiddleware } = require('./nuxt-jss-proxy-middleware');
const { getConfig: getJssConfigSitecoreProxy } = require('../../../temp/jss-config-sitecore-proxy');

module.exports = initialize;

function initialize(moduleOptions) {
  if (!moduleOptions.enabled) {
    return;
  }

  // In Nuxt modules, `moduleOptions` is the object passed to the module via
  // the module declaration in `nuxt.config.js` file.
  const isDevEnv = moduleOptions.isDevEnv;

  // In Nuxt modules, Nuxt config (nuxt.config.js) is available via `this.options`.
  const nuxtConfig = this.options;

  const middleware = getProxyMiddleware({
    jssConfig: getJssConfigSitecoreProxy(),
    isDevEnv,
    nuxtConfig,
  });

  this.addServerMiddleware(middleware);
}
