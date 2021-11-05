<template>
  <div class="relative bg-gray-50 overflow-hidden">
    <div class="hidden sm:block sm:absolute sm:inset-y-0 sm:h-full sm:w-full">
      <div class="relative h-full max-w-screen-xl mx-auto">
        <svg
          class="absolute right-full transform translate-y-1/4 translate-x-1/4 lg:translate-x-1/2"
          width="404"
          height="784"
          fill="none"
          viewBox="0 0 404 784"
        >
          <defs>
            <pattern
              id="svg-pattern-squares-1"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="784" fill="url(#svg-pattern-squares-1)" />
        </svg>
        <svg
          class="
            absolute
            left-full
            transform
            -translate-y-3/4 -translate-x-1/4
            md:-translate-y-1/2
            lg:-translate-x-1/2
          "
          width="404"
          height="784"
          fill="none"
          viewBox="0 0 404 784"
        >
          <defs>
            <pattern
              id="svg-pattern-squares-2"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="784" fill="url(#svg-pattern-squares-2)" />
        </svg>
      </div>
    </div>
    <div class="relative pt-6 pb-12 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
      <menu-mobile v-if="isMenuOpen" :on-toggle-menu="handleMenuToggle" />
      <menu-desktop v-else :on-toggle-menu="handleMenuToggle" />
      <div class="mt-10 mx-auto max-w-screen-xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 xl:mt-28">
        <div class="text-center">
          <h2
            class="
              text-4xl
              tracking-tight
              leading-10
              font-extrabold
              text-gray-900
              sm:text-5xl sm:leading-none
              md:text-6xl
            "
          >
            <sc-text :field="fields.title" />
            <br class="xl:hidden" />
            <sc-text :field="fields.subtitle" tag="span" class="text-red-500" />
          </h2>
          <p
            class="
              mt-3
              max-w-md
              mx-auto
              text-base text-gray-500
              sm:text-lg
              md:mt-5 md:text-xl md:max-w-3xl
            "
          >
            <sc-text :field="fields.text" />
          </p>
          <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div v-if="primaryCTA.title && primaryCTA.link" class="rounded-md shadow">
              <RoutableSitecoreLink
                :field="fields.primaryCTALink"
                class="
                  w-full
                  flex
                  items-center
                  justify-center
                  px-8
                  py-3
                  border border-transparent
                  text-base
                  leading-6
                  font-medium
                  rounded-md
                  text-white
                  bg-red-500
                  hover:bg-red-500
                  focus:outline-none focus:shadow-outline-red
                  transition
                  duration-150
                  ease-in-out
                  md:py-4 md:text-lg md:px-10
                "
              >
                <sc-text :field="fields.primaryCTATitle" />
              </RoutableSitecoreLink>
            </div>
            <div
              v-if="secondaryCTA.title && secondaryCTA.link"
              class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3"
            >
              <RoutableSitecoreLink
                :field="fields.secondaryCTALink"
                class="
                  w-full
                  flex
                  items-center
                  justify-center
                  px-8
                  py-3
                  border border-transparent
                  text-base
                  leading-6
                  font-medium
                  rounded-md
                  text-red-500
                  bg-white
                  hover:text-red-500
                  focus:outline-none focus:shadow-outline-blue
                  transition
                  duration-150
                  ease-in-out
                  md:py-4 md:text-lg md:px-10
                "
              >
                <sc-text :field="fields.secondaryCTATitle" />
              </RoutableSitecoreLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Text, Link } from '@sitecore-jss/sitecore-jss-vue';
import MenuDesktop from './MenuDesktop';
import MenuMobile from './MenuMobile';
import RoutableSitecoreLink from '../RoutableSitecoreLink/RoutableSitecoreLink';

export default {
  components: {
    MenuDesktop,
    MenuMobile,
    ScText: Text,
    ScLink: Link,
    RoutableSitecoreLink,
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
