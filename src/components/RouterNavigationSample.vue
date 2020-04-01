<template>
  <div
    class="d-flex flex-column flex-md-row align-items-center p-3 px-md-4 mb-3 bg-white border-bottom"
  >
    <h5 class="my-0 mr-md-auto font-weight-normal">
      <nuxt-link to="/" class="text-dark">
        <img src="/sc_logo.png" alt="Sitecore" />
      </nuxt-link>
    </h5>
    <nav class="my-2 my-md-0 mr-md-3">
      <a
        class="p-2 text-dark"
        href="https://jss.sitecore.net"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ $jss.translate('Documentation') }}
      </a>
      <nuxt-link to="/styleguide" class="p-2 text-dark">
        {{ $jss.translate('Styleguide') }}
      </nuxt-link>
      <nuxt-link to="/graphql" class="p-2 text-dark">
        {{ $jss.translate('GraphQL') }}
      </nuxt-link>
    </nav>
  </div>
</template>
