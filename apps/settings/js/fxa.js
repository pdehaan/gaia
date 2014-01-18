/**
 * Model code - fetches and holds state, updates the panel/menu as needed.
 * The code for the panel and the main menu item is further down.
 */

// getAccounts() responses are of the form
//   { accountId: string, verified: boolean }
// getAccounts() error responses are of the form
//   { error: string, details: object}.
// --> not sure what the possible error responses are, though.

'use strict';

var FxaModel = (function fxa_model() {
    var fxAccountState = {
      state: 'unknown',
      email: null
    };

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
      email = data.accountId;
    } else {
      // TODO if the user is logged out, does getAccounts just return null?
      state = 'loggedout';
      email = null;
    }

    // TODO does observable publish if the state is overwritten but not changed?
    //      if not, we can remove this check.
    if (fxAccountState.state != state ||
        fxAccountState.email != email) {
      fxAccountState = {
        state: state,
        email: email
      };
    }
  }

  function onFxAccountError(err) {
    console.error(err.msg);
    // TODO maybe show overlay with error?
  }

  /* Hiding the IAC helper from the views. TODO too much abstraction? */
  function onLogoutClick(e) {
    FxAccountsIACHelper.logout(onFxAccountStateChange, onFxAccountError);
  }

  function onLoginClick(e) {
    FxAccountsIACHelper.openFlow(onFxAccountStateChange, onFxAccountError);
  }

  // use observable so that views can watch the exported fxAccountState param
  return Observable({
    init: init,
    fxAccountState: fxAccountState,
    onLogoutClick: onLogoutClick,
    onLoginClick: onLoginClick
  });
})();

/**
 * UI code for the firefox accounts menu entry in the settings panel
 */
var FxaMenu = (function fxa_menu() {
  function init(fxaModel) {
    var _ = navigator.mozL10n.get;
    var fxaMenuDesc = document.getElementById('fxa-desc');

    // listen for changes
    fxaModel.observe('fxAccountState', onFxAccountStateChange);

    // start with whatever state's in the model
    onFxAccountStateChange(fxaModel.fxAccountState);

    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function onFxAccountStateChange(data) {
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

  // TODO how to use Settings.currentPanel and 'visibilitychange' properly?
  function onVisibilityChange() {
    if (document.hidden) {
      fxaModel.unobserve('fxAccountState', onFxAccountStateChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    } else {
      // TODO would this branch ever be executed *after* init has fired?
      fxaModel.observe('fxAccountState', onFxAccountStateChange);
      document.addEventListener('visibilitychange', onVisibilityChange);
      onFxAccountStateChange(fxaModel.fxAccountState);
    }
  }

  // TODO return things & stuff?
  return {};
});

/**
 * UI code for the firefox accounts panel
 *
 */
// TODO do we want to disable some buttons after clicking?
// TODO how do we get initial state from the model?

var FxaPanel = (function fxa_panel() {
  var loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    overlayPanel,
    loginBtn,
    logoutBtn,
    deleteAccountBtn,
    state,
    email;

  function init(fxaModel) {
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    overlayPanel = document.getElementById('fxa-overlay');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    deleteAccountBtn = document.getElementById('fxa-delete-account');
    loggedInEmail = document.getElementById('fxa-logged-in-email');

    // listen for changes
    fxaModel.observe('fxAccountState', onFxAccountStateChange);

    // start with whatever state's in the model
    onFxAccountStateChange(fxaModel.fxAccountState);

    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // TODO how to use Settings.currentPanel and 'visibilitychange' properly?
  function onVisibilityChange() {
    if (document.hidden) {
      document.addEventListener('visibilitychange', onVisibilityChange);
      fxaModel.unobserve('fxAccountState', onFxAccountStateChange);
      hideLoggedInPanel();
      hideLoggedOutPanel();
      hideUnverifiedPanel();
    } else {
      document.addEventListener('visibilitychange', onVisibilityChange);
      fxaModel.observe('fxAccountState', onFxAccountStateChange);
      onFxAccountStateChange(fxaModel.fxAccountState);
    }

  function onFxAccountStateChange(data) {
    var state = data.state,
      email = data.email;

    if (state == 'verified') {
      showSpinner();
      showLoggedInPanel();
      hideLoggedOutPanel();
      hideUnverifiedPanel();
    } else if (state == 'unverified') {
      showSpinner();
      showUnverifiedPanel();
      hideLoggedOutPanel();
      hideLoggedInPanel();
    } else if (state == 'loggedout') {
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
    loginBtn.onclick = FxaModel.onLoginClick;
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
    loggedInEmail.textContent = email;
    loggedInPanel.hidden = false;
    logoutBtn.onclick = FxaModel.onLogoutClick;

    // TODO insert bug number tracking this feature--or better, remove button
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

  // TODO need to return anything?
  return {
    init: init
  };

})();

// TODO hopefully wrapping the initialization in l10nReady gives us an easy
//      way to unit test these pieces without html involved
navigator.mozL10n.ready(function onL10nReady() {
  FxaModel.init();
  // starting when we get a chance
  var idleObserver = {
    time: 5,
    onidle: function() {
      FxaMenu.init(FxaModel);
      navigator.removeIdleObserver(idleObserver);
    }
  };
  navigator.addIdleObserver(idleObserver);

  // don't init the panel until panelready is fired.
  function onPanelReady() {
    FxaPanel.init(FxaModel);
    window.removeEventListener('panelready', onPanelReady);
  }
  window.addEventListener('panelready', onPanelReady);
});
