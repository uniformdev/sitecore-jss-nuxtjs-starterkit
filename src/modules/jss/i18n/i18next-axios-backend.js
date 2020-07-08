// Inspired by / copied from: https://github.com/perrin4869/i18next-fetch-backend
import axios from 'axios';

const defaults = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/add/{{lng}}/{{ns}}',
  multiSeparator: '+',
  allowMultiLoading: false,
  parse: JSON.parse,
  stringify: JSON.stringify,
  requestOptions: {},
};

const arrify = (val) => (Array.isArray(val) ? val : [val]);
const normalize = (funcOrVal, ...args) =>
  typeof funcOrVal === 'function' ? funcOrVal(...args) : funcOrVal;

class BackendError extends Error {
  retry = null;

  constructor(message, retry = false) {
    super(message);

    this.retry = retry;
  }
}

class Backend {
  constructor(services, options) {
    this.init(services, options);
  }

  type = 'backend';

  static type = 'backend';

  init(services, options = {}) {
    this.services = services;

    this.options = {
      ...defaults,
      ...this.options,
      ...options,
    };
  }

  getLoadPath(languages, namespaces) {
    return normalize(this.options.loadPath, languages, namespaces);
  }

  read(language, namespace, callback) {
    const loadPath = this.getLoadPath(language, namespace);
    const url = this.services.interpolator.interpolate(loadPath, { lng: language, ns: namespace });

    this.loadUrl(url, callback);
  }

  readMulti(languages, namespaces, callback) {
    const loadPath = this.getLoadPath(languages, namespaces);
    const { multiSeparator } = this.options;

    const url = this.services.interpolator.interpolate(loadPath, {
      lng: languages.join(multiSeparator),
      ns: namespaces.join(multiSeparator),
    });

    this.loadUrl(url, callback);
  }

  loadUrl(url, callback) {
    const { requestOptions, parse } = this.options;

    axios(url, requestOptions)
      .then(
        (response) => {
          const { status } = response;

          if (status !== 200) {
            const retry = status >= 500 && status < 600; // don't retry for 4xx codes

            throw new BackendError(`failed loading ${url}`, retry);
          }
          // axios automatically parses JSON responses and exposes parsed data as
          // a property named `data` on the response object.
          return response.data;
        },
        () => {
          throw new BackendError(`failed loading ${url}`);
        }
      )
      .then((data) => {
        try {
          // Give devs a chance to parse / transform the data prior to returning it.
          return callback(null, parse(data, url));
        } catch (e) {
          throw new BackendError(`failed parsing ${url} to json`, false);
        }
      })
      .catch((e) => {
        return callback(e.message, e.retry || false);
      });
  }

  create(languages, namespace, key, fallbackValue) {
    const payload = {
      [key]: fallbackValue || '',
    };

    arrify(languages).forEach((lng) => {
      const { addPath, requestOptions, stringify } = this.options;

      const url = this.services.interpolator.interpolate(addPath, { lng, ns: namespace });

      try {
        axios(url, {
          method: 'POST',
          data: stringify(payload),
          ...requestOptions,
        });
      } catch (ex) {
        console.error(ex);
      }
    });
  }
}

export default Backend;
