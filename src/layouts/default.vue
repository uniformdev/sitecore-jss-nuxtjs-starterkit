<template>
  <nuxt />
</template>

<style>
/*
  Hides Sitecore Experience Editor markup,
  if you run the app in connected mode while the Sitecore cookies
  are set to edit mode.
*/
.scChromeData,
.scpm {
  display: none !important;
}
</style>
