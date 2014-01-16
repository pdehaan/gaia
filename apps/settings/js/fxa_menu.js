
/**
 * This displays the firefox accounts status in the main panel without
 * loading all the code in the main fxa.js file
 */

// TODO do we want to export anything here, so that the main panel can
// communicate with this panel? Or maybe we just route all signals through the
// FxAccountsIACHelper?
var FxaMenu = {
  currentState: 'unknown',
  currentUser: undefined,
  init: function init() {
    var _ = navigator.mozL10n.get;
    var fxaMenuDesc = document.getElementById('fxa-desc'),
    // get current state and update DOM
    FxaMenu.refreshState();

    // then, observe FxAccountsIACHelper for login, verified, logout events
    // TODO do we need to detach listeners when the settings app is closed?
    FxAccountsIACHelper.addEventListener('onlogin', FxaMenu.refreshState);
    FxAccountsIACHelper.addEventListener('onverifiedlogin',
      FxaMenu.refreshState);
    FxAccountsIACHelper.addEventListener('onlogout', FxaMenu.refreshState);
  },

  refreshState: function refreshState() {
    FxAccountsIACHelper.getAccounts(FxaMenu.onFxAccountsData,
      FxaMenu.onFxAccountsError);
  },

  // TODO guessing data format is { user: 'foo@bar.com', state: 'verified' }
  // TODO guessing states are 'verified', 'unverified', 'loggedout', and null,
  //      which we treat as 'unknown'
  onFxAccountsData: function onFxAccountsData(data) {
    // bail if the state is unchanged
    if (!data && currentState == 'unknown' ||
        currentState == data.state && currentUser == data.user) {
      return;
    }

    // else assign it and update the DOM
    FxaMenu.currentUser = data && data.user;
    FxaMenu.currentState = data && data.state || 'unknown';

    if (FxaMenu.currentState == 'verified') {
      fxaMenuDesc.text = _('Logged in as ') + FxaMenu.currentUser;
    } else if (FxaMenu.currentState == 'unverified') {
      fxaMenuDesc.text = _('Please check your email');
    } else if (FxaMenu.currentState == 'loggedout') {
      fxaMenuDesc.text = _('Log in to access your acct.');
    } else {
      // accountState == 'unknown', display nothing
      fxaMenuDesc.text = '';
    }
  },
  onNetworkError: function onUpdateError(err) {
    // TODO log error? retry?
  }
};

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
