const nodePath = require('path');

module.exports = initialize;

function initialize(moduleOptions) {
  switch (moduleOptions.dataFetcherType) {
    case 'axios':
    default: {
      this.addPlugin(nodePath.resolve(__dirname, 'axios-data-fetcher-plugin.js'));
    }
  }
}
