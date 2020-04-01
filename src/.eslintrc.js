module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
  extends: [
    '@nuxtjs',
    'prettier',
    'prettier/vue',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended',
  ],
  plugins: ['prettier'],
  // add your custom rules here
  rules: {
    'nuxt/no-cjs-in-config': 'off',
    'no-console': 'off',
    'import/order': 'off',
    'vue/require-default-prop': 'off',
    'standard/no-callback-literal': 'off',
    'unicorn/prefer-includes': 'off',
    'require-await': 'off',
    'vue/order-in-components': 'off',
    'vue/attributes-order': 'off',
  },
};
