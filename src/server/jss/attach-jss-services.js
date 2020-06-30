const { attachJssRenderingHostMiddleware } = require('./rendering-host');
const jssConfigRenderingHost = require('../../temp/jss-config-rendering-host')();
const { attachDisconnectedServices } = require('./disconnected-mode');
const jssConfigDisconnectedMode = require('../../temp/config.cjs');
const { attachProxyMiddleware } = require('./proxy-middleware');
const jssConfigSitecoreProxy = require('../../temp/jss-config-sitecore-proxy')();

module.exports = {
  attachJssServices,
};

/**
 * @typedef {Object} DisconnectedModeOptions
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} RenderingHostOptions
 * @property {boolean} enabled
 * @property {string} renderingHostPublicUrl
 */

/**
 * @typedef {Object} ProxyOptions
 * @property {boolean} enabled
 * @property {boolean} isDevEnv
 */

/**
 * @typedef {Object} JssServices
 * @property {DisconnectedModeOptions} disconnectedMode
 * @property {RenderingHostOptions} renderingHost
 * @property {ProxyOptions} proxy
 */

/**
 * @param {*} server
 * @param {*} app
 * @param {JssServices} [{
 *     disconnectedMode = { enabled: false },
 *     renderingHost = { enabled: false },
 *     proxy = { enabled: false },
 *   }={
 *     disconnectedMode: { enabled: false },
 *     renderingHost: { enabled: false },
 *     proxy: { enabled: false },
 *   }]
 */
async function attachJssServices(
  server,
  app,
  {
    disconnectedMode = { enabled: false },
    renderingHost = { enabled: false },
    proxy = { enabled: false },
  } = {
    disconnectedMode: { enabled: false },
    renderingHost: { enabled: false },
    proxy: { enabled: false },
  }
) {
  if (disconnectedMode.enabled) {
    // Setup JSS disconnected mode
    const disconnectedConfig = { jssConfig: jssConfigDisconnectedMode };
    await attachDisconnectedServices(server, disconnectedConfig);
  }

  if (renderingHost.enabled) {
    // Setup the JSS rendering host middleware.
    const renderingHostConfig = {
      app,
      renderingHostPublicUrl: renderingHost.renderingHostPublicUrl,
      jssConfig: jssConfigRenderingHost,
    };
    attachJssRenderingHostMiddleware(server, renderingHostConfig);
  }

  if (proxy.enabled) {
    // Setup JSS proxy
    const proxyConfig = {
      jssConfig: jssConfigSitecoreProxy,
      isDevEnv: proxy.isDevEnv,
    };
    attachProxyMiddleware(server, proxyConfig);
  }
}
