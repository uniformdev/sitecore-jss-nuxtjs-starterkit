const ngrok = require('ngrok');
const { URL } = require('url');
const serverConfig = require('./server.config');

const serverUrl = serverConfig.resolveServerUrl();

startTunnel(serverUrl.parts.hostname, {
  proto: serverUrl.parts.protocol,
  port: serverUrl.parts.port,
})
  .then((tunnelUrl) => {
    const parsedTunnelUrl = new URL(tunnelUrl);
    process.env.SERVER_PUBLIC_HOST_NAME = parsedTunnelUrl.hostname;
    process.env.SERVER_PUBLIC_PORT = parsedTunnelUrl.port;
    // node URL.protocol returns the protocol name along with a trailing `:`, we don't need that.
    process.env.SERVER_PUBLIC_PROTOCOL = parsedTunnelUrl.protocol.replace(':', '');

    // start the Express server
    require('./server');
  })
  .catch((err) => {
    console.error(err);
  });

// This function starts an ngrok tunnel that will expose the express server
// via a public URL, e.g. https://13453.ngrok.io
async function startTunnel(serverHostname, options = { port: 80, proto: 'http', quiet: false }) {
  if (!serverHostname) {
    throw new Error(
      'Unable to start tunnel as no hostname for the underlying server was specified.'
    );
  }

  const rewriteHost = `${serverHostname}:${options.port}`;
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
