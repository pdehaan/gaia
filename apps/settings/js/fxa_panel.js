/**
 * UI code for the firefox accounts panel
 *
 */
// TODO do we want to disable some buttons after clicking?
// TODO how do we get initial state from the model?

'use strict';

var FxaPanel = (function fxa_panel() {
  var loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    overlayPanel,
    loginBtn,
    logoutBtn,
    deleteAccountBtn,
    isVisible;

  function init() {
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    overlayPanel = document.getElementById('fxa-overlay');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    deleteAccountBtn = document.getElementById('fxa-delete-account');
    loggedInEmail = document.getElementById('fxa-logged-in-email');

    window.addEventListener('fxaccountchange', onFxaChange);
  }

  // TODO if not visible, bail.
  function onFxaChange(e) {
    var currentState = e.state,
      currentEmail = e.email;

    if (currentState == 'verified') {
      showSpinner();
      showLoggedInPanel();
      hideLoggedOutPanel();
      hideUnverifiedPanel();
    } else if (currentState == 'unverified') {
      showSpinner();
      showUnverifiedPanel();
      hideLoggedOutPanel();
      hideLoggedInPanel();
    } else if (currentState == 'loggedout') {
      showSpinner();
      showLoggedOutPanel();
      hideLoggedInPanel();
      hideUnverifiedPanel();
    } else {
      // TODO accountState == 'unknown', display some TBD interstitial state
    }
  }

  function hideLoggedOutPanel() {
    loginBtn.onclick = null;
    loggedOutPanel.hidden = true;
  }

  function showLoggedOutPanel() {
    loginBtn.onclick = Fxa.onLogin;
    loggedOutPanel.hidden = false;
  }

  function hideLoggedInPanel() {
    loggedInPanel.hidden = true;
    loggedInEmail.textContent = '';
    logoutBtn.onclick = null;
    deleteAccountBtn.onclick = null;
  }

  function showLoggedInPanel() {
    // TODO how to escape this text?
    loggedInEmail.textContent = currentEmail;
    loggedInPanel.hidden = false;
    logoutBtn.onclick = Fxa.onLogout;
    // TODO insert bug number tracking this feature
    deleteAccountBtn.onclick = alert('delete not yet implemented');
  }

  function hideUnverifiedPanel() {
    unverifiedPanel.hidden = true;
    // TODO wire up other elements
  }

  function showUnverifiedPanel() {
    unverifiedPanel.hidden = false;
    // TODO wire up other elements
  }

  // TODO spinner also hides itself. come up with a better name.
  function showSpinner() {
    overlayPanel.hidden = false;
    setTimeout(function() { overlayPanel.hidden = true }, 2000);
  }

  // TODO need to return anything else?
  return {
    init: init
  };

})();

navigator.mozL10n.ready(FxaPanel.init());
