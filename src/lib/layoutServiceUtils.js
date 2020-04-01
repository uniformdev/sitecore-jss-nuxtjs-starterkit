import { dataApi } from '@sitecore-jss/sitecore-jss-vue';
import { createDataFetcher } from './dataFetcher';

export function createLayoutServiceClient(requestClient, config, { nuxtContext } = {}) {
  return {
    getRouteData: (route, language) =>
      getRouteData(route, language, requestClient, config, nuxtContext),
  };
}

function getRouteData(route, language, requestClient, config, nuxtContext) {
  const fetchOptions = {
    // NOTE: we want to proxy client-side layout service requests through the Nuxt server so
    // that cookies are properly maintained. Therefore, we leave the Layout Service
    // config `host` value empty. The Nuxt server will then handle requests for `/sitecore/api/layout/...`
    layoutServiceConfig: { host: '' },
    querystringParams: { sc_lang: language, sc_apikey: config.sitecoreApiKey },
    fetcher: createDataFetcher(requestClient),
  };

  if (
    nuxtContext &&
    nuxtContext.isStatic &&
    nuxtContext.app &&
    nuxtContext.app.getExportRouteDataContext
  ) {
    // export mode
    // Fetch layout data from Layout Service, then write the data to disk.
    const { exportRouteDataWriter } = nuxtContext.app.getExportRouteDataContext();
    fetchOptions.layoutServiceConfig.host = config.sitecoreApiHost;

    let apiData;
    return fetchFromApi(route, fetchOptions)
      .then((data) => {
        apiData = data;
        return exportRouteDataWriter(route, language, data);
      })
      .then(() => apiData);
  } else if (process.env.NODE_ENV === 'production') {
    // production mode (i.e. the app is "running" somewhere)
    // Attempt to fetch layout data from disk, and fall back to Layout Service if disk fetch returns 404.
    return fetchFromDisk(route, language, fetchOptions.fetcher).catch((err) => {
      if (err.response && err.response.status === 404) {
        return fetchFromApi(route, fetchOptions);
      }
      console.error(err);
    });
  } else {
    // development mode
    // Fetch layout data from Layout Service
    return fetchFromApi(route, fetchOptions);
  }
}

// note: if `str` is undefined, no leading slash will be applied/returned.
function ensureLeadingSlash(str) {
  if (str && !str.startsWith('/')) {
    return `/${str}`;
  }
  return str;
}

function fetchFromDisk(route, language, dataFetcher) {
  let formattedRoute = ensureLeadingSlash(route);
  if (formattedRoute === '/') {
    formattedRoute = '/home';
  }

  const filePath = `/data${formattedRoute}/${language}.json`;
  return dataFetcher(filePath).then((response) => {
    // note: `dataFetcher` returns the parsed response, but we're only interested in
    // the `data` property, which is what is returned by the `dataApi.fetchRouteData` function.
    return response.data;
  });
}

function fetchFromApi(route, fetchOptions) {
  // Layout Service may resolve items (routes) incorrectly without a leading slash. This is
  // particularly true for nested routes, e.g. home/sub1/sub2/sub3. Therefore, we ensure
  // that the item/route being requested has a leading slash.
  const formattedRoute = ensureLeadingSlash(route);

  return dataApi.fetchRouteData(formattedRoute, fetchOptions).catch((error) => {
    if (error.response && error.response.status === 404 && error.response.data) {
      return error.response.data;
    }

    console.error(`Route data fetch error for route: ${route}`, error.message);

    return null;
  });
}
