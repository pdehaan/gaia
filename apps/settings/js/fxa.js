// TODO what is user info format?
// TODO do we need transitions for moving between logged in/out screens?
// TODO do we need a third screen for "unverified/check your email"?
// TODO do we want to disable some buttons after clicking?
// TODO l10n!

'use strict';

var Accounts = (function account_settings() {

  var loggedOutPanel, loggedInPanel, loginBtn, changePasswordBtn,
    logoutBtn, deleteAccountBtn, loggedInEmail, currentAccount;

  // XXX debugging
  // TODO should we cache this much state at all? or always rely on helper.getAccounts?
  currentAccount = {
    id: '1234657890',
    email: 'duderonomy@brobible.com'
  };

  function init() {
    loggedOutPanel = document.getElementById('fxa-logged-out');
    loggedInPanel = document.getElementById('fxa-logged-in');
    loginBtn = document.getElementById('fxa-login');
    changePasswordBtn = document.getElementById('fxa-change-password');
    logoutBtn = document.getElementById('fxa-logout');
    deleteAccountBtn = document.getElementById('fxa-delete-account');
    loggedInEmail = document.getElementById('fxa-logged-in-email');

    // TODO show a spinner on initial load so that we never show the wrong state?
    currentAccount ? showLoggedInUI() : showLoggedOutUI();

    loadAccountInfo();
  }

  function loadAccountInfo() {
    debugger;
    FxAccountsIACHelper.getAccounts(
      function _onGetAccounts(data) {
        debugger;
        console.error('_onGetAccounts response is: ' + JSON.stringify(data)) // XXX debugging
        currentAccount = data && data.accounts && data.accounts[0]; // TODO what's actual response format?
      },
      function _onGetAccountsErr(err) {
        // TODO try again once? try with exponential backoff? or just give up?
        debugger;
        console.log('fxaccts errored: ' + err); // XXX debugging
      }
    );
  }

  // show logged in implies hide logged out
  function showLoggedInUI() {
    loginBtn.onclick = null;

    loggedInEmail.textContent = currentAccount.email;
    changePasswordBtn.onclick = onChangePasswordBtnClick;
    logoutBtn.onclick = onLogoutBtnClick;
    deleteAccountBtn.onclick = onDeleteAccountBtnClick;

    loggedInPanel.hidden = false;
    loggedOutPanel.hidden = true;
  }

  // show logged out implies hide logged in
  function showLoggedOutUI() {
    loginBtn.onclick = onLoginBtnClick;

    loggedInEmail.textContent = '';
    changePasswordBtn.onclick = null;
    logoutBtn.onclick = null;
    deleteAccountBtn.onclick = null;

    loggedOutPanel.hidden = false;
    loggedInPanel.hidden = true;
  }

  function onLoginBtnClick(e) {
    // TODO disable button on click?
    FxAccountsIACHelper.openFlow(onLoginComplete, onLoginError);
  }

  function onLoginComplete(e) {
    // TODO figure out the *real* user params from evt, this'll probably throw
    currentAccount = { 
      id: e.data.id,
      email: e.data.email
    };
    showLoggedInUI();
  }

  function onLoginError(err) {
    debugger;
    // re-enable button, if disabled
  }

  function onLogoutBtnClick(e) {
    FxAccountsIACHelper.logout(onLogoutComplete, onLogoutError);
  }

  function onLogoutComplete() {
    currentAccount = null;
    showLoggedOutUI();
  };

  function onLogoutError(err) {
    console.error('logout failed: ' + err);
  }
  
  function onChangePasswordBtnClick(e) {
    FxAccountsIACHelper.changePassword(
      currentAccount.id,
      onChangePasswordComplete,
      onChangePasswordError
    );
  }

  function onChangePasswordComplete() {
    // TODO what do we need to do here?
  }

  function onChangePasswordError(err) {
    console.error('change password failed: ' + err)
  }

  function onDeleteAccountBtnClick(e) {
    // delete account not yet implemented
  }

  // TODO need to return anything else?
  return {
    init: init
  };

})();

navigator.mozL10n.ready(Accounts.init());
