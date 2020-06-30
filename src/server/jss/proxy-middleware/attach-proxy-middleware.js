// NOTE: swap nuxt-specific proxy middleware with your own
const { getProxyMiddleware } = require('./nuxt-jss-proxy-middleware');

module.exports = {
  attachProxyMiddleware,
};

function attachProxyMiddleware(server, { jssConfig, isDevEnv }) {
  const middleware = getProxyMiddleware({
    jssConfig,
    isDevEnv,
  });

  server.use(middleware);
}
