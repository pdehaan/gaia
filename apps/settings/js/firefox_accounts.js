/* global Normalizer, FxAccountsIACHelper */

'use strict';

var FxaPanel = (function fxa_panel() {
  var fxaContainer,
    loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    overlayPanel,
    loginBtn,
    logoutBtn,
    loggedInEmail,
    unverifiedEmail;

  function init() {
    fxaContainer = document.getElementById('fxa-container');
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    loggedInEmail = document.getElementById('fxa-logged-in-text');
    unverifiedEmail = document.getElementById('fxa-unverified-text');

    // listen for changes
    onVisibilityChange();
    // start by checking current status
    refreshStatus();
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      FxAccountsIACHelper.removeEventListener('onlogin', refreshStatus);
      FxAccountsIACHelper.removeEventListener('onverifiedlogin', refreshStatus);
      FxAccountsIACHelper.removeEventListener('onlogout', refreshStatus);
    } else {
      FxAccountsIACHelper.addEventListener('onlogin', refreshStatus);
      FxAccountsIACHelper.addEventListener('onverifiedlogin', refreshStatus);
      FxAccountsIACHelper.addEventListener('onlogout', refreshStatus);
    }
  }

  function refreshStatus() {
    FxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
  }

  // if data == null, user is logged out.
  // if data.verified, user is logged in & verified.
  // if !data.verified, user is logged in & unverified.
  function onFxAccountStateChange(data) {
    var email = data ? Normalizer.escapeHTML(data.email) : '';

    if (!data) {
      showSpinner();
      showLoggedOutPanel();
      hideLoggedInPanel();
      hideUnverifiedPanel();
    } else if (data.verified) {
      showSpinner();
      showLoggedInPanel(email);
      hideLoggedOutPanel();
      hideUnverifiedPanel();
    } else {
      showSpinner();
      showUnverifiedPanel(email);
      hideLoggedOutPanel();
      hideLoggedInPanel();
    }
  }

  function onFxAccountError(err) {
    console.error('FxaPanel: Error getting Firefox Account: ' + err.error);
  }

  function showSpinner() {
    if (!overlayPanel) {
      overlayPanel = document.createElement('div');
      overlayPanel.id = 'fxa-overlay';
      fxaContainer.appendChild(overlayPanel);
    }
    overlayPanel.classList.add('show');
    setTimeout(hideSpinner, 200);
  }

  function hideSpinner() {
    overlayPanel.classList.remove('show');
  }

  function hideLoggedOutPanel() {
    loginBtn.onclick = null;
    loggedOutPanel.hidden = true;
  }

  function showLoggedOutPanel() {
    loginBtn.onclick = onLoginClick;
    loggedOutPanel.hidden = false;
  }

  function hideLoggedInPanel() {
    loggedInPanel.hidden = true;
    loggedInEmail.textContent = '';
    logoutBtn.onclick = null;
  }

  function showLoggedInPanel(email) {
    var emailElement = document.createElement('strong');
    emailElement.textContent = email;
    navigator.mozL10n.localize(loggedInEmail, 'fxa-logged-in-text', {
      email: emailElement.innerHTML
    });
    loggedInPanel.hidden = false;
    logoutBtn.onclick = onLogoutClick;
  }

  function hideUnverifiedPanel() {
    unverifiedPanel.hidden = true;
    unverifiedEmail.textContent = '';
  }

  function showUnverifiedPanel(email) {
    var emailElement = document.createElement('strong');
    emailElement.textContent = email;
    unverifiedPanel.hidden = false;
    navigator.mozL10n.localize(unverifiedEmail, 'fxa-verification-email-sent', {
      email: emailElement.innerHTML
    });
  }

  function onLogoutClick(e) {
    e.stopPropagation();
    e.preventDefault();
    FxAccountsIACHelper.logout(onFxAccountStateChange, onFxAccountError);
  }

  function onLoginClick(e) {
    e.stopPropagation();
    e.preventDefault();
    FxAccountsIACHelper.openFlow(onFxAccountStateChange, onFxAccountError);
  }

  return {
    init: init,
    showSpinner: showSpinner // exposed for unit testing
  };

})();

navigator.mozL10n.ready(function onL10nReady() {
  function onPanelReady() {
    FxaPanel.init();
    window.removeEventListener('panelready', onPanelReady);
  }
  window.addEventListener('panelready', onPanelReady);
});
