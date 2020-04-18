<template>
  <nuxt-link-wrapper
    to="/about"
    class="font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition duration-150 ease-in-out"
  >
    About
  </nuxt-link-wrapper>
</template>

<script>
import NuxtLinkWrapper from '../NuxtLinkWrapper/NuxtLinkWrapper';
export default {
  components: {
    NuxtLinkWrapper,
  },
};
</script>
