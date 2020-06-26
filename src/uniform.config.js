const dotenv = require('dotenv');
const { parseUniformConfig } = require('@uniformdev/common');
const { parseUniformServerConfig } = require('@uniformdev/common-server');

// This file is not required, but it provides default standard values for the starter kit.
// You can override the values via a `.env` file if necessary or set the environment variables
// prior to app start.
const defaultConfig = {
  PORT: 3000,
  UNIFORM_API_DEFAULT_LANGUAGE: 'en',
  UNIFORM_API_SITENAME: 'uniform-jss',
  UNIFORM_API_URL: 'http://localhost:3000',
  UNIFORM_DATA_URL: 'http://localhost:3000',
  UNIFORM_OPTIONS_DEBUG: false,
  UNIFORM_OPTIONS_PREFETCH_LINKS: false,
  UNIFORM_OPTIONS_MVC_SPA_ENABLED: false,
  UNIFORM_OPTIONS_MVC_SUPPORT: false,
};

const defaultServerConfig = {
  ...defaultConfig,
  UNIFORM_API_TOKEN: '1234',
  UNIFORM_MODE: 'mixed',
  UNIFORM_PUBLISH_FAKE_PUBLIC_URL: 'http://localhost:3000',
  UNIFORM_PUBLISH_PREFETCH_ENABLED: false,
  UNIFORM_PUBLISH_TARGET: 'none',
};

module.exports = {
  getUniformConfig() {
    setEnvVars(defaultConfig);
    const uniformConfig = parseUniformConfig(process.env);
    return uniformConfig;
  },
  getUniformServerConfig() {
    setEnvVars(defaultServerConfig);
    const uniformServerConfig = parseUniformServerConfig(process.env);
    return uniformServerConfig;
  },
};

function setEnvVars(config) {
  dotenv.config();

  Object.keys(config).forEach((configKey) => {
    process.env[configKey] = process.env[configKey] || config[configKey];
  });
}
