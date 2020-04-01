export const actions = {
  // `nuxtServerInit` is only invoked if it is defined in the `store/index.js` file. It will not be automatically
  // invoked if it is defined in a store module, e.g. `store/app/index.js`
  // That said, we can still define a `nuxtServerInit` within a store module and simply call it from the "root"
  // `nuxtServerInit` function, like below.
  // https://nuxtjs.org/guide/vuex-store#the-nuxtserverinit-action
  nuxtServerInit(context, nuxtContext) {
    context.dispatch('app/nuxtServerInit', nuxtContext);
  },
};
