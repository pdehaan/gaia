/**
 * Model code - fetches and holds state, updates the panel/menu as needed.
 * The code for the panel and the main menu item is further down.
 */

// getAccounts() responses vs account state:
//   logged in, unverified: { accountId: string, verified: false }
//   logged in, verified: { accountId: string, verified: true }
//   logged out *or* no cached state: response is null
//
// getAccounts() error responses are of the form
//   { error: string, details: object}.
// --> TODO not sure what the possible error responses are, though.

'use strict';

var FxaModel = (function fxa_model() {
  // default state is logged out state.
  var _state = Observable({
    fxAccountState: {
      state: 'loggedout',
      email: null
    }
  });

  var fxAccountsIACHelper;

  function init(fxahelper) {
    // pass in a mock helper for unit testing, fall back to global
    fxAccountsIACHelper = fxahelper || FxAccountsIACHelper;
    fxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
    fxAccountsIACHelper.addEventListener('onlogin', refreshState);
    fxAccountsIACHelper.addEventListener('onverifiedlogin', refreshState);
    fxAccountsIACHelper.addEventListener('onlogout', refreshState);
    // TODO need to remove listeners on document.hidden?
  }

  function refreshState() {
    // TODO throttle or debounce if we are already refreshing state
    fxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
  }

  function onFxAccountStateChange(data) {
    //throw new Error('data is ' + JSON.stringify(data));
    var state, email;
    if (data) {
      state = data.verified ? 'verified' : 'unverified';
      email = data.accountId;
    } else {
      state = 'loggedout';
      email = null;
    }

    // don't bother writing out the state and notifying observers unless we've
    // got some new data. Observable should dedupe this for us, but I don't
    // want to depend on Observable doing a deep comparison. If we fire updates
    // for no reason, we'll have state -> spinner -> same state, no good.
    if (_state.fxAccountState.state != state ||
        _state.fxAccountState.email != email) {
      _state.fxAccountState = {
        state: state,
        email: email
      };
    }
  }

  function onFxAccountError(err) {
    console.error(err.msg);
    // TODO maybe show overlay with error?
  }

  // Hiding the FxAccountsIACHelper from the views
  // A bit funny to put the click handlers in here, but it works for now
  function onLogoutClick(e) {
    e.stopPropagation();
    e.preventDefault();
    fxAccountsIACHelper.logout(onFxAccountStateChange, onFxAccountError);
  }

  function onLoginClick(e) {
    e.stopPropagation();
    e.preventDefault();
    fxAccountsIACHelper.openFlow(onFxAccountStateChange, onFxAccountError);
  }

  // use observable so that views can watch the exported fxAccountState param
  _state.init = init;
  _state.onLogoutClick = onLogoutClick;
  _state.onLoginClick = onLoginClick;
  return _state;
})();

/**
 * UI code for the firefox accounts menu entry in the settings panel
 */
var FxaMenu = (function fxa_menu() {
  var _,
    _fxaModel,
    menuDesc;

  function init(fxaModel) {
    _ = navigator.mozL10n.get;
    menuDesc = document.getElementById('fxa-desc');
    _fxaModel = fxaModel;

    // listen for changes
    _fxaModel.observe('fxAccountState', onFxAccountStateChange);

    // start with whatever state's in the model
    onFxAccountStateChange(_fxaModel.fxAccountState);

    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function onFxAccountStateChange(data) {
    var email = data.email,
      state = data.state;

    if (state == 'verified') {
      menuDesc.textContent = _('Logged in as ') + Normalizer.escapeHTML(email);
    } else if (state == 'unverified') {
      menuDesc.textContent = _('Please check your email');
    } else { /* state == 'loggedout' */
      menuDesc.textContent = '';
    }
  }

  // TODO how to use Settings.currentPanel and 'visibilitychange' properly?
  function onVisibilityChange() {
    if (document.hidden) {
      _fxaModel.unobserve('fxAccountState', onFxAccountStateChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    } else {
      _fxaModel.observe('fxAccountState', onFxAccountStateChange);
      document.addEventListener('visibilitychange', onVisibilityChange);
      onFxAccountStateChange(_fxaModel.fxAccountState);
    }
  }

  return {
    init: init
  };
})();

/**
 * UI code for the firefox accounts panel
 */
// TODO do we want to disable some buttons after clicking?

var FxaPanel = (function fxa_panel() {
  var loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    overlayPanel,
    loginBtn,
    logoutBtn,
    loggedInEmail,
    unverifiedEmail,
    _fxaModel,
    state,
    email;

  function init(fxaModel) {
    _fxaModel = fxaModel;
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    overlayPanel = document.getElementById('fxa-overlay');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    loggedInEmail = document.getElementById('fxa-logged-in-email');
    unverifiedEmail = document.getElementById('fxa-unverified-email');

    // listen for changes
    _fxaModel.observe('fxAccountState', onFxAccountStateChange);

    // start with whatever state's in the model
    onFxAccountStateChange(_fxaModel.fxAccountState);

    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // TODO how to use Settings.currentPanel and 'visibilitychange' properly?
  function onVisibilityChange() {
    if (document.hidden) {
      document.addEventListener('visibilitychange', onVisibilityChange);
      _fxaModel.unobserve('fxAccountState', onFxAccountStateChange);
      hideLoggedInPanel();
      hideLoggedOutPanel();
      hideUnverifiedPanel();
    } else {
      document.addEventListener('visibilitychange', onVisibilityChange);
      _fxaModel.observe('fxAccountState', onFxAccountStateChange);
      onFxAccountStateChange(_fxaModel.fxAccountState);
    }
  };

  function onFxAccountStateChange(data) {
    var state = data.state,
      email = data.email;

    if (state == 'verified') {
      showSpinner();
      showLoggedInPanel(email);
      hideLoggedOutPanel();
      hideUnverifiedPanel();
    } else if (state == 'unverified') {
      showSpinner();
      showUnverifiedPanel(email);
      hideLoggedOutPanel();
      hideLoggedInPanel();
    } else { /* state == 'loggedout' */
      showSpinner();
      showLoggedOutPanel();
      hideLoggedInPanel();
      hideUnverifiedPanel();
    }
  }

  function hideLoggedOutPanel() {
    loginBtn.onclick = null;
    loggedOutPanel.hidden = true;
  }

  function showLoggedOutPanel() {
    loginBtn.onclick = _fxaModel.onLoginClick;
    loggedOutPanel.hidden = false;
  }

  function hideLoggedInPanel() {
    loggedInPanel.hidden = true;
    loggedInEmail.textContent = '';
    logoutBtn.onclick = null;
  }

  function showLoggedInPanel(email) {
    loggedInEmail.textContent = Normalizer.escapeHTML(email);
    loggedInPanel.hidden = false;
    logoutBtn.onclick = _fxaModel.onLogoutClick;
  }

  function hideUnverifiedPanel() {
    unverifiedPanel.hidden = true;
    unverifiedEmail.textContent = '';
  }

  function showUnverifiedPanel(email) {
    unverifiedPanel.hidden = false;
    unverifiedEmail.textContent = Normalizer.escapeHTML(email);
  }

  // TODO spinner also hides itself. come up with a better name.
  function showSpinner() {
    overlayPanel.classList.add('show');
    setTimeout(function() {
      overlayPanel.classList.remove('show');
    }, 200);
  }

  return {
    init: init,
    showSpinner: showSpinner /* exposed for unit testing */
  };

})();

// TODO idea: wrapping initialization in mozL10n.ready so that we can avoid
//      connecting the object graph in unit tests (by never firing the ready
//      callback, and wiring up mocks manually instead)
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
