module.exports = { resolveServerUrls };

function resolveServerUrls() {
  const serverPort = process.env.SERVER_PORT || 3000;
  const serverHostname = process.env.SERVER_HOST_NAME || 'localhost';
  const serverProtocol = process.env.SERVER_PROTOCOL || 'http';

  const tunnelPort = process.env.SERVER_TUNNEL_PORT;
  const tunnelHostname = process.env.SERVER_TUNNEL_HOST_NAME;
  const tunnelProtocol = process.env.SERVER_TUNNEL_PROTOCOL;

  return {
    server: {
      parts: {
        port: serverPort,
        hostname: serverHostname,
        protocol: serverProtocol,
      },
      url: `${serverProtocol}://${serverHostname}:${serverPort}`,
    },
    tunnel: {
      parts: {
        port: tunnelPort,
        hostname: tunnelHostname,
        protocol: tunnelProtocol,
      },
      // If no tunnelHostName has been resolved, return undefined for the `url` value
      url: tunnelHostname
        ? `${tunnelProtocol}://${tunnelHostname}${tunnelPort ? ':' + tunnelPort : ''}`
        : undefined,
    },
  };
}
