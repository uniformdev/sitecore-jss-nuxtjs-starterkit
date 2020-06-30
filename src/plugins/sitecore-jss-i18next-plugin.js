import Vue from 'vue';
import i18n from 'i18next';
import axiosBackend from './i18next-axios-backend';
import { getConfig } from '../temp/config';

export default function(context) {
  const { req, params, store } = context;

  const config = getConfig();

  const initValues = {
    language: '',
    dictionary: null,
  };

  // `req` is only defined for SSR.
  // If in SSR or static export, we need to initialize i18n using the route language parameter, using the default language as fallback.
  if (req || (process.env.NUXT_EXPORT && process.env.NUXT_EXPORT === 'true')) {
    initValues.language = params.lang || config.defaultLanguage;
    initValues.dictionary = null;
  } else {
    // If not SSR, then assume we're hydrating from SSR state and use the language and dictionary
    // provided via SSR state.
    const nuxtData = context.store.state.app;
    initValues.language = nuxtData.language;
    initValues.dictionary = nuxtData.dictionary;
  }

  // Initialize i18n first (before installing the plugin) as it may require an async fetch to retrieve dictionary data.
  return i18nInit(initValues.language, initValues.dictionary)
    .catch((error) => {
      console.error(error);
    })
    .then(() => {
      // After successful i18n init, track the i18n values in state
      const languageData = i18n.getDataByLanguage(i18n.language);
      store.commit('app/seti18n', {
        language: initValues.language,
        dictionary: languageData ? languageData.translation : {},
      });

      // After successful i18n initialization, install the i18n plugin.
      const plugin = {
        install: (VueInstance) => install(VueInstance, context),
        key: 'SitecoreJssi18nextPlugin',
      };

      Vue.use(plugin);
    });
}

function install(VueInstance, context) {
  // "standard" convention for Vue plugins to ensure they are only installed once.
  if (install.installed) {
    return;
  }
  install.installed = true;

  // Define properties that will be available in the `$jss` object.
  // Note: these properties are _not_ intended to be reactive, which is why they are
  // all functions - to help make it clear to devs that the properties are not reactive.
  const props = {
    getCurrentLanguage: () => i18n.language,
    getCurrentDictionary: () => {
      const languageData = i18n.getDataByLanguage(i18n.language);
      return languageData ? languageData.translation : {};
    },
    translate: (phrase, options) => i18n.t(phrase, options),
    changeLanguage: (newLanguage) => changeLanguage(newLanguage, context.app.router, context.store),
  };

  // Who knows what other JSS plugins are doing? So be kind and merge our plugin props
  // with any existing `$jss` object properties.
  context.$jss = Object.assign(context.$jss || {}, props);
  context.app.$jss = Object.assign(context.app.$jss || {}, props);
  VueInstance.prototype.$jss = Object.assign(VueInstance.prototype.$jss || {}, props);
}

function changeLanguage(newLanguage, router, store) {
  // If the language hasn't changed, don't do anything.
  if (newLanguage === i18n.language) {
    return;
  }

  // Change the i18n language, which should fetch new dictionary data.
  // Then change the app route so that the app can fetch Layout Service data for the new
  // language and then re-render.
  return i18n.changeLanguage(newLanguage).then(() => {
    const languageData = i18n.getDataByLanguage(i18n.language);
    store.commit('app/seti18n', {
      language: newLanguage,
      dictionary: languageData ? languageData.translation : {},
    });

    const newRoute = `/${newLanguage}${router.currentRoute.params.sitecoreRoute || ''}`;

    router.push(newRoute);
  });
}

/**
 * Initializes the i18next library to provide a translation dictionary to the app.
 * @param {string} language Required, the initial language.
 * @param {*} dictionary Optional, the dictionary to load. Used for SSR and when hydrating from SSR; otherwise, the dictionary is loaded via JSS dictionary service.
 */
function i18nInit(language, dictionary) {
  const config = getConfig();

  const options = {
    debug: false,
    lng: language,
    fallbackLng: false, // fallback to keys
    load: 'currentOnly', // e.g. don't load 'es' when requesting 'es-MX' -- Sitecore config should handle this
    useCookie: false, // using URLs and Sitecore to store language context, don't need a cookie
    interpolation: {
      escapeValue: false, // not needed for react
    },
    // This must be true to enable the i18n backend to fetch dictionary data when app language is changed.
    // Otherwise, if false, the i18n backend will change languages but will not fetch dictionary data for the "new" language.
    partialBundledLanguages: true,
  };

  const dictionaryServicePath = `${config.sitecoreApiHost}/sitecore/api/jss/dictionary/${config.jssAppName}/{{lng}}?sc_apikey=${config.sitecoreApiKey}&sc_site=${config.sitecoreSiteName}`;

  options.backend = {
    loadPath: dictionaryServicePath,
    parse: (data) => {
      return data.phrases || data;
    },
  };

  // We may also have dictionary data deserialized from SSR state, so we can initialize with that
  // if it is present.
  if (dictionary) {
    options.resources = {};
    options.resources[language] = {
      translation: dictionary,
    };
    // This option is a bit counter-intuitive. Setting the value to `false` will cause `i18n` to
    // initialize synchronously. Otherwise, `i18n` will initialize asynchronously.
    // Note: initializing asynchronously typically means the app will need to handle/render a "language loading" state or
    // initialization will need to happen before the app starts rendering at all - which will generally cause a "flash"
    // to occur in the browser.
    options.initImmediate = false;
  }

  return i18n.use(axiosBackend).init(options);
}
