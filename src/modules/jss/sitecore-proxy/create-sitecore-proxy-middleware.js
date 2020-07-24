// Heavily inspired by `node-http-proxy`:

// https://github.com/http-party/node-http-proxy/blob/master/lib/http-proxy/passes/web-incoming.js
// https://github.com/http-party/node-http-proxy/blob/master/lib/http-proxy/common.js

const httpNative = require('http');
const httpsNative = require('https');
const followRedirects = require('follow-redirects');

const { handleProxyResponse } = require('./handle-proxy-response');

const upgradeHeader = /(^|,)\s*upgrade\s*($|,)/i;
const isSSL = /^https|wss/;

module.exports = {
  createSitecoreProxyMiddleware,
};

function createSitecoreProxyMiddleware({
  jssConfig,
  layoutServiceRouteResolver,
  doNotProxyResolver,
  shouldDirectProxyResolver,
  options: createProxyOptions,
}) {
  if (!jssConfig) {
    throw new Error('jssConfig must be provided for proxy middleware');
  }
  if (!layoutServiceRouteResolver) {
    throw new Error('layoutServiceRouteResolver must be provided for proxy middleware');
  }

  return async (req, res, next) => {
    // Determine if request should be proxied. If not, abort.
    if (doNotProxyResolver && doNotProxyResolver(req)) {
      next();
      return;
    }

    // `proxyOptions.target` must be a node WHATWG URL object
    // https://nodejs.org/docs/latest-v13.x/api/url.html#url_the_whatwg_url_api
    const proxyOptions = {
      // timeout (in milliseconds) for outgoing proxy requests
      proxyTimeout: 60000,
      // add any SSL/TLS-specific request options, includes everything = require(http.request() as well
      // as tls.connect().
      // https://nodejs.org/docs/latest-v13.x/api/https.html#https_https_request_url_options_callback
      // sslRequestOptions: {},

      // When making POST requests, we disable follow redirects (for now) so that cookies
      // = require(the _first_ response are preserved. We may need to revisit this and use
      // a separate library for making requests - a library that will merge/preserve cookies
      // as it follows redirects.
      disableFollowRedirects: req.method === 'POST',

      // onProxyReq: (req, res, resolvedProxyRequestOptions),
      // method: 'GET',
      // disableXForwardHeaders: false,
      // headers: {},
      // disableChangeOrigin: false,
      // auth: undefined,
      // agent: undefined,
      // localAddress: undefined,
      ...createProxyOptions,
    };

    if (shouldDirectProxyResolver && shouldDirectProxyResolver(req)) {
      console.log('Directly proxying request', req.url);
      proxyOptions.target = new URL(`${jssConfig.sitecoreApiHost}${req.url}`);

      // When the incoming request contains the layout service endpoint URL, we
      // want to identify it as a layout service request so that the layout service
      // response data can be modified by a custom `modifyLayoutServiceData` (if provided).
      // For those types of layout service requests, we want to send the (possibly modified)
      // layout service data and end the response.
      // However, we're also making layout service proxy requests during SSR by converting
      // an incoming "page request", i.e. `/about` into a layout service request so that
      // the layout service data is available for app rendering. For those types of layout
      // service requests, we want to make the (possibly modified) layout service data
      // available to subsequent middleware or consumers and _not_ end the response.
      // So we set `isChainable=false` when we want the response to immediately be sent
      // and set `isChainable=true` when we want to be able to use the layout service data
      // later in the response.
      proxyOptions.isLayoutServiceProxy = req.url.startsWith('/sitecore/api/layout');
      proxyOptions.isChainable = false;
    } else {
      // Attempt to resolve the route using the provided routeResolver.
      const resolvedRoute = layoutServiceRouteResolver(req);
      if (!resolvedRoute || !resolvedRoute.params) {
        next();
        return;
      }

      console.log(
        `Request for route '${req.url}' will be converted and proxied to Layout Service request.`
      );

      // Parse the incoming request url so we can easily extract querystring parameters.
      const incomingRequestUrl = new URL(
        req.url,
        `${isEncryptedRequest(req) ? 'https' : 'http'}://${req.headers.host}`
      );

      // Any querystring parameters attached to the incoming request should be forwarded on to the proxy request.
      // We also add a few parameters that are resolved via resolved route and/or config.
      const targetQueryStringParams = new URLSearchParams(incomingRequestUrl.searchParams);
      const sitecoreRoute = ensureLeadingSlash(resolvedRoute.params.sitecoreRoute);
      targetQueryStringParams.set('item', sitecoreRoute);
      targetQueryStringParams.set('sc_apikey', jssConfig.sitecoreApiKey);
      targetQueryStringParams.set('sc_site', jssConfig.sitecoreSiteName);
      if (resolvedRoute.params.language) {
        targetQueryStringParams.set('sc_lang', resolvedRoute.params.language);
      }

      // assemble the proxy target URL
      proxyOptions.target = new URL(
        `${
          jssConfig.sitecoreApiHost
        }/sitecore/api/layout/render/jss?${targetQueryStringParams.toString()}`
      );
      proxyOptions.isLayoutServiceProxy = true;
      proxyOptions.isChainable = true;
    }

    try {
      await invokeProxy(req, res, proxyOptions);

      // We only want to invoke the next middleware in the chain when we proxy Layout Service requests.
      // Responses for requests that are directly proxied to Sitecore will be piped directly
      // to the outgoing response, so trying to invoke more middleware for those requests/responses
      // will likely error because the response headers will have been sent and the response ended.
      if (proxyOptions.isChainable) {
        next();
      }
    } catch (err) {
      next(err);
    }
  };
}

async function invokeProxy(req, res, options) {
  // Request initalization
  const proxyReqOptions = createOutgoingRequestOptions(options, req);

  // Enable developers to modify the proxyReq before it is sent
  if (options.onProxyReq && typeof options.onProxyReq === 'function') {
    await options.onProxyReq(req, res, proxyReqOptions);
  }

  const agents = options.disableFollowRedirects
    ? { http: httpNative, https: httpsNative }
    : followRedirects;

  console.log('Sending proxy request', proxyReqOptions.host, proxyReqOptions.path);

  const proxyReq = (isSSL.test(options.target.protocol) ? agents.https : agents.http).request(
    proxyReqOptions
  );

  // allow outgoing request to timeout
  if (options.proxyTimeout) {
    proxyReq.setTimeout(options.proxyTimeout, function () {
      proxyReq.abort();
    });
  }

  return new Promise((resolve, reject) => {
    // Ensure we abort proxy if request is aborted
    req.on('aborted', function () {
      proxyReq.abort();
      reject(new Error(`Incoming request aborted: ${req.url}`));
    });

    // handle errors in proxy and incoming request
    const errorHandler = createErrorHandler(proxyReq, options.target);
    req.on('error', errorHandler);
    proxyReq.on('error', errorHandler);

    function createErrorHandler(proxyReq, url) {
      return function proxyError(err) {
        // todo: consider enhancing the `err` object with more metadata, e.g. url
        if (req.socket.destroyed && err.code === 'ECONNRESET') {
          proxyReq.abort();
          return reject(new Error(err));
        }

        reject(err);
      };
    }

    // pipe the incoming request body (if it exists) to the proxy request body
    // note: pipe does not copy headers
    req.pipe(proxyReq);

    proxyReq.on('response', function (proxyRes) {
      if (!res.headersSent) {
        resolve(handleProxyResponse(req, res, proxyRes, options));
        return;
      }

      // TODO: should this be an error/reject?
      resolve(
        'Proxy response completed, but outgoing response headers were already sent. This indicates that the outgoing response was completed/ended before the proxy response was received. Perhaps a result of async/promise code not being awaited/handled.'
      );
    });
  });
}

// Create a "clone" of the incoming request. The "clone" will be sent to the target (Sitecore) host.
function createOutgoingRequestOptions(options, req) {
  const outgoingOptions = {};

  // use default port numbers if no port number provided
  outgoingOptions.port = options.target.port || (isSSL.test(options.target.protocol) ? 443 : 80);
  outgoingOptions.host = options.target.host;

  outgoingOptions.method = options.method || req.method;

  // create a shallow copy of req.headers to avoid mutating original headers
  outgoingOptions.headers = Object.assign({}, req.headers);

  // add x-forwarded-for headers
  if (!options.disableXForwardHeaders) {
    const xForwardedValues = {
      for: req.socket.remoteAddress || req.connection.remoteAddress,
      proto: isEncryptedRequest(req) ? 'https' : 'http',
    };

    ['for', 'proto'].forEach(function (header) {
      outgoingOptions.headers['x-forwarded-' + header] =
        (outgoingOptions.headers['x-forwarded-' + header] || '') +
        (outgoingOptions.headers['x-forwarded-' + header] ? ',' : '') +
        xForwardedValues[header];
    });
  }

  if (options.headers) {
    Object.assign(outgoingOptions.headers, options.headers);
  }

  if (!options.disableChangeOrigin) {
    outgoingOptions.headers.host = !hasPort(outgoingOptions.host)
      ? outgoingOptions.host + ':' + outgoingOptions.port
      : outgoingOptions.host;
  }

  if (options.auth) {
    outgoingOptions.auth = options.auth;
  }

  outgoingOptions.agent = options.agent || false;
  outgoingOptions.localAddress = options.localAddress;

  //
  // Remark: If we are false and not upgrading, set the connection: close. This is the right thing to do
  // as node core doesn't handle this COMPLETELY properly yet.
  //
  if (!outgoingOptions.agent) {
    outgoingOptions.headers = outgoingOptions.headers || {};
    if (
      typeof outgoingOptions.headers.connection !== 'string' ||
      !upgradeHeader.test(outgoingOptions.headers.connection)
    ) {
      outgoingOptions.headers.connection = 'close';
    }
  }

  // http.request().path expects pathname + querystring
  // URL.search contains the `?` character and querystring values are automatically url-encoded
  outgoingOptions.path = options.target.pathname + options.target.search;

  if (isSSL.test(options.target.protocol)) {
    // copy any TLS-specific properties that exist on the `sslRequestOptions` object
    Object.assign(outgoingOptions, options.sslRequestOptions);
  }

  return outgoingOptions;
}

/**
 * Check the host and see if it potentially has a port in it (keep it simple)
 *
 * @returns {Boolean} Whether we have one or not
 *
 * @api private
 */
function hasPort(host) {
  return host.indexOf(':') !== -1;
}

/**
 * Check if the request is an encrypted request.
 *
 * @param {Request} req Incoming HTTP request.
 *
 * @return {Boolean} Whether the connection is encrypted or not.
 *
 * @api private
 */
function isEncryptedRequest(req) {
  // `isSpdy` property is a custom property added by `spdy` module (if used): https://www.npmjs.com/package/spdy
  // `encrypted` property is only present on TLS socket: https://nodejs.org/docs/latest-v13.x/api/tls.html#tls_tlssocket_encrypted
  return Boolean(req.isSpdy || req.socket.encrypted);
}

// note: if `str` is undefined, no leading slash will be applied/returned.
function ensureLeadingSlash(str) {
  if (str && !str.startsWith('/')) {
    return `/${str}`;
  }
  return str;
}
