/* global Normalizer, Observable, FxAccountsIACHelper */

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
    // pass in a mock helper for unit testing, or fall back to global
    fxAccountsIACHelper = fxahelper || FxAccountsIACHelper;
    fxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
    fxAccountsIACHelper.addEventListener('onlogin', refreshState);
    fxAccountsIACHelper.addEventListener('onverifiedlogin', refreshState);
    fxAccountsIACHelper.addEventListener('onlogout', refreshState);
  }

  function refreshState() {
    // TODO throttle or debounce if we are already refreshing state
    fxAccountsIACHelper.getAccounts(onFxAccountStateChange, onFxAccountError);
  }

  function onFxAccountStateChange(data) {
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
    console.error('Error getting Firefox Account: ' + err.error);
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

  // The Observable function strips out functions, so we had to first create
  // the observable, and here we append function properties to it.
  _state.init = init;
  _state.onLogoutClick = onLogoutClick;
  _state.onLoginClick = onLoginClick;
  return _state;
})();

// TODO do we want to throttle/disable some buttons after clicking?
var FxaPanel = (function fxa_panel() {
  var fxaContainer,
    loggedOutPanel,
    loggedInPanel,
    unverifiedPanel,
    overlayPanel,
    loginBtn,
    logoutBtn,
    loggedInEmail,
    unverifiedEmail,
    _fxaModel;

  function init(fxaModel) {
    _fxaModel = fxaModel;
    fxaContainer = document.getElementById('fxa-container');
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    unverifiedPanel = document.getElementById('fxa-unverified');
    loginBtn = document.getElementById('fxa-login');
    logoutBtn = document.getElementById('fxa-logout');
    // TODO this name sucks. fix as part of html refactor pass.
    loggedInEmail = document.getElementById('fxa-logged-in-text');
    unverifiedEmail = document.getElementById('fxa-unverified-text');

    // listen for changes
    _fxaModel.observe('fxAccountState', onFxAccountStateChange);

    // start with whatever state's in the model
    onFxAccountStateChange(_fxaModel.fxAccountState);

    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      _fxaModel.unobserve('fxAccountState', onFxAccountStateChange);
    } else {
      _fxaModel.observe('fxAccountState', onFxAccountStateChange);
      onFxAccountStateChange(_fxaModel.fxAccountState);
    }
  }

  function onFxAccountStateChange(data) {
    var state = data.state,
      email = Normalizer.escapeHTML(data.email);

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
    } else { // state == 'loggedout'
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
    var emailElement = document.createElement('strong');
    emailElement.textContent = email;
    navigator.mozL10n.localize(loggedInEmail, 'fxa-logged-in-text', {
      email: emailElement.innerHTML
    });
    loggedInPanel.hidden = false;
    logoutBtn.onclick = _fxaModel.onLogoutClick;
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

  // TODO spinner also hides itself. come up with a better name.
  function showSpinner() {
    if (!overlayPanel) {
      overlayPanel = document.createElement('div');
      overlayPanel.id = 'fxa-overlay';
      fxaContainer.appendChild(overlayPanel);
    }
    overlayPanel.classList.add('show');
    setTimeout(function() {
      overlayPanel.classList.remove('show');
    }, 200);
  }

  return {
    init: init,
    showSpinner: showSpinner // exposed for unit testing
  };

})();

// TODO idea: wrapping initialization in mozL10n.ready so that we can avoid
//      connecting the object graph in unit tests (by never firing the ready
//      callback, and wiring up mocks manually instead). Not convinced this is
//      the best way.
navigator.mozL10n.ready(function onL10nReady() {
  FxaModel.init();

  // don't init the panel until panelready is fired.
  function onPanelReady() {
    FxaPanel.init(FxaModel);
    window.removeEventListener('panelready', onPanelReady);
  }
  window.addEventListener('panelready', onPanelReady);
});
