// https://nuxtjs.org/guide/modules#write-a-basic-module
const { getDisconnectedModeMiddlewares } = require('./getDisconnectedModeMiddlewares');
const { getConfig } = require('../../../temp/config');

module.exports = initialize;

async function initialize(moduleOptions) {
  if (!moduleOptions.enabled) {
    return;
  }

  const middlewares = await getDisconnectedModeMiddlewares({
    jssConfig: getConfig(),
  });

  middlewares.forEach((middleware) => {
    this.addServerMiddleware(middleware);
  });
}
