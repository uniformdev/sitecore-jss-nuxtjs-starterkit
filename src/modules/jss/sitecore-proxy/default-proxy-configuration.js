module.exports = {
  getProxyConfiguration,
};

function getProxyConfiguration({
  jssConfig,
  isDevEnv,
  layoutServiceRouteResolver,
  doNotProxyPrefixesList = [],
  shouldDirectProxyPrefixList = [],
}) {
  // These are _prefixes_ for routes that should not be proxied at all.
  const doNotProxyList = ['/static', '/fonts'].concat(doNotProxyPrefixesList);

  // These are _prefixes_ for routes that should be directly proxied to Sitecore.
  const shouldDirectProxyList = [
    '/sitecore/api',
    '/api',
    '/-/jssmedia',
    '/-/media',
    '/_/media',
    '/_/jssmedia',
    '/layouts/system',
  ].concat(shouldDirectProxyPrefixList);

  const proxyConfiguration = {
    // JSS configuration
    jssConfig,
    doNotProxyResolver: getDoNotProxyResolver(doNotProxyList),
    shouldDirectProxyResolver: getShouldProxyResolver(shouldDirectProxyList),

    // The `layoutServiceRouteResolver` function attempts to resolve a matching app route for the current request.
    // The match should return an object in the format: { params: { sitecoreRoute, language } }
    // Where `sitecoreRoute` is the value that will be used for the `item` parameter in a Layout Service request,
    // and `language` is the value that will be used for the `sc_lang` parameter in a Layout Service request.
    layoutServiceRouteResolver,

    options: {
      modifyCookies: getModifyCookies(isDevEnv),
      modifyLayoutServiceData: getModifyLayoutServiceData(),
      handleProxyRedirect: getHandleProxyRedirect(jssConfig),
    },
  };

  return proxyConfiguration;
}

function getDoNotProxyResolver(doNotProxyList) {
  // This function determines whether the proxy middleware should handle the request or not.
  // This function is executed before any other actions are performed so the request can
  // fall through to the next middleware as soon as possible.
  return (req) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return true;
    }
    const compareUrl = req.url.toLowerCase();
    const doNotProxy = doNotProxyList.some((prefix) => compareUrl.startsWith(prefix));
    return doNotProxy;
  };
}

function getShouldProxyResolver(shouldDirectProxyList) {
  // This function determines whether the proxy middleware should directly proxy the request
  // to the Sitecore host. Otherwise, it is assumed that the request should be transformed/rewritten
  // into a Layout Service request. This allows the proxy middleware to also proxy non-LayoutService
  // requests for GraphQL, Sitecore media library, and other Sitecore APIs.
  // This function is executed after `doNotProxyResolver` and before `layoutServiceRouteResolver`.
  return (req) => {
    const compareUrl = req.url.toLowerCase();
    return shouldDirectProxyList.some((prefix) => compareUrl.startsWith(prefix));
  };
}

function getModifyCookies(isDevEnv) {
  // This function allows you to modify the cookies that will be sent in the outgoing response.
  // `cookies` is an array of cookie objects, e.g. { name: '', value: '', domain: '', httpOnly: '', ...otherCookieProperties }
  // The `cookies` array and elements should be modified in place, no return value is
  // expected from this method.
  return (cookies, outgoingServerResponse, proxyResponse, proxyOptions) => {
    cookies.forEach((cookie) => {
      if (cookie.name === '.AspNet.Cookies') {
        if (isDevEnv) {
          // In development, we are making requests from an insecure origin, e.g. http://jss.local.dev
          // The `.AspNet.Cookies` cookie, however, is flagged as `Secure`, so it won't be set
          // for an insecure origin.
          // Therefore, when in development mode, we remove the `Secure` property from the cookie.
          cookie.secure = false;
        }
        // We may want to share the .AspNet.Cookies cookie across domains, so we
        // set the `domain` value.
        // NOTE: this should probably be set on the Sitecore server intead.
        // cookie.domain = '.mydomain.com';
      }
    });
  };
}

function getModifyLayoutServiceData() {
  // This function allows you to modify the Layout Service data received from a proxied layout
  // service request.
  // The `layoutServiceData` argument should be modified in place, no return value is expected
  // from this method.
  // IMPORTANT: Be mindful of what you do in this method. Modifying a large JSON object could
  // be expensive in terms of performance.
  // return (
  //   layoutServiceData,
  //   incomingRequest,
  //   outgoingServerResponse,
  //   proxyResponse,
  //   proxyOptions
  // ) => {};
  return undefined;
}

function getHandleProxyRedirect(jssConfig) {
  // This function allows you to handle redirects received from a proxy response.
  // return (incomingRequest, outgoingServerResponse, proxyResponse, proxyOptions) => {
  //   // IMPORTANT: you must pipe or end the response in this method.
  //   outgoingServerResponse.end();
  // };
  return undefined;
}
