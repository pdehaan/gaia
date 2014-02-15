/* global FxaMenu, LazyLoader */

'use strict';

navigator.mozL10n.ready(function onL10nReady() {
  LazyLoader.load([
    '/shared/js/fxa_iac_client.js',
    '/shared/js/text_normalizer.js',
    'js/firefox_accounts/menu.js'
  ], function fxa_menu_loaded() {
    FxaMenu.init();
  });
});
