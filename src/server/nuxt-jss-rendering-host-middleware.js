module.exports = {
  getJssRenderingHostMiddleware,
};

function getJssRenderingHostMiddleware(app, scJssConfig, { serverUrl = '', routeResolver }) {
  return async function middleware(req, res) {
    console.log('rendering host handling request', req.url);
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
      // Allows the app to easily determine whether or not it is being rendered via JSS rendering host.
      req.isJssRenderingHostRequest = true;
      // Attach the parsed JSS data as an arbitrary property on the `req` object
      req.jssData = jssData;
      // Attach the JSS config values. This should contain the _remote_ `layoutServiceHost` value directly
      // from `scjssconfig.json` (or tokenized value or similar), not the generated values from `temp/config.js`.
      // This allows us to override the generated config values at runtime. Otherwise, when the app is
      // served by the Sitecore server, the JSS app may be making layout service/dictionary service requests
      // to the `sitecoreApiHost` value specified in `temp/config.js`. And that value could be,
      // for example, `localhost:3000` if running the app in disconnected mode. That could result in
      // CORS errors and unexpected data. So, we provide the remote/"connected" mode config values so the app can
      // use those when necessary.
      if (scJssConfig) {
        req.jssConfig = {
          sitecoreApiKey: scJssConfig.sitecore.apiKey,
          sitecoreApiHost: scJssConfig.sitecore.layoutServiceHost,
        };
      }

      if (serverUrl) {
        // If a serverUrl has been specified (which it almost always should), then
        // we need to ensure that asset URLs are prefixed with the serverUrl.
        handleAssetPrefixStuff(app);
      }

      let routeInfo = {
        pathname: jssData.renderPath,
      };

      // If we have a custom route resolver, then call it with the incoming path and query/param data.
      // The custom route resolver can then handle mapping route path to actual path.
      // This is mostly useful for "dynamic" routes, where a single page (e.g. pages/index.js) is intended
      // to serve routes that aren't statically known by the app. For instance, Sitecore routes that are dynamic.
      if (routeResolver && typeof routeResolver === 'function') {
        routeInfo = routeResolver(routeInfo);
      }

      // render app and return
      // renderResult is an object: { html, error, redirected }
      const renderResult = app.renderRouteWithAssetPrefix
        ? await app.renderRouteWithAssetPrefix(routeInfo.pathname, { req, res, serverUrl })
        : await app.renderRoute(routeInfo.pathname, { req, res });

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

function handleAssetPrefixStuff(app) {
  // If a serverUrl has been specified (which it almost always should), then
  // we need to ensure that asset URLs are prefixed with the serverUrl.
  // By default, Nuxt will emit asset URLs using the `publicPath` value as the path to assets.

  // Unfortunately, Nuxt does not provide a great mechanism to set `publicPath` on a per-request basis.
  // The `publicPath` can only be set at build time or at app start time.
  // The issue stems from this function in the `vue-ssr-renderer` package:
  // https://github.com/vuejs/vue/blob/e8ca21ff1d7af92649902952c97418ad3ffd014f/src/server/template-renderer/index.js#L86
  // That function binds the `renderStyles` and `renderScripts` methods of the Vue SSR `renderContext`
  // object to the `TemplateRenderer` instance, and we can't get access to the `TemplateRenderer` instance
  // at runtime.

  // The workaround we use is to tap into the `render:resourcesLoaded` hook to set the `publicPath`
  // value at app start time. This works for assets that are emitted during SSR, but doesn't
  // work for assets that are dynamically loaded in the client, e.g. async webpack chunks.
  // So, to workaround the client issue, we set a custom window variable, `__nuxt_public_path__` that
  // is then used by a webpack plugin `webpack-require-from` to prefix client/runtime webpack
  // assets with the `__nuxt_public_path__` value.

  // Example:
  // <script src="/_nuxt/app.js" />
  // will become
  // <script src="http://localhost:3000/_nuxt/app.js" />

  // This will allow the caller (Sitecore) to render the HTML we return and assets will
  // be served by the Nuxt.js server.

  // NOTE: this approach does _not_ affect static assets in the `static` folder nor
  // any assets that are `import`-ed within components. You'll have to use
  // another mechanism to prefix those types of assets with the serverUrl.

  app.renderRouteWithAssetPrefix = async (route, { req, res, serverUrl }) => {
    // To help the "other mechanism" mentioned above, we also attach an arbitrary property
    // to the `req` object that can then be used within the `asyncData` method of components or pages
    // to provide a value that can be used for static asset URLs.
    // NOTE: this is a runtime-generated value, so using it for webpack builds isn't feasible.
    req.assetPrefix = serverUrl;

    const renderResult = await app.renderRoute(route, {
      req,
      res,
    });

    // For JSS rendering host requests, the webpack runtime needs the value of `publicPath`
    // to be the URL of our Nuxt server. However, this value isn't known until runtime, so we
    // construct the URL for our Nuxt server and inject it as `window.__nuxt_public_path__` property
    // into the outgoing HTML for the rendering host request. Then we use the webpack-require-from
    // plugin to instruct Webpack to read from the `window.__nuxt_public_path__` variable.
    // This allows requests for async webpack chunks to succeed because they'll use the absolute
    // URL to our Nuxt server instead of a relative path that will resolve to the Sitecore server.
    renderResult.html = renderResult.html.replace(
      '</head>',
      `<script>window.__nuxt_public_path__ = '${serverUrl}${app.renderer.publicPath}';</script></head>`
    );

    return renderResult;
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
