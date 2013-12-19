// TODO when we get the user info, we need to plug it into the templates.
// TODO do we need a third screen for "unverified/check your email"?

'use strict';

var Accounts = (function account_settings() {

  var loggedOutPanel, loggedInPanel, loginButton, currentAccount;

  function init() {
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    loginButton = document.getElementById('fxa-login');

    // TODO show a spinner on initial load so that we never show the wrong state?
    currentAccount ? showLoggedInUI() : showLoggedOutUI();

    loadAccountInfo();
  }

  function loadAccountInfo() {
    FxAccountsIACHelper.getAccounts(
      function _onGetAccounts(data) {
        currentAccount = data.accounts && data.accounts[0]; // TODO what's actual response format?
      },
      function _onGetAccountsErr(err) {
        // TODO try again? in a loop w/backoff? or give up?
        console.log('fxaccts errored: ' + err); // XXX debugging
      }
    );
  }

  // show logged in implies hide logged out
  // TODO spinner/overlay for transitioning?
  function showLoggedInUI() {
    loggedInPanel.hidden = false;
    loggedOutPanel.hidden = true;

    // attach logged-in handlers
    // detach logged-out handlers
    loginButton.onclick = null;
  }

  // show logged out implies hide logged in
  function showLoggedOutUI() {
    loggedOutPanel.hidden = false;
    loggedInPanel.hidden = true;

    // attach logged-out handlers
    loginButton.onclick = onLoginButtonClick;

    // detach logged-in handlers
  }

  function onLoginButtonClick() {
    // TODO necessary to e.stopPropagation and/or e.preventDefault ?
    // TODO do I need to disable the button? create an overlay with spinner? set a retry-timeout?
    FxAccountsIACHelper.openFlow(onFxAccountsFlowSuccess, onFxAccountsFlowError);
  }

  function onFxAccountsFlowSuccess(e) {
    debugger;
    // get user info from evt
    // toggle the logged-in screen
  }

  function onFxAccountsFlowError(e) {
    debugger;
    // re-enable button, if disabled
  }
  
  return {
    init: init
  };

})();

// TODO l10n doesn't seem to work?
// navigator.mozL10n.ready(Accounts.init.bind(Accounts));
// debugger; // XXX debugging, used to attach on startup.
Accounts.init();
