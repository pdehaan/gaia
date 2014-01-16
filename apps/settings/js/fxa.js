/**
 * Model code - fetches and holds state, updates the panel/menu as needed.
 */

// TODO Assuming getAccounts() responses are of the form
//      user: { id: string, verified: boolean, email: email }
//      there might be a sessionToken, but I don't need it I think.
//      --> it is not clear what the logged out response looks like.
// TODO do we want to disable some buttons after clicking?
// TODO l10n!

'use strict';

var Fxa = (function fxa() {
    var currentState = 'unknown',
      currentEmail;

  function init() {
    FxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
    FxAccountsIACHelper.addEventListener('onlogin', refreshState);
    FxAccountsIACHelper.addEventListener('onverifiedlogin', refreshState);
    FxAccountsIACHelper.addEventListener('onlogout', refreshState);
    // TODO need to remove listeners on document.hidden?
  }

  function refreshState() {
    // TODO throttle or debounce if we are already refreshing state
    FxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
  }

  function onFxAccountStateChange(data) {
    var state, email;
    if (!data) {
      state = 'unknown';
      email = null;
    } else if ('verified' in data) {
      state = data.verified ? 'verified' : 'unverified';
      email = data.email;
    } else {
      state = 'loggedout';
      email = null;
    }

    if (currentState != state || currentEmail != email) {
      currentState = state;
      currentEmail = email;
      updateViews(state, email);
    }
  }

  function updateViews(state, email) {
    var event = new CustomEvent('fxaccountchange', {
      state: state,
      email: email
    });
    window.dispatchEvent(event);
  }

  function onFxAccountError(err) {
    console.error(err.msg);
    // TODO maybe show overlay with error?
  }

  /* Hiding the IAC helper from the views. TODO too much abstraction? */
  function onLogout(e) {
    FxAccountsIACHelper.logout(onFxAccountStateChange, onFxAccountError);
  }

  function onLogin(e) {
    FxAccountsIACHelper.openFlow(onFxAccountStateChange, onFxAccountError);
  }

  // TODO need to return anything else?
  return {
    init: init,
    onLogout: onLogout,
    onLogin: onLogin
  };
})();

// TODO init on 'panelready', not before.
navigator.mozL10n.ready(Fxa.init());
