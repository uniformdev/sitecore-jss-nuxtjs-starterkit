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
      :is-full-page="fullPage"
      :height="height"
      :width="width"
      :color="color"
      :loader="loader"
      :background-color="bgColor"
      :transition="transition"
      :opacity="opacity"
    />
    <sc-placeholder name="uniform-jss-kit-content" :rendering="routeData" />
    <Footer />
  </div>
</template>

<script>
import { Placeholder } from '@sitecore-jss/sitecore-jss-vue';
import { mapState } from 'vuex';
import Footer from '../components/Footer/Footer';
// note: `vue-loading-overlay` can be replaced by something custom, it was put in place as a sample
// styles for the overlay are declared in the `<style />` section of this component.
import LoadingOverlay from 'vue-loading-overlay';

export default {
  data() {
    return {
      fullPage: true,
      canCancel: true,
      loader: '',
      color: '#fff',
      bgColor: '#fff',
      height: 128,
      width: 128,
      transition: 'fade',
      opacity: 0.3,
    };
  },
  components: {
    ScPlaceholder: Placeholder,
    LoadingOverlay,
    Footer,
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
  // We use `middleware` instead of `asyncData` or `fetch` to retrieve layout service data.
  // `middleware` allows us to fill the Vuex store before rendering, but doesn't set
  // the component data/state (which is what `asyncData` does).
  middleware(context) {
    const { store, params, res, error, $jss } = context;

    const resolvedRoute = params.sitecoreRoute || '/';

    return store
      .dispatch('app/getLayoutData', {
        route: resolvedRoute,
        language: $jss.getCurrentLanguage(),
        nuxtContext: context,
      })
      .then(() => {
        if (store.state.app.routeDataFetchStatus === 'error') {
          // If no route data was fetched, then:

          // Set a status code on the response. Note: `res` is only defined during SSR.
          // `actualStatusCode` can be added by the Nuxt server so that we can obtain
          // the status code returned by any proxy requests. Otherwise, Nuxt will
          // default to 200 status code.
          const statusCode =
            res &&
            (res.actualStatusCode ||
              store.state.app.routeDataFetchError?.response?.status ||
              res.statusCode);

          if (res) {
            res.statusCode = statusCode;
          }

          const props = {
            // Pass a statusCode as prop for any interested components.
            statusCode,
            // Also be sure to pass the context data returned by Layout Service (if any).
            sitecoreContext: store.state.app.sitecoreContext,
          };

          // Call the `error` function provided by Nuxt context.
          error({
            statusCode,
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

<!--
note: styles for the loading overlay component are declared here instead of in a separate file.
This is primarily to avoid an issue with purgeCSS being too aggressive during production build
and removing the separate file containing overlay component styles.
-->
<style>
.vld-overlay {
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  align-items: center;
  display: none;
  justify-content: center;
  overflow: hidden;
  z-index: 9999;
}

.vld-overlay.is-active {
  display: flex;
}

.vld-overlay.is-full-page {
  z-index: 9999;
  position: fixed;
}

.vld-overlay .vld-background {
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  background: #fff;
  opacity: 0.5;
}

.vld-overlay .vld-icon,
.vld-parent {
  position: relative;
}
</style>
