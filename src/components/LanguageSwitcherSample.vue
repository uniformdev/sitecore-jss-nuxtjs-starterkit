<template>
  <div>
    <div>Current language: {{ $jss.getCurrentLanguage() }}</div>
    change language:
    <select :value="$jss.getCurrentLanguage()" @change="changeAppLanguage">
      <option v-for="language in languages" :key="language">{{ language }}</option>
    </select>
  </div>
</template>
<script>
export default {
  name: 'LanguageSwitcher',
  created() {
    this.languages = ['en', 'da-DK'];
  },
  methods: {
    changeAppLanguage(e) {
      this.$jss.changeLanguage(e.target.value);
    },
  },
};
</script>
