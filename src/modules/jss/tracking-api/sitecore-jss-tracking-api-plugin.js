import Vue from 'vue';
import { trackingApi } from '@sitecore-jss/sitecore-jss-tracking';

export default function initialize(nuxtContext) {
  if (!nuxtContext.$jss || !nuxtContext.$jss.dataFetcher) {
    throw new Error(
      'Unable to initialize the JSS Tracking API plugin. No `dataFetcher` instance was available. Ensure that a JSS `dataFetcher` module or plugin has been installed and initialized.'
    );
  }
  if (!nuxtContext.$jss || !nuxtContext.$jss.getRuntimeConfig) {
    throw new Error(
      'Unable to initialize the JSS Tracking API plugin. No `getRuntimeConfig` method was available. Ensure that a JSS `getRuntimeConfig` plugin has been installed and initialized.'
    );
  }

  const jssConfig = nuxtContext.$jss.getRuntimeConfig();

  // Vue plugins must export a function named 'install'
  function install(VueInstance) {
    if (nuxtContext.$jss && nuxtContext.$jss.trackingApi) {
      console.log('JSS Tracking API plugin already installed.', nuxtContext.$jss.trackingApi);
      return;
    }

    VueInstance.prototype.$jss = {
      // there may be other JSS plugins installed, merge existing properties
      ...VueInstance.prototype.$jss,
      trackingApi: createTrackingApiClient(jssConfig, nuxtContext.$jss.dataFetcher),
    };
  }

  const plugin = { install, key: 'SitecoreJssTrackingApiPlugin' };
  // Note: we don't use the built-in Nuxt plugin "inject" functionality because it
  // will assign the plugin to the Vue instance using the `key` property. However, we
  // want all JSS-related plugins to be accessible via the `$jss` property, so we
  // need to use the Vue-provided `Vue.use()` syntax to install JSS plugins.
  Vue.use(plugin);
}

function createTrackingApiClient(jssConfig, dataFetcher) {
  const trackingApiOptions = {
    host: jssConfig.sitecoreApiHost,
    querystringParams: {
      sc_apikey: jssConfig.sitecoreApiKey,
      sc_site: jssConfig.sitecoreSiteName,
    },
    fetcher: dataFetcher,
  };

  const abandonOptions = {
    action: 'flush',
    ...trackingApiOptions,
  };

  return {
    trackEvent: (...args) => trackingApi.trackEvent(...args, trackingApiOptions),
    abandon: () => trackingApi.trackEvent([], abandonOptions),
  };
}
