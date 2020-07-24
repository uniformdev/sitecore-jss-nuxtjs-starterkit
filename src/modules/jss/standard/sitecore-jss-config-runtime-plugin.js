import { getConfig } from '~/temp/config';

import Vue from 'vue';

export default function initialize(nuxtContext) {
  // Define the plugin.
  const plugin = {
    install: (VueInstance) =>
      install({
        VueInstance,
        nuxtContext,
      }),
    key: 'SitecoreJssConfigRuntimePlugin',
  };

  // Note: we don't use the built-in Nuxt plugin "inject" functionality because it
  // will assign the plugin to the Vue instance using the `key` property. However, we
  // want all JSS-related plugins to be accessible via the `$jss` property, so we
  // need to use the Vue-provided `Vue.use()` syntax to install JSS plugins.
  Vue.use(plugin);
}

function install({ VueInstance, nuxtContext }) {
  if (nuxtContext.$jss && nuxtContext.$jss.getRuntimeConfig) {
    console.log('JSS Runtime Config plugin already installed.', nuxtContext.$jss.getRuntimeConfig);
    return;
  }

  // Define properties that will be available in the `$jss` object.
  // Note: these properties are _not_ intended to be reactive, which is why they are
  // all functions - to help make it clear to devs that the properties are not reactive.
  const pluginProps = {
    getRuntimeConfig: getConfig,
  };

  // Who knows what other JSS plugins are doing? So be kind and merge our plugin props
  // with any existing `$jss` object properties.
  nuxtContext.$jss = Object.assign(nuxtContext.$jss || {}, pluginProps);
  nuxtContext.app.$jss = Object.assign(nuxtContext.app.$jss || {}, pluginProps);
  VueInstance.prototype.$jss = Object.assign(VueInstance.prototype.$jss || {}, pluginProps);
}
