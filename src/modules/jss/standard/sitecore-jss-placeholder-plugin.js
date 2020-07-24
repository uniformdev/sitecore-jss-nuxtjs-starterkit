import Vue from 'vue';
import { SitecoreJssPlaceholderPlugin } from '@sitecore-jss/sitecore-jss-vue';
import componentFactory from '~/temp/componentFactory';

export default function initialize(context) {
  Vue.use(SitecoreJssPlaceholderPlugin, { componentFactory });
}
