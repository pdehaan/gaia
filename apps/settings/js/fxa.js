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

navigator.mozL10n.ready(Fxa.init());





/**
 * UI code for the firefox accounts menu entry in the settings panel
 */
// TODO how do we get the initial state from the model?

var FxaMenu = (function fxa_menu() {
  function init() {
    var _ = navigator.mozL10n.get;
    var fxaMenuDesc = document.getElementById('fxa-desc'),

    onVisibilityChange();
  }

  function onFxaChange(data) {
    var email = data.email,
      state = data.state;
    if (state == 'verified') {
      // TODO escape email
      fxaMenuDesc.text = _('Logged in as ') + email;
    } else if (state == 'unverified') {
      fxaMenuDesc.text = _('Please check your email');
    } else if (state == 'loggedout') {
      fxaMenuDesc.text = _('Log in to access your acct.');
    } else {
      // state == 'unknown', display nothing
      fxaMenuDesc.text = '';
    }
  }

  function onVisibilityChange(e) {
    if (document.hidden) {
      window.removeEventListener('fxaccountchange', onFxaChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    } else {
      window.addEventListener('fxaccountchange', onFxaChange);
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
  }

  // TODO return things & stuff
  return {};
});

// starting when we get a chance
navigator.mozL10n.ready(function loadWhenIdle() {
  var idleObserver = {
    time: 5,
    onidle: function() {
      FxaMenu.init();
      navigator.removeIdleObserver(idleObserver);
    }
  };
  navigator.addIdleObserver(idleObserver);
});



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
