const fs = require('fs');
const nodePath = require('path');
const express = require('express');
const chalk = require('chalk');
const { watch } = require('chokidar');

const config = require('../package.json').config;

const touchToReloadFilePath = 'src/temp/config.js';

const disconnectedServerOptions = {
  appRoot: nodePath.join(__dirname, '..'),
  appName: config.appName,
  watchPaths: ['./data'],
  language: config.language,
  routeDataRoot: nodePath.join(__dirname, '../data/routes'),
  dictionaryDataRoot: nodePath.join(__dirname, '../data/dictionary'),
  onDataUpdated: () => {
    // if we can resolve the config file, we can alter it to force reloading the app automatically
    // instead of waiting for a manual reload. We must materially alter the _contents_ of the file to trigger
    // an actual reload, so we append "// reloadnow" to the file each time. This will not cause a problem,
    // since every build regenerates the config file from scratch and it's ignored from source control.
    if (fs.existsSync(touchToReloadFilePath)) {
      const currentFileContents = fs.readFileSync(touchToReloadFilePath, 'utf8');
      const newFileContents = `${currentFileContents}\n// reloadnow`;
      fs.writeFileSync(touchToReloadFilePath, newFileContents, 'utf8');

      console.log(chalk.green('Disconnected data updated. Reloading the browser.'));
    } else {
      console.log(
        chalk.green('Disconnected data updated. Refresh the browser to see latest content!')
      );
    }
  },
};

module.exports = {
  attachDisconnectedServices: (server) => {
    disconnectedServerOptions.server = server;
    createDisconnectedServer(disconnectedServerOptions);
  },
};

function createDisconnectedServer(options) {
  const app = options.server;

  // creates a fake version of the Sitecore Layout Service that is powered by your disconnected manifest file
  const layoutService = createDisconnectedLayoutService({
    customizeContext: options.customizeContext,
    customizeRoute: options.customizeRoute,
    customizeRendering: options.customizeRendering,
    dataRootPath: options.routeDataRoot,
    defaultLanguage: options.language,
  });

  // creates a fake version of the Sitecore Dictionary Service that is powered by your disconnected manifest file
  const dictionaryService = createDisconnectedDictionaryService({
    customizeDictionary: options.customizeDictionary,
    dataRootPath: options.dictionaryDataRoot,
  });

  watchData(options.onDataUpdated, process.cwd(), options.watchPaths);

  app.use('/assets', express.static(nodePath.join(options.appRoot, 'assets')));
  app.use('/data/media', express.static(nodePath.join(options.appRoot, 'data/media')));
  app.use('/sitecore/api/layout/render', layoutService.middleware);
  app.use('/sitecore/api/jss/dictionary/:appName/:language', dictionaryService.middleware);
}

function createDisconnectedLayoutService({
  customizeContext,
  customizeRoute,
  dataRootPath,
  defaultLanguage,
}) {
  console.log(`🔌  Disconnected ${chalk.magenta('Layout Service')} initializing...⏳`);

  const service = {
    middleware: async function disconnectedLayoutServiceMiddleware(request, response) {
      const language = request.query.sc_lang ? request.query.sc_lang : defaultLanguage;
      const routePath = request.query.item;

      // no route specified
      if (!routePath) {
        console.log(
          `> ${chalk.magenta('[LAYOUT]')} Missing route path "item" in service query string`
        );
        response.sendStatus(400);
        return;
      }

      // get route data
      const rawRoute = await getRouteData(routePath, language);

      let route = rawRoute;
      // if a `customizeRoute` function has been provided, call it
      if (rawRoute && customizeRoute && typeof customizeRoute === 'function') {
        route = customizeRoute(rawRoute, language, routePath, request, response);
      }

      // create context object
      let context = createDefaultContext(language);
      // if a `customizeContext` function has been provided, call it
      if (customizeContext && typeof customizeContext === 'function') {
        context = customizeContext(context, route, language, routePath, request, response);
      }

      // if route data is undefined, don't bail yet.
      // we'll send a 404 response, but it will include `context` data and `null` route data.
      if (!route) {
        route = null;
      }

      // assemble result
      const result = {
        sitecore: {
          context,
          route,
        },
      };

      // no matching route, return 404
      if (!route) {
        console.log(
          `> ${chalk.magenta(
            '[LAYOUT]'
          )} Layout for route '${routePath}' was not defined. Returning 404.`
        );
        response.status(404).json(result);
        return;
      }

      console.log(`> ${chalk.green('[LAYOUT]')} served for ${routePath}`);
      response.json(result);
    },
  };

  // eslint-disable-next-line require-await
  async function getRouteData(routePath, language) {
    // resolve the absolute path of the root data directory
    const resolvedRootPath = nodePath.resolve(dataRootPath);
    // assemble the full route path and normalize to ensure no errant `/` or `\` and that the file path is
    // appropriate for the environment (windows / *nix)
    const filePath = nodePath.normalize(
      nodePath.join(resolvedRootPath, routePath, `${language}.json`)
    );

    return readJsonFile(filePath);
  }

  function createDefaultContext(language) {
    return {
      pageEditing: false,
      site: {
        name: 'JssDisconnectedLayoutService',
      },
      pageState: 'normal',
      language,
    };
  }

  return service;
}

function createDisconnectedDictionaryService({ customizeDictionary, dataRootPath }) {
  console.log(`🔌  Disconnected ${chalk.magenta('Dictionary Service')} initializing...⏳`);

  const service = {
    middleware: async (request, response) => {
      const language = request.params.language ? request.params.language : 'en';
      const appName = request.params.appName ? request.params.appname : 'JssDisconnectedDictionary';

      let dictionary = await getDictionaryData(language);
      // if a `customDictionary` function has been provided, call it
      if (customizeDictionary && typeof customizeDictionary === 'function') {
        dictionary = customizeDictionary(dictionary, language, appName, request, response);
      }

      console.log(`> ${chalk.green('[DICTIONARY]')} served in ${language}`);
      response.json(dictionary);
    },
  };

  // eslint-disable-next-line require-await
  async function getDictionaryData(language) {
    // resolve the absolute path of the root data directory
    const resolvedRootPath = nodePath.resolve(dataRootPath);

    // assemble the full dictionary path and normalize to ensure no errant `/` or `\` and that the file path is
    // appropriate for the environment (windows / *nix)
    const filePath = nodePath.normalize(nodePath.join(resolvedRootPath, `${language}.json`));
    return readJsonFile(filePath);
  }

  return service;
}

function watchData(onFileChanged, rootPath, watcherSourcePaths, existingWatcher) {
  if (existingWatcher && existingWatcher.close) {
    existingWatcher.close();
  }

  const watcher = watch(watcherSourcePaths, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    cwd: rootPath,
  })
    .on('all', (event, path) => {
      console.log(`Data file '${chalk.cyan(path)}' changed (${event})`);
      try {
        onFileChanged(path);
      } catch (e) {
        console.error(e);
      }
    })
    .on('error', (error) => console.error(`Disconnected data watcher error: ${error}`));

  console.log('Disconnected server is watching for disconnected data file changes...');

  return watcher;
}

// utility function for reading/parsing a JSON file
async function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      resolve(null);
      return;
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      if (!data) {
        resolve(null);
        return;
      }

      resolve(JSON.parse(data));
    });
  });
}
