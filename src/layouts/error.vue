<template>
  <div>
    <h1 v-if="error.statusCode === 404">Page not found</h1>
    <h1 v-else>
      An error occurred: status {{ error.statusCode }}. Check the server console / logs.
    </h1>
    <p>
      Site: {{ siteName }}
      <br />
      Language: {{ language }}
    </p>
    <a href="/" class="button--green">Go to Home page</a>
  </div>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
    },
  },
  computed: {
    sitecoreContext() {
      const context = this.error.props && this.error.props.sitecoreContext;
      return context || { site: {} };
    },
    siteName() {
      return this.sitecoreContext.site && this.sitecoreContext.site.name;
    },
    language() {
      return this.sitecoreContext.language;
    },
  },
};
</script>
