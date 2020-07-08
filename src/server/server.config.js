// Process values provided in `.env` file(s)
const { config: dotenvConfig } = require('dotenv');
dotenvConfig();

module.exports = {
  resolveServerUrl,
  resolvePublicServerUrl,
  resolveListeningPort,
};

function resolveListeningPort() {
  return process.env.PORT || 3000;
}

function resolveServerUrl() {
  const serverPort = process.env.SERVER_PORT || process.env.PORT || 3000;
  const serverHostname = process.env.SERVER_HOST_NAME || 'localhost';
  const serverProtocol = process.env.SERVER_PROTOCOL || 'http';

  return {
    parts: {
      port: serverPort,
      hostname: serverHostname,
      protocol: serverProtocol,
    },
    url: `${serverProtocol}://${serverHostname}:${serverPort}`,
  };
}

function resolvePublicServerUrl() {
  const publicPort = process.env.SERVER_PUBLIC_PORT;
  const publicHostname = process.env.SERVER_PUBLIC_HOST_NAME;
  const publicProtocol = process.env.SERVER_PUBLIC_PROTOCOL;

  return {
    parts: {
      port: publicPort,
      hostname: publicHostname,
      protocol: publicProtocol,
    },
    // If no publicHostName has been resolved, return undefined for the `url` value
    url: publicHostname
      ? `${publicProtocol}://${publicHostname}${publicPort ? ':' + publicPort : ''}`
      : undefined,
  };
}
