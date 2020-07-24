const nodePath = require('path');
const { ManifestManager } = require('@sitecore-jss/sitecore-jss-dev-tools');
const { getConfig } = require('../../../temp/config');

module.exports = initialize;

function initialize(moduleOptions) {
  if (!moduleOptions.enabled) {
    return;
  }

  const jssConfig = getConfig();

  this.options.generate.routes = async () => {
    try {
      const manifestManager = new ManifestManager({
        appName: jssConfig.jssAppName,
        rootPath: nodePath.join(__dirname, '..'),
      });

      const manifestPathMap = [];
      // eslint-disable-next-line no-inner-declarations
      function generateManifestPathMap(route, parentPath, params, depth = 0) {
        // first/initial route should resolve to `/` instead of a named route.
        // i.e. we don't want `/home`, we just want `/` for the first/initial route.
        const routeName = depth === 0 ? '' : route.name;
        const routePath = `${urlJoin(parentPath, routeName).toLowerCase()}`;

        manifestPathMap.push(routePath);

        // traverse the route tree
        if (route.children) {
          route.children.forEach((child) => {
            generateManifestPathMap(child, routePath, params, (depth += 1));
          });
        }
      }

      const languages = jssConfig.appLanguages;
      // If the app has more than one language, we need to generate a path map for each language so
      // we can prefix routes with a language parameter. We also need to modify the nonManifestPathMap
      // routes to add language parameter.
      if (Array.isArray(languages) && languages.length > 1) {
        for (const language of languages) {
          const manifest = await manifestManager.getManifest(language);
          // Prefix manifest routes with language name
          generateManifestPathMap(manifest.items.routes[0], `/${language}`);
        }
      } else {
        const language = jssConfig.defaultLanguage;
        const manifest = await manifestManager.getManifest(language);
        generateManifestPathMap(manifest.items.routes[0], `/`);
      }

      return manifestPathMap;
    } catch (error) {
      console.error(error);
      return [];
    }
  };
}

function urlJoin(...parts) {
  // Trim each part to remove slashes (leading or trailing), then join the parts using a slash.
  const joinedParts = parts.map((part) => trim(part, '/')).join('/');
  // Trim any extraneous slashes from the joined parts, then prefix the result with a slash
  // to ensure a leading slash.
  const url = `/${trim(joinedParts, '/')}`;
  return url;
}

function trim(str, char) {
  function getSliceStartIndex(str1) {
    let startCharIndex = -1;
    while (str1.charAt(++startCharIndex) === char);
    return startCharIndex;
  }

  function getSliceEndIndex(str1) {
    let endCharIndex = str1.length;
    while (str1.charAt(--endCharIndex) === char);
    return endCharIndex + 1;
  }
  return str.slice(getSliceStartIndex(str), getSliceEndIndex(str));
}
