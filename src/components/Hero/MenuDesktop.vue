<template>
  <div class="max-w-screen-xl mx-auto px-4 sm:px-6">
    <nav class="relative flex items-center justify-between sm:h-10 md:justify-center">
      <div class="flex items-center flex-1 md:absolute md:inset-y-0 md:left-0">
        <div class="flex items-center justify-between w-full md:w-auto">
          <div class="h-8 w-auto sm:h-10">
            <logo />
          </div>
          <div class="-mr-2 flex items-center md:hidden">
            <button
              type="button"
              @:click="handleMenuToggleClick"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
            >
              <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="hidden md:block">
        <nav-links />
      </div>
      <div
        class="hidden md:absolute md:flex md:items-center md:justify-end md:inset-y-0 md:right-0"
      >
        <span class="inline-flex rounded-md shadow">
          <a
            href="mailto:hi@unfrm.io"
            class="inline-flex items-center px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-red-500 bg-white hover:text-red-500 focus:outline-none focus:shadow-outline-blue active:bg-gray-50 active:text-red-700 transition duration-150 ease-in-out"
          >
            Contact Us
          </a>
        </span>
      </div>
    </nav>
  </div>
</template>

<script>
import Logo from '../Logo/Logo';
import NavLinks from '../NavLinks/NavLinks';

export default {
  components: {
    Logo,
    NavLinks,
  },
  props: {
    onToggleMenuClick: {
      type: Function,
    },
  },
  methods: {
    handleMenuToggleClick() {
      this.onToggleMenuClick();
    },
  },
};
</script>
