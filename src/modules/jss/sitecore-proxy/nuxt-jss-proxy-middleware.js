const Router = require('vue-router');
const nodePath = require('path');

const { createSitecoreProxyMiddleware } = require('./create-sitecore-proxy-middleware');
const { getProxyConfiguration } = require('./default-proxy-configuration');

module.exports = {
  getProxyMiddleware,
};

function getProxyMiddleware({ jssConfig, isDevEnv, nuxtConfig }) {
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

  const proxyConfig = getProxyConfiguration({
    jssConfig,
    isDevEnv,
    layoutServiceRouteResolver,
    doNotProxyPrefixesList: ['/_nuxt', '/__webpack_hmr', '/_loading/sse'],
  });

  const proxyMiddleware = createSitecoreProxyMiddleware(proxyConfig);

  return proxyMiddleware;
}
