const serveStatic = require('serve-static');
const path = require('path');
const fs = require('fs');
const {
  createDisconnectedDictionaryService,
  ManifestManager,
  createDisconnectedLayoutService,
} = require('@sitecore-jss/sitecore-jss-dev-tools');

module.exports = {
  getDisconnectedModeMiddlewares,
};

async function getDisconnectedModeMiddlewares({ jssConfig }) {
  const touchToReloadFilePath = path.resolve(path.join(__dirname, '../../../temp/config.js'));

  const options = {
    appRoot: path.join(__dirname, '../../../'),
    appName: jssConfig.jssAppName,
    watchPaths: [path.join(__dirname, '../../../data')],
    language: jssConfig.defaultLanguage,
    onManifestUpdated: (manifest) => {
      // if we can resolve the config file, we can alter it to force reloading the app automatically
      // instead of waiting for a manual reload. We must materially alter the _contents_ of the file to trigger
      // an actual reload, so we append "// reloadnow" to the file each time. This will not cause a problem,
      // since every build regenerates the config file from scratch and it's ignored from source control.
      if (fs.existsSync(touchToReloadFilePath)) {
        const currentFileContents = fs.readFileSync(touchToReloadFilePath, 'utf8');
        const newFileContents = `${currentFileContents}\n// reloadnow`;
        fs.writeFileSync(touchToReloadFilePath, newFileContents, 'utf8');

        console.log('Manifest data updated. Reloading the browser.');
      } else {
        console.log('Manifest data updated. Refresh the browser to see latest content!');
      }
    },
  };

  // the manifest manager maintains the state of the disconnected manifest data during the course of the dev run
  // it provides file watching services, and language switching capabilities
  const manifestManager = new ManifestManager({
    appName: options.appName,
    rootPath: options.appRoot,
    watchOnlySourceFiles: options.watchPaths,
    requireArg: options.requireArg,
    sourceFiles: options.sourceFiles,
  });

  return manifestManager.getManifest(options.language).then((manifest) => {
    // creates a fake version of the Sitecore Layout Service that is powered by your disconnected manifest file
    const layoutService = createDisconnectedLayoutService({
      manifest,
      manifestLanguageChangeCallback: manifestManager.getManifest,
      customizeContext: options.customizeContext,
      customizeRoute: options.customizeRoute,
      customizeRendering: options.customizeRendering,
    });

    // creates a fake version of the Sitecore Dictionary Service that is powered by your disconnected manifest file
    const dictionaryService = createDisconnectedDictionaryService({
      manifest,
      manifestLanguageChangeCallback: manifestManager.getManifest,
    });

    // set up live reloading of the manifest when any manifest source file is changed
    manifestManager.setManifestUpdatedCallback((newManifest) => {
      layoutService.updateManifest(newManifest);
      dictionaryService.updateManifest(newManifest);
      if (options.onManifestUpdated) {
        options.onManifestUpdated(newManifest);
      }
    });

    // define our disconnected service middlewares
    return [
      { path: '/assets', handler: serveStatic(path.join(options.appRoot, 'assets')) },
      { path: '/data/media', handler: serveStatic(path.join(options.appRoot, 'data/media')) },
      { path: '/sitecore/api/layout/render', handler: layoutService.middleware },
      {
        path: '/sitecore/api/jss/dictionary/:appName/:language',
        handler: dictionaryService.middleware,
      },
    ];
  });
}
