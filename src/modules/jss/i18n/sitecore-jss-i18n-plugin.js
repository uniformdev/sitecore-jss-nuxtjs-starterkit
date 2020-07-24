import Vue from 'vue';

export default function initialize(nuxtContext) {
  if (!nuxtContext.$jss || !nuxtContext.$jss.dataFetcher) {
    throw new Error(
      'Unable to initialize the JSS i18n plugin. No `dataFetcher` instance was available. Ensure that a JSS `dataFetcher` module or plugin has been installed and initialized.'
    );
  }
  if (!nuxtContext.$jss || !nuxtContext.$jss.getRuntimeConfig) {
    throw new Error(
      'Unable to initialize the JSS Tracking API plugin. No `getRuntimeConfig` method was available. Ensure that a JSS `getRuntimeConfig` plugin has been installed and initialized.'
    );
  }

  // Initialize i18n store first (so we can access the store during the init process).
  // Then resolve the state value (which may require an async fetch to retrieve dictionary data).
  // Then set the store value.
  // And finally, install the plugin. We install the plugin last because of the possible
  // async fetch to retrieve dictionary data.
  initializeI18nStore(nuxtContext.store);

  return resolveStateValue(nuxtContext)
    .then((state) => {
      // After successful i18n init, track the i18n values in state
      nuxtContext.store.commit('i18n/seti18n', state);
    })
    .then(() => {
      // After successful i18n and store init, install the i18n plugin.
      const plugin = {
        install: (VueInstance) => install(VueInstance, nuxtContext),
        key: 'SitecoreJssi18nextPlugin',
      };

      Vue.use(plugin);
    });
}

function initializeI18nStore(store) {
  // Create and register a Vuex store for i18n state.
  const namespace = 'i18n';

  const storeModule = {
    namespaced: true,
    state: () => ({ language: '', dictionary: null }),
    mutations: {
      seti18n(state, { language, dictionary }) {
        state.language = language;
        state.dictionary = dictionary;
      },
    },
  };

  store.registerModule(namespace, storeModule, {
    preserveState: Boolean(store.state[namespace]),
  });
}

async function resolveStateValue(nuxtContext) {
  const { req, params, store, $jss } = nuxtContext;

  const jssConfig = $jss.getRuntimeConfig();

  // `req` is only defined for SSR.
  // If in SSR or static export, we need to initialize i18n using the route language parameter,
  // using the default language as fallback.
  if (req || nuxtContext?.app?.context?.isStatic) {
    // If the request has `jssData.viewBag` properties for language and dictionary, then
    // use the values to populate the state. This is primarily for JSS Rendering Host support.
    // NOTE: `req` is undefined during export/generate, so be sure to null-check it.
    if (req?.jssData?.viewBag?.language && req?.jssData?.viewBag?.dictionary) {
      return Promise.resolve({
        language: req.jssData.viewBag.language,
        dictionary: req.jssData.viewBag.dictionary,
      });
    }

    // Else assume we need to resolve the language and fetch dictionary data.
    const resolvedLanguage = params.lang || jssConfig.defaultLanguage;
    return fetchDictionaryData(resolvedLanguage, nuxtContext).then((dictionary) => {
      return {
        language: resolvedLanguage,
        dictionary,
      };
    });
  } else {
    // If not SSR, then assume we're hydrating from SSR state and use the language and dictionary
    // provided via SSR state.
    return Promise.resolve({
      language: store.state.i18n.language,
      dictionary: store.state.i18n.dictionary,
    });
  }
}

function install(VueInstance, nuxtContext) {
  if (nuxtContext.$jss?.getCurrentLanguage) {
    console.log('JSS i18n plugin already installed.');
    return;
  }

  // Define properties that will be available in the `$jss` object.
  // Note: these properties are _not_ intended to be reactive, which is why they are
  // all functions - to help make it clear to devs that the properties are not reactive.
  const props = {
    getCurrentLanguage: () => nuxtContext.store.state.i18n.language,
    getCurrentDictionary: () => {
      return nuxtContext.store.state.i18n.dictionary;
    },
    translate: (phrase) => nuxtContext.store.state.i18n.dictionary[phrase],
    changeLanguage: (newLanguage) => changeLanguage(newLanguage, nuxtContext),
  };

  // Who knows what other JSS plugins are doing? So be kind and merge our plugin props
  // with any existing `$jss` object properties.
  nuxtContext.$jss = Object.assign(nuxtContext.$jss || {}, props);
  nuxtContext.app.$jss = Object.assign(nuxtContext.app.$jss || {}, props);
  VueInstance.prototype.$jss = Object.assign(VueInstance.prototype.$jss || {}, props);
}

function changeLanguage(newLanguage, nuxtContext) {
  // If the language hasn't changed, don't do anything.
  if (newLanguage === nuxtContext.store.state.i18n.language) {
    return Promise.resolve(false);
  }

  // Ftch new dictionary data and change the i18n state data.
  // Then change the app route so that the app can fetch Layout Service data for the new
  // language and then re-render.
  return fetchDictionaryData(newLanguage, nuxtContext).then((dictionary) => {
    nuxtContext.store.commit('i18n/seti18n', {
      language: newLanguage,
      dictionary,
    });

    const newRoute = `/${newLanguage}${
      nuxtContext.app.router.currentRoute.params.sitecoreRoute || ''
    }`;

    nuxtContext.app.router.push(newRoute);
    return true;
  });
}

function fetchDictionaryData(language, nuxtContext) {
  if (
    nuxtContext.store.state.i18n?.dictionary &&
    language === nuxtContext.store.state.i18n.language
  ) {
    return Promise.resolve(nuxtContext.store.state.i18n.dictionary);
  }

  const jssConfig = nuxtContext.$jss.getRuntimeConfig();
  const dictionaryServiceUrl = `${jssConfig.sitecoreApiHost}/sitecore/api/jss/dictionary/${jssConfig.jssAppName}/${language}?sc_apikey=${jssConfig.sitecoreApiKey}&sc_site=${jssConfig.sitecoreSiteName}`;

  return nuxtContext.$jss.dataFetcher(dictionaryServiceUrl).then((response) => {
    if (response.data && response.data.phrases) {
      return response.data.phrases;
    }
    return null;
  });
}
