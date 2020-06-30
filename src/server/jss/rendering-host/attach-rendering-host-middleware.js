const bodyParser = require('body-parser');
const { getJssRenderingHostMiddleware } = require('./nuxt-jss-rendering-host-middleware');

module.exports = {
  attachJssRenderingHostMiddleware,
};

function attachJssRenderingHostMiddleware(server, renderingHostConfig) {
  // We can't run rendering host without a JSS config because we need layout service host
  // and api key in order to override generated config in the temp folder.
  if (!renderingHostConfig.jssConfig) {
    console.warn(
      'JSS Rendering Host config was not provided, therefore JSS rendering host middleware is disabled.'
    );
    return;
  }

  // Setup body parsing middleware for incoming POST requests.
  const jsonBodyParser = bodyParser.json({ limit: '2mb' });

  // Setup the JSS rendering host route.
  // The URL that is called is configured via JSS app config, e.g. `<app serverSideRenderingEngineEndpointUrl="" />`
  server.post('/jss-render', jsonBodyParser, getJssRenderingHostMiddleware(renderingHostConfig));
}
