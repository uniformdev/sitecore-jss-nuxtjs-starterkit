module.exports = {
  getJssRenderingHostMiddleware,
};

function getJssRenderingHostMiddleware({ app, jssConfig } = {}) {
  return async function middleware(req, res) {
    req.setTimeout(36000, () => {
      console.error('request timed out');
    });

    try {
      const jssData = resolveJssData(req);

      // Server rendering functions expect `GET` requests, but we're handling a `POST` request.
      // so change the incoming request method.
      req.method = 'GET';
      // nuxt.js reads from the req.url property, so set it accordingly
      req.url = jssData.renderPath;

      console.log('rendering host handling request', req.url);

      // Allows the app to easily determine whether or not it is being rendered via JSS rendering host.
      req.isJssRenderingHostRequest = true;
      // Attach the parsed JSS data as an arbitrary property on the `req` object
      req.jssData = jssData;
      // Attach the JSS config values. These should be the _remote_ `sitecoreApiHost`, `sitecoreApiKey`,
      // and `sitecoreSiteName` values, not necessarily the same as the generated values from `temp/config.js`.
      // This allows us to override the generated config values at runtime. Otherwise, when the app is
      // served by the Sitecore server, the JSS app may be making layout service/dictionary service requests
      // to the `sitecoreApiHost` value specified in `temp/config.js`. And that value could be,
      // for example, `localhost:3000` if running the app in disconnected mode. That could result in
      // CORS errors and unexpected data. So, we provide the remote/"connected" mode config values so the app can
      // use those if/when necessary.
      if (jssConfig) {
        req.jssConfig = jssConfig;
      }

      const routeInfo = {
        pathname: jssData.renderPath,
      };

      // render app and return
      // renderResult is an object: { html, error, redirected }
      // The object passed as the second argument to `renderRoute` will be added to the
      // Nuxt SSR `renderContext` object. The `req` and `res` properties are required, but
      // you can also add custom properties, e.g. `isJssRenderingHostRequest`, that will
      // be available anywhere you have access to the SSR `renderContext` object.
      const renderResult = await app.renderRoute(routeInfo.pathname, {
        req,
        res,
        isJssRenderingHostRequest: true,
      });

      // TODO: need to handle 404 and/or redirect
      if (renderResult.error) {
        console.error(renderResult.error);
      }
      // TODO: need to handle 404 and/or redirect
      if (renderResult.redirected) {
        console.log('redirected', renderResult.redirected);
      }

      res.send({
        html: renderResult.html,
        status: 200,
        redirect: '',
      });
    } catch (err) {
      console.error(err);
      res.send({
        html: `<html><body>JSS app rendering error: ${err}</body></html>`,
        status: 500,
        redirect: '',
      });
    }
  };
}

function resolveJssData(req) {
  // We assume req.body has already been parsed as JSON via something like `body-parser` middleware.
  const invocationInfo = req.body;

  // By default, the JSS server invokes this route with the following body data structure:
  // {
  //   id: 'JSS app name',
  //   args: ['route path', 'serialized layout data object', 'serialized viewbag object'],
  //   functionName: 'renderView',
  //   moduleName: 'server.bundle'
  // }

  const result = {
    route: null,
    viewBag: null,
    renderPath: '',
  };

  if (!invocationInfo || !invocationInfo.args || !Array.isArray(invocationInfo.args)) {
    return result;
  }

  result.renderPath = invocationInfo.args[0];

  if (invocationInfo.args.length > 0 && invocationInfo.args[1]) {
    result.route = tryParseJson(invocationInfo.args[1]);
  }

  if (invocationInfo.args.length > 1 && invocationInfo.args[2]) {
    result.viewBag = tryParseJson(invocationInfo.args[2]);
  }

  return result;
}

function tryParseJson(jsonString) {
  try {
    const json = JSON.parse(jsonString);
    // handle non-exception-throwing cases
    if (json && typeof json === 'object' && json !== null) {
      return json;
    }
  } catch (e) {
    console.error(`error parsing json string '${jsonString}'`, e);
  }

  return null;
}
