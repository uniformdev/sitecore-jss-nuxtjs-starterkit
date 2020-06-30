const {
  generateRuntimeConfig,
  generateRenderingHostConfig,
  generateSitecoreProxyConfig,
} = require('./generate-config');
const { getUniformConfig } = require('../uniform.config');
/*
  BOOTSTRAPPING
  The bootstrap process runs before build, and generates JS that needs to be
  included into the build - specifically, the component name to component mapping,
  and the global config module.
*/

// Resolve execution modes
const disconnected = process.argv.some((arg) => arg === '--disconnected');
const isExport = process.argv.some((arg) => arg === '--export');

/*
  CONFIG GENERATION
  Generates the /src/temp/config.js file which contains runtime configuration
  that the app can import and use.
*/
const runtimeConfigOverrides = getRuntimeConfigOverrides();
generateRuntimeConfig(runtimeConfigOverrides);

// Rendering Host config generation can be removed / disabled if rendering host is not being used.
generateRenderingHostConfig();

// Sitecore Proxy config generation can be removed / disabled if Sitecore proxy is not being used.
generateSitecoreProxyConfig();

/*
  COMPONENT FACTORY GENERATION
*/
require('./generate-component-factory');

function getRuntimeConfigOverrides() {
  const uniformConfig = getUniformConfig();
  const port = process.env.PORT || 3000;

  const configOverride = {};
  if (disconnected) {
    configOverride.sitecoreApiHost = `http://localhost:${port}`;
  }

  const siteName = uniformConfig.UNIFORM_API_SITENAME;
  if (siteName) {
    configOverride.sitecoreSiteName = siteName;
  }

  if (isExport) {
    const apiKey = process.env.UNIFORM_API_KEY;
    if (apiKey) {
      configOverride.apiKey = apiKey;
    }

    const layoutServiceHost = uniformConfig.UNIFORM_API_URL;
    if (layoutServiceHost) {
      configOverride.sitecoreApiHost = layoutServiceHost;
    }
  }

  return configOverride;
}
