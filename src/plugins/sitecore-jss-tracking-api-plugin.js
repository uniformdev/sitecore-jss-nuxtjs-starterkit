import Vue from 'vue';
import { trackingApi } from '@sitecore-jss/sitecore-jss-tracking';

import { dataFetcher } from '../lib/dataFetcher';
import { getConfig } from '../temp/config';

export default function(context) {
  const config = getConfig();

  // Vue plugins must export a function named 'install'
  function install(VueInstance) {
    // "standard" convention for Vue plugins to ensure they are only installed once.
    if (install.installed) {
      return;
    }
    install.installed = true;

    VueInstance.prototype.$jss = {
      // there may be other JSS plugins installed, merge existing properties
      ...VueInstance.prototype.$jss,
      trackingApi: createTrackingApiClient(config),
    };
  }

  const plugin = { install, key: 'SitecoreJssTrackingApiPlugin' };
  // Note: we don't use the built-in Nuxt plugin "inject" functionality because it
  // will assign the plugin to the Vue instance using the `key` property. However, we
  // want all JSS-related plugins to be accessible via the `$jss` property, so we
  // need to use the Vue-provided `Vue.use()` syntax to install JSS plugins.
  Vue.use(plugin);
}

function createTrackingApiClient(config) {
  const trackingApiOptions = {
    host: config.sitecoreApiHost,
    querystringParams: {
      sc_apikey: config.sitecoreApiKey,
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
