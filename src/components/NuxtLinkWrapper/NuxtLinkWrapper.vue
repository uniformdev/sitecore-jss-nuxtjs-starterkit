<template>
  <nuxt-link v-if="!isPageEditingOrPreview" :to="resolvedTo" v-bind="$attrs">
    <slot />
  </nuxt-link>
  <a v-else :href="resolvedTo" v-bind="$attrs">
    <slot />
  </a>
</template>

<script>
export default {
  props: {
    to: {
      type: String,
    },
  },
  computed: {
    resolvedTo() {
      if (this.isPageEditingOrPreview) {
        const resolved = `${this.to}${this.to.indexOf('?') !== -1 ? '&' : '?'}sc_site=${
          this.sitecoreContext.site.name
        }`;
        return resolved;
      }
      return this.to;
    },
    isPageEditingOrPreview() {
      const sitecoreContext = this.$store.state.app.sitecoreContext;
      const result =
        sitecoreContext && (sitecoreContext.pageEditing || sitecoreContext.pageState === 'preview');
      return result;
    },
    sitecoreContext() {
      return this.$store.state.app.sitecoreContext;
    },
  },
};
</script>
