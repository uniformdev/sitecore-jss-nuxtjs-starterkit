import { trackingApi } from '@sitecore-jss/sitecore-jss-tracking';
import { createDataFetcher } from './dataFetcher';

export function createTrackingApiClient(requestClient, config) {
  const trackingApiOptions = {
    host: config.sitecoreApiHost,
    querystringParams: {
      sc_apikey: config.sitecoreApiKey,
    },
    fetcher: createDataFetcher(requestClient),
  };

  return {
    trackEvent: (...args) => trackingApi.trackEvent(...args, trackingApiOptions),
  };
}
