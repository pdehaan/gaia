// TODO what is user info format?
// TODO do we need transitions for moving between logged in/out screens?
// TODO do we need a third screen for "unverified/check your email"?
// TODO do we want to disable some buttons after clicking?
// TODO l10n!

'use strict';

var Accounts = (function account_settings() {

  var loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    overlayPanel,
    loginBtn,
    logoutBtn,
    deleteAccountBtn,
    loggedInUser,
    currentState = 'unknown',
    currentUser;

  function init() {
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    overlayPanel = document.getElementById('fxa-overlay');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    deleteAccountBtn = document.getElementById('fxa-delete-account');
    loggedInEmail = document.getElementById('fxa-logged-in-email');

    FxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
    FxAccountsIACHelper.addEventListener('onlogin', refreshState);
    FxAccountsIACHelper.addEventListener('onverifiedlogin', refreshState);
    FxAccountsIACHelper.addEventListener('onlogout', refreshState);
  }

  function refreshState() {
    // TODO throttle or debounce if we are already refreshing state
    FxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
  }

  // TODO guessing data format is { user: 'foo@bar.com', state: 'verified' }
  // TODO guessing states are 'verified', 'unverified', 'loggedout', and null,
  //      which we treat as 'unknown'
  function onFxAccountStateChange(data) {
    // bail if the state is unchanged
    if (!data && currentState == 'unknown' ||
        currentState == data.state && currentUser == data.user) {
      return;
    }

    // else assign it and update the DOM
    currentUser = data && data.user;
    currentState = data && data.state || 'unknown';

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

  function onFxAccountError(err) {
    // TODO log error? retry?
  }

  function hideLoggedOutPanel() {
    loginBtn.onclick = null;
    loggedOutPanel.hidden = true;
  }

  function showLoggedOutPanel() {
    loginBtn.onclick = FxAccountsIACHelper.openFlow(
      onFxAccountStateChange, onFxAccountError);
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
    loggedInEmail.textContent = currentUser;
    loggedInPanel.hidden = false;
    logoutBtn.onclick = FxAccountsIACHelper.logout(
      onFxAccountStateChange, onFxAccountError);
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

  function showSpinner() {
    overlayPanel.hidden = false;
    setTimeout(function() { overlayPanel.hidden = true }, 2000);
  }

  // TODO need to return anything else?
  return {
    init: init
  };

})();

navigator.mozL10n.ready(Accounts.init());
