
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
