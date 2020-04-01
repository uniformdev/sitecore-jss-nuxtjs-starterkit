<template>
  <div class="pt-6 px-4 sm:px-6 lg:px-8">
    <nav class="relative flex items-center justify-between sm:h-10 lg:justify-start">
      <div class="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
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
      <div class="hidden md:block md:ml-10 md:pr-4">
        <nav-links />
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
