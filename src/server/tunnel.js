// Process values provided in `.env` file(s)
const { config: dotenvConfig } = require('dotenv');
dotenvConfig();

const ngrok = require('ngrok');
const { URL } = require('url');
const { resolveServerUrls } = require('./util');

const { server: serverUrl } = resolveServerUrls();

startRenderHostTunnel(serverUrl.parts.hostname, {
  proto: serverUrl.parts.protocol,
  port: serverUrl.parts.port,
})
  .then((tunnelUrl) => {
    const parsedTunnelUrl = new URL(tunnelUrl);
    process.env.SERVER_TUNNEL_HOST_NAME = parsedTunnelUrl.hostname;
    process.env.SERVER_TUNNEL_PORT = parsedTunnelUrl.port;
    // node URL.protocol returns the protocal name along with a trailing `:`, we don't need that.
    process.env.SERVER_TUNNEL_PROTOCOL = parsedTunnelUrl.protocol.replace(':', '');

    // start the Express server
    require('./index');
  })
  .catch((err) => {
    console.error(err);
  });

// This function starts an ngrok tunnel that will expose the express server
// via a public URL, e.g. https://13453.ngrok.io
function startRenderHostTunnel(
  renderHostname,
  options = { port: 80, proto: 'http', quiet: false }
) {
  if (!renderHostname) {
    throw new Error(
      'Unable to start render host tunnel as no hostname for the rendering host was specified.'
    );
  }

  const rewriteHost = `${renderHostname}:${options.port}`;
  const finalOptions = {
    ...options,
    host_header: 'rewrite',
    addr: rewriteHost,
  };

  return ngrok.connect(finalOptions).then((url) => {
    if (!options.quiet) {
      console.log(`Tunnel started, forwarding '${url}' to '${rewriteHost}'`);
    }
    return url;
  });
}
