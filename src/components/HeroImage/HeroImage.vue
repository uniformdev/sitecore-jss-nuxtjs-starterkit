<template>
  <div class="relative bg-white overflow-hidden">
    <div class="max-w-screen-xl mx-auto ">
      <div
        class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32"
      >
        <menu-mobile v-if="isMenuOpen" :on-toggle-menu="handleMenuToggle" />
        <menu-desktop v-else :on-toggle-menu="handleMenuToggle" />
        <div
          class="mt-10 mx-auto max-w-screen-xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28"
        >
          <div class="sm:text-center lg:text-left">
            <h2
              class="text-4xl tracking-tight leading-10 font-extrabold text-gray-900 sm:text-5xl sm:leading-none md:text-6xl"
            >
              <sc-text :field="fields.title" />
              <br class="xl:hidden" />
              <sc-text :field="fields.subtitle" tag="span" class="text-red-500" />
            </h2>
            <p
              class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
            >
              <sc-text :field="fields.text" />
            </p>
            <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              <div v-if="primaryCTA.title && primaryCTA.link" class="rounded-md shadow">
                <sc-link
                  :field="fields.primaryCTALink"
                  class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-red-500 hover:bg-red-500 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
                >
                  <sc-text :field="fields.primaryCTATitle" />
                </sc-link>
              </div>
              <div
                v-if="secondaryCTA.title && secondaryCTA.link"
                class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3"
              >
                <sc-link
                  :field="fields.secondaryCTALink"
                  class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-red-700 bg-red-100 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:shadow-outline focus:border-red-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
                >
                  <sc-text :field="fields.secondaryCTATitle" />
                </sc-link>
              </div>
            </div>
          </div>
        </div>
        <svg
          class="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
          fill="currentColor"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points="50,0 100,0 50,100 0,100" />
        </svg>
      </div>
    </div>
    <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
      <!-- NOTE: the field named `image` is actually a text field containing a URL for the image -->
      <img
        class="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
        :src="fields.image.value"
        alt=""
      />
    </div>
  </div>
</template>

<script>
import { Text, Link } from '@sitecore-jss/sitecore-jss-vue';
import MenuDesktop from './MenuDesktop';
import MenuMobile from './MenuMobile';

export default {
  components: {
    MenuDesktop,
    MenuMobile,
    ScText: Text,
    ScLink: Link,
  },
  data() {
    return {
      isMenuOpen: false,
    };
  },
  props: {
    fields: {
      type: Object,
    },
  },
  methods: {
    handleMenuToggle() {
      this.isMenuOpen = !this.isMenuOpen;
    },
  },
  computed: {
    primaryCTA() {
      return {
        title: this.fields.primaryCTATitle && this.fields.primaryCTATitle.value,
        link:
          this.fields.primaryCTALink &&
          this.fields.primaryCTALink.value &&
          this.fields.primaryCTALink.value.href,
      };
    },
    secondaryCTA() {
      return {
        title: this.fields.secondaryCTATitle && this.fields.secondaryCTATitle.value,
        link:
          this.fields.secondaryCTALink &&
          this.fields.secondaryCTALink.value &&
          this.fields.secondaryCTALink.value.href,
      };
    },
  },
};
</script>
