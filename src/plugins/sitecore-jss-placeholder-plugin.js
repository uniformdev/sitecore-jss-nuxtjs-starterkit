import Vue from 'vue';
import { SitecoreJssPlaceholderPlugin } from '@sitecore-jss/sitecore-jss-vue';
import componentFactory from '../temp/componentFactory';

Vue.use(SitecoreJssPlaceholderPlugin, { componentFactory });
