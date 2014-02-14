/* global LazyLoader, Normalizer, FxAccountsIACHelper */

'use strict';

navigator.mozL10n.ready(function onL10nReady() {
  LazyLoader.load([
    '/shared/js/fxa_iac_client.js',
    '/shared/js/text_normalizer.js'
  ], function fxa_menu_dependencies_loaded() {
    var menuStatus = document.getElementById('fxa-desc');
    document.addEventListener('visibilitychange', onVisibilityChange);

    // listen for status updates
    onVisibilityChange();

    // start by asking for current status
    refreshStatus();

    function refreshStatus() {
      FxAccountsIACHelper.getAccounts(onStatusChange, onStatusError);
    }

    // if e == null, user is logged out.
    // if e.verified, user is logged in & verified.
    // if !e.verified, user is logged in & unverified.
    function onStatusChange(e) {
      var emailElement = document.createElement('strong'),
        email = e ? Normalizer.escapeHTML(e.email) : '';
      emailElement.textContent = email;

      if (!e) {
        navigator.mozL10n.localize(menuStatus, 'fxa-login');
      } else if (e.verified) {
        navigator.mozL10n.localize(menuStatus, 'fxa-logged-in-text', {
          email: emailElement.innerHTML
        });
      } else { // unverified
        navigator.mozL10n.localize(menuStatus, 'fxa-check-email', {
          email: emailElement.innerHTML
        });
      }
    }

    function onStatusError(e) {
      if (console && console.log) {
        console.log('Error: ' + e.err);
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        FxAccountsIACHelper.removeEventListener('onlogin', refreshStatus);
        FxAccountsIACHelper.removeEventListener(
          'onverifiedlogin', refreshStatus
        );
        FxAccountsIACHelper.removeEventListener('onlogout', refreshStatus);
      } else {
        FxAccountsIACHelper.addEventListener('onlogin', refreshStatus);
        FxAccountsIACHelper.addEventListener('onverifiedlogin', refreshStatus);
        FxAccountsIACHelper.addEventListener('onlogout', refreshStatus);
      }
    }
    
  });
});
