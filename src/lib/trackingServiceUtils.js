import { trackingApi } from '@sitecore-jss/sitecore-jss-tracking';
import { dataFetcher } from './dataFetcher';

export function createTrackingApiClient(config) {
  const trackingApiOptions = {
    host: config.sitecoreApiHost,
    querystringParams: {
      sc_apikey: config.sitecoreApiKey,
    },
    fetcher: dataFetcher,
  };

  return {
    trackEvent: (...args) => trackingApi.trackEvent(...args, trackingApiOptions),
  };
}
