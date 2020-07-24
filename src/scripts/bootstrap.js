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
  and the global config module(s).
*/

// Resolve execution modes
const disconnected = process.env.JSS_MODE === 'disconnected';
const isExport = process.env.NUXT_EXPORT === 'true';

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
  const configOverride = {};

  const uniformConfig = getUniformConfig();

  if (disconnected) {
    const port = process.env.PORT || 3000;
    configOverride.sitecoreApiHost = `http://localhost:${port}`;
  }

  if (isExport) {
    const siteName = uniformConfig.UNIFORM_API_SITENAME;
    if (siteName) {
      configOverride.sitecoreSiteName = siteName;
    }

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
