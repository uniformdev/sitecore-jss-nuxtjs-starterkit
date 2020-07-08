import axios from 'axios';
import { installDataFetcherPlugin } from '~/modules/jss/data-fetcher/install-data-fetcher-plugin';

export default function initialize(context) {
  // Create and install the plugin.
  installDataFetcherPlugin(dataFetcher, context);
}

/**
 * Implements a data fetcher using Axios - replace with your favorite
 * SSR-capable HTTP or fetch library if you like. See HttpJsonFetcher<T> type
 * in sitecore-jss library for implementation details/notes.
 * @param {string} url The URL to request; may include query string
 * @param {any} data Optional data to POST with the request.
 */
function dataFetcher(url, data, options) {
  console.log('fetching data', url);
  return axios({
    url,
    method: data ? 'POST' : 'GET',
    data,
    // note: axios needs to use `withCredentials: true` in order for Sitecore cookies to be included in CORS requests
    // which is necessary for analytics and such
    withCredentials: true,
    ...options,
  });
}
