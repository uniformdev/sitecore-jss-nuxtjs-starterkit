<!--
    NOTE: this file is named `_.vue` to handle unknown dynamic nested routes:
    https://nuxtjs.org/guide/routing#unknown-dynamic-nested-routes
-->

<template>
  <div>
    <loading-overlay
      :active.sync="routeDataLoading"
      :can-cancel="true"
      :on-cancel="handleLoadingCancel"
      :is-full-page="true"
    />
    <sc-placeholder name="uniform-jss-content" :rendering="routeData" />
  </div>
</template>

<script>
import { Placeholder } from '@sitecore-jss/sitecore-jss-vue';
import { mapState } from 'vuex';
// note: `vue-loading-overlay` can be replaced by something custom, it was put in place as a sample
// styles for the overlay are in `assets/css/vue-loading-overlay.css`
import LoadingOverlay from 'vue-loading-overlay';
/* purgecss start ignore */
import '~/assets/css/vue-loading-overlay.css';
/* purgecss end ignore */

export default {
  components: {
    ScPlaceholder: Placeholder,
    LoadingOverlay,
  },
  // Be sure to declare `head` as a function if you need to access component data, props,
  // computed properties, etc... within any of the `head` properties.
  head() {
    return {
      title: this.metaTitle,
    };
  },
  computed: mapState({
    metaTitle: (state) => {
      const routeData = state.app.routeData;
      const title =
        (routeData &&
          routeData.fields &&
          routeData.fields.pageTitle &&
          routeData.fields.pageTitle.value) ||
        'Nuxt + JSS + Uniform FTW!';
      return title;
    },
    routeData: (state) => state.app.routeData || { fields: {} },
    routeDataLoading: (state) => state.app.routeDataFetchStatus === 'loading',
  }),
  methods: {
    handleLoadingCancel() {
      // todo: may need to notify the state manager and attempt to cancel the request if possible.
      console.log('loading canceled');
    },
  },
  // We use `fetch` instead of `asyncData` to retrieve layout service data.
  // `fetch` allows us to fill the Vuex store before rendering, but doesn't set
  // the component data/state (which is what `asyncData` does).
  fetch(context) {
    const { store, params, res, error, $jss } = context;

    const resolvedRoute = params.sitecoreRoute || '/';

    return store
      .dispatch('app/getLayoutData', {
        route: resolvedRoute,
        language: $jss.getCurrentLanguage(),
        nuxtContext: context,
      })
      .then((result) => {
        if (!store.state.app.routeData) {
          // If no route data was fetched, then:

          // Set a status code on the response. Note: `res` is only defined during SSR.
          // `actualStatusCode` can be added by the Nuxt server so that we can obtain
          // the status code returned by any proxy requests. Otherwise, Nuxt will
          // default to 200 status code.
          if (res && res.actualStatusCode) {
            res.statusCode = res.actualStatusCode;
          }

          const props = {
            // Pass a statusCode as prop for any interested components.
            statusCode: res && res.statusCode,
            // Also be sure to pass the context data returned by Layout Service (if any).
            sitecoreContext: store.state.app.sitecoreContext,
          };

          // Call the `error` function provided by Nuxt context.
          error({
            statusCode: res && res.statusCode,
            props,
          });
        }
      })
      .catch((err) => {
        console.error('An error occurred in data retrieval', err);
      });
  },
};
</script>
