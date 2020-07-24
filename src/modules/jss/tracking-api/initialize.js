const nodePath = require('path');

module.exports = initialize;

function initialize(moduleOptions) {
  if (!moduleOptions.enabled) {
    return;
  }

  this.addPlugin(nodePath.resolve(__dirname, 'sitecore-jss-tracking-api-plugin.js'));
}
