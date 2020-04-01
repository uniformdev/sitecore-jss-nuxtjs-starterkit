<template>
  <div class="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden">
    <div class="rounded-lg shadow-md">
      <div class="rounded-lg bg-white shadow-xs overflow-hidden">
        <div class="px-5 pt-4 flex items-center justify-between">
          <div>
            <div class="h-8 w-auto">
              <logo />
            </div>
          </div>
          <div class="-mr-2">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="px-2 pt-2 pb-3">
          <nav-links />
        </div>
        <div>
          <a
            href="mailto:hi@unfrm.io"
            class="block w-full px-5 py-3 text-center font-medium text-red-600 bg-gray-50 hover:bg-gray-100 hover:text-red-700 focus:outline-none focus:bg-gray-100 focus:text-red-700 transition duration-150 ease-in-out"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
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
