// Credit to `node-http-proxy` for a lot of the code in this file:
// https://github.com/http-party/node-http-proxy/blob/master/lib/http-proxy/passes/web-outgoing.js

const { URL } = require('url');
const setCookieParser = require('set-cookie-parser');
const zlib = require('zlib');

const redirectRegex = /^201|30(1|2|7|8)$/;

module.exports = {
  async handleProxyResponse(incomingRequest, outgoingServerResponse, proxyResponse, options) {
    try {
      removeChunked(incomingRequest, proxyResponse);
      setConnection(incomingRequest, proxyResponse);
      setRedirectHostRewrite(incomingRequest, proxyResponse, options);
      // NOTE: the `copyHeaders` method copies all headers from proxyResponse to outgoingServerResponse
      copyHeaders(outgoingServerResponse, proxyResponse, options);
      writeStatusCode(outgoingServerResponse, proxyResponse);

      outgoingServerResponse.removeHeader('server');
      outgoingServerResponse.removeHeader('x-powered-by');

      if (options.isLayoutServiceProxy) {
        const responseData = await streamToBuffer(proxyResponse);
        const contentEncoding = proxyResponse.headers['content-encoding'];
        const layoutServiceData = await extractJsonFromResponseData(responseData, contentEncoding);

        if (options.modifyLayoutServiceData) {
          options.modifyLayoutServiceData(
            layoutServiceData,
            incomingRequest,
            outgoingServerResponse,
            proxyResponse,
            options
          );
        }

        // Attach the parsed JSS/Layout Service data as an arbitrary property on the `req` object
        incomingRequest.jssData = {
          route: layoutServiceData,
        };
        // remove the content-encoding header from the outgoing response as the app renderer
        // will be returning html.
        outgoingServerResponse.removeHeader('content-encoding');
      } else if (
        options.handleProxyRedirect &&
        (proxyResponse.statusCode === 301 || proxyResponse.statusCode === 302)
      ) {
        // NOTE: it is expected that the `handleProxyRedirect` handler will pipe or end the response.
        options.handleProxyRedirect(
          incomingRequest,
          outgoingServerResponse,
          proxyResponse,
          options
        );
      } else {
        // Note: `proxyResponse.pipe` does _not_ pipe headers from `proxyResponse` to `outgoingServerResponse`, it only pipes the response body.
        // So the header changes made above to `outgoingServerResponse` will not be overwritten.
        proxyResponse.pipe(outgoingServerResponse);
        // Note: you do not need to call outgoingServerResponse.end() here.
      }
    } catch (error) {
      console.error(error);
      outgoingServerResponse.statusCode = 500;
      outgoingServerResponse.content = error;
    }
  },
};

/**
 * If is a HTTP 1.0 request, remove chunk headers
 *
 * @param {ClientRequest} Req Request object
 * @param {proxyResponse} Res Response object from the proxy request
 *
 * @api private
 */
function removeChunked(req, proxyRes) {
  if (req.httpVersion === '1.0') {
    delete proxyRes.headers['transfer-encoding'];
  }
}

/**
 * If is a HTTP 1.0 request, set the correct connection header
 * or if connection header not present, then use `keep-alive`
 *
 * @param {ClientRequest} Req Request object
 * @param {proxyResponse} Res Response object from the proxy request
 *
 * @api private
 */
function setConnection(req, proxyRes) {
  if (req.httpVersion === '1.0') {
    proxyRes.headers.connection = req.headers.connection || 'close';
  } else if (req.httpVersion !== '2.0' && !proxyRes.headers.connection) {
    proxyRes.headers.connection = req.headers.connection || 'keep-alive';
  }
}

function setRedirectHostRewrite(req, proxyRes, options) {
  if (
    (options.hostRewrite || options.autoRewrite || options.protocolRewrite) &&
    proxyRes.headers.location &&
    redirectRegex.test(proxyRes.statusCode)
  ) {
    const target = options.target;
    const location = new URL(proxyRes.headers.location);

    // make sure the redirected host matches the target host before rewriting
    if (target.host !== location.host) {
      return;
    }

    if (options.hostRewrite) {
      location.host = options.hostRewrite;
    } else if (options.autoRewrite) {
      location.host = req.headers.host;
    }
    if (options.protocolRewrite) {
      location.protocol = options.protocolRewrite;
    }

    proxyRes.headers.location = location.format();
  }
}

/**
 * Copy headers from proxyResponse to response
 * set each header in response object.
 *
 * @param {IncomingMessage} Res Response object
 * @param {proxyResponse} Res Response object from the proxy request
 * @param {Object} Options options.cookieDomainRewrite: Config to rewrite cookie domain
 *
 * @api private
 */
function copyHeaders(res, proxyRes, options) {
  const preserveHeaderKeyCase = options.preserveHeaderKeyCase;
  let rawHeaderKeyMap;

  const copyHeader = function(headerKey, headerValue) {
    if (headerValue === undefined) {
      return;
    }

    let resolvedHeaderValue = headerValue;
    if (options.modifyCookies && headerKey.toLowerCase() === 'set-cookie') {
      const parsedCookies = setCookieParser(headerValue);
      options.modifyCookies(parsedCookies, res, proxyRes, options);
      removeEmptyAnalyticsCookie(parsedCookies);
      resolvedHeaderValue = serializeCookies(parsedCookies);
    }

    res.setHeader(String(headerKey).trim(), resolvedHeaderValue);
  };

  // message.rawHeaders is added in: v0.11.6
  // https://nodejs.org/api/http.html#http_message_rawheaders
  if (preserveHeaderKeyCase && proxyRes.rawHeaders !== undefined) {
    rawHeaderKeyMap = {};
    for (let i = 0; i < proxyRes.rawHeaders.length; i += 2) {
      const key = proxyRes.rawHeaders[i];
      rawHeaderKeyMap[key.toLowerCase()] = key;
    }
  }

  Object.keys(proxyRes.headers).forEach(function(headerKey) {
    const headerValue = proxyRes.headers[headerKey];
    let resolvedHeaderKey = headerKey;
    if (preserveHeaderKeyCase && rawHeaderKeyMap) {
      resolvedHeaderKey = rawHeaderKeyMap[headerKey] || headerKey;
    }
    copyHeader(resolvedHeaderKey, headerValue);
  });
}

/**
 * Set the statusCode from the proxyResponse
 *
 * @param {IncomingMessage} Res Response object
 * @param {proxyResponse} Res Response object from the proxy request
 *
 * @api private
 */
function writeStatusCode(res, proxyRes) {
  // From Node.js docs: response.writeHead(statusCode[, statusMessage][, headers])
  if (proxyRes.statusMessage) {
    res.statusCode = proxyRes.statusCode;
    res.statusMessage = proxyRes.statusMessage;
  } else {
    res.statusCode = proxyRes.statusCode;
  }
}

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    readableStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    readableStream.on('error', reject);
  });
}

/**
 * @param {Buffer} responseData
 * @param {Logger} logger
 * @param {string} [contentEncoding]
 * @returns {Promise<object>}
 */
async function extractJsonFromResponseData(responseData, contentEncoding) {
  return new Promise((resolve, reject) => {
    if (
      contentEncoding &&
      (contentEncoding.indexOf('gzip') !== -1 || contentEncoding.indexOf('deflate') !== -1)
    ) {
      zlib.unzip(responseData, (error, result) => {
        if (error) {
          reject(error);
        }

        if (result) {
          const parsedResult = tryParseJson(result.toString('utf-8'));
          resolve(parsedResult);
        }
      });
    } else {
      const parsedResult = tryParseJson(responseData.toString('utf-8'));
      resolve(parsedResult);
    }
  });
}

// For some reason, Sitecore may send responses that contain the 'set-cookie'
// header with the SC_ANALYTICS_GLOBAL_COOKIE value as an empty string.
// This effectively sets the cookie to empty on the client as well, so if a user were to close their browser
// after one of these 'empty value' responses, they would not be tracked as a returning visitor after re-opening their browser.
// To address this, we simply parse the response cookies and if the analytics cookie is present but has an empty value, then we
// remove it from the response header. This means the existing cookie in the browser remains intact.
function removeEmptyAnalyticsCookie(cookies) {
  if (!cookies) {
    return;
  }

  const analyticsCookieIndex = cookies.findIndex(
    (cookie) => cookie.name === 'SC_ANALYTICS_GLOBAL_COOKIE'
  );
  if (analyticsCookieIndex === -1) {
    return;
  }

  const analyticsCookie = cookies[analyticsCookieIndex];
  if (analyticsCookie && analyticsCookie.value === '') {
    cookies.splice(analyticsCookieIndex, 1);
  }
}

/**
 * Converts an array of cookie objects to an array of cookie strings.
 * @param {*} cookies
 */
function serializeCookies(cookies) {
  return cookies.map((cookie) => {
    return Object.keys(cookie).reduce((result, cookiePropKey) => {
      const formattedPropKey = cookiePropKey.toLowerCase();
      // name/value should be the first part of the cookie
      if (formattedPropKey === 'name') {
        result = `${cookie.name}=${encodeURIComponent(cookie.value)}${result};`;
      } else if (formattedPropKey !== 'value') {
        const cookiePropValue = cookie[cookiePropKey];

        let resolvedCookieProp = '';
        if (formattedPropKey === 'httponly' || formattedPropKey === 'secure') {
          // `httpOnly` and `secure` properties shouldn't be written as a key-value pair
          resolvedCookieProp = cookiePropValue ? `${cookiePropKey};` : '';
        } else {
          resolvedCookieProp = `${cookiePropKey}=${cookiePropValue};`;
        }

        // delimit cookie properties with a `;` character
        result = `${result}${resolvedCookieProp}`;
      }
      return result;
    }, '');
  });
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
