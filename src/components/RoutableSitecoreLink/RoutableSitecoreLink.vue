<template>
  <!-- only want to apply the routing link if not editing (if editing, need to render editable link value) -->
  <nuxt-link
    v-if="hasValidHref && !isEditing"
    :to="field.value.href"
    :class="field.value.class"
    :title="field.value.title"
    :target="field.value.target"
  >
    <slot>{{ field.value.text || field.value.href }}</slot>
  </nuxt-link>
  <sc-link v-else :field="field">
    <slot>{{ field.value.text || field.value.href }}</slot>
  </sc-link>
</template>

<script>
import { Link } from '@sitecore-jss/sitecore-jss-vue';

export default {
  components: {
    ScLink: Link,
  },
  props: {
    field: {
      type: Object,
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    hasValidHref() {
      return (
        this.field &&
        this.field.value &&
        this.props.field.value.href &&
        this.props.field.value.href.startsWith('/')
      );
    },
    isEditing() {
      return this.editable && this.field.editable;
    },
  },
};
</script>
