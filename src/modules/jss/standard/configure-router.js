module.exports = {
  configureRouter,
};

function configureRouter(nuxtConfig) {
  const originalExtendRoutes = nuxtConfig.router.extendRoutes;
  nuxtConfig.router.extendRoutes = (routes, resolve) => {
    // If there is an existing `extendRoutes` config customization, allow it to run.
    if (typeof originalExtendRoutes === 'function') {
      originalExtendRoutes(routes, resolve);
    }

    // We want JSS route patterns to be first in the `routes` array, so we use `unshift` to
    // insert them at the beginning of the array.
    // We also want the JSS route patterns inserted by most "complex" pattern to least "complex",
    // so we order them in reverse in the `routePatterns` array, so that most complex pattern
    // will end up being first in the routes array.
    const routePatterns = [
      '/:sitecoreRoute*',
      '/:lang([a-z]{2})/:sitecoreRoute*',
      '/:lang([a-z]{2}-[A-Z]{2})/:sitecoreRoute*',
    ];
    routePatterns.forEach((routePattern) => {
      routes.unshift({
        path: routePattern,
        components: {
          default: resolve(__dirname, '../../../pages/_.vue'),
        },
      });
    });
  };
}
