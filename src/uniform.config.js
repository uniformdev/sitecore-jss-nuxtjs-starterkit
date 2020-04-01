const { parseUniformConfig } = require('@uniformdev/common');

// This file is not required, but it provides default standard values for the starter kit.
// You can override the values via a `.env` file if necessary or set the environment variables
// prior to app start.
module.exports = {
  getUniformConfig() {
    process.env.PORT = process.env.PORT || '3000';
    process.env.UNIFORM_API_SITENAME = process.env.UNIFORM_API_SITENAME || 'uniform-jss';
    process.env.UNIFORM_PUBLISH_TARGET = process.env.UNIFORM_PUBLISH_TARGET || 'none';
    process.env.UNIFORM_API_TOKEN = process.env.UNIFORM_API_TOKEN || '1234';
    process.env.UNIFORM_API_DEFAULT_LANGUAGE = process.env.UNIFORM_API_DEFAULT_LANGUAGE || 'en';

    const uniformConfig = parseUniformConfig(process.env);
    return uniformConfig;
  },
};
