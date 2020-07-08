const serverConfig = require('./server/server.config');

const nuxtConfig = {
  mode: 'universal',
  /*
   ** Headers of the page
   */
  head: {
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },
  /*
   ** Customize the progress-bar color
   */
  loading: false,
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [{ src: '~/plugins/export-route-data-context-plugin', mode: 'server' }],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // IMPORTANT: the Express module should be first so that other modules can
    // attach Express middleware (instead of Connect middleware).
    '~/modules/express/initialize',
    // IMPORTANT: the JSS Standard module should be loaded before other JSS modules.
    // Some (not all) JSS modules may depend on the Standard modules or plugins being
    // installed / initialized. e.g. config, dataFetcher
    ['~/modules/jss/standard/initialize', { dataFetcherType: 'axios' }],
    // JSS i18n module
    ['~/modules/jss/i18n/module', { enabled: true }],
    // JSS Disconnected Mode module
    [
      '~/modules/jss/disconnected-mode/initialize',
      { enabled: process.env.JSS_MODE === 'disconnected' },
    ],
    // JSS Rendering Host module
    [
      '~/modules/jss/rendering-host/initialize',
      {
        enabled: true,
        resolveRenderingHostPublicUrl: (nuxtApp, nuxtCfg) => {
          const serverUrl = serverConfig.resolveServerUrl();
          const publicServerUrl = serverConfig.resolvePublicServerUrl();
          return publicServerUrl.url || serverUrl.url;
        },
      },
    ],
    // JSS Tracking API module
    ['~/modules/jss/tracking-api/initialize', { enabled: true }],
    // Uniform Disconnected Mode Export module
    [
      '~/modules/uniform/disconnected-export/initialize',
      { enabled: process.env.JSS_MODE === 'disconnected' },
    ],
    // Uniform Standard Services module
    ['~/modules/uniform/services/initialize', { enabled: true }],
    // Nuxt PWA module
    '@nuxtjs/pwa',
    // JSS Sitecore Proxy module
    // NOTE: the proxy module should likely be installed last (after all other modules)
    // because it adds server middleware that may respond to requests that are intended
    // to be handled by other middleware / route definitions. In other words, if the proxy
    // middleware handles a request, it will likely forward/proxy that request to Sitecore.
    [
      '~/modules/jss/sitecore-proxy/initialize',
      {
        enabled: process.env.JSS_MODE !== 'disconnected',
        isDevEnv: process.env.NODE_ENV !== 'production',
      },
    ],
  ],
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      if (ctx.isDev) {
        config.devtool = ctx.isClient ? 'source-map' : 'inline-source-map';
      }
    },
  },
  generate: {
    dir: 'out',
  },
  server: {
    port: serverConfig.resolveListeningPort(),
  },
};

module.exports = nuxtConfig;
