'use strict';

mocha.globals(['Settings', 'FxAccountsIACHelper']);
requireApp('settings/test/unit/mock_l10n.js');
require('../../shared/js/fxa_iac_client.js');
require('mock_fx_accounts_iac_helper.js');
requireApp('settings/js/fxa.js');

suite('firefox accounts >', function() {
  var suiteSandbox = sinon.sandbox.create(),
    hackedGlobals = {};

  suiteSetup(function() {
    hackedGlobals.mozL10n = navigator.mozL10n;
    // TODO I think we don't actually want l10n to fire?
    //      because we use that stanza to do dependency injection?
    navigator.mozL10n = MockL10n;
    suiteSandbox.stub(MockL10n, 'ready');
    // TODO setup mocks in here, or in each test?
    hackedGlobals.FxAccountsIACHelper = FxAccountsIACHelper;
    FxAccountsIACHelper = sinon.mock(MockFxAccountsIACHelper);
  });

  suiteTeardown(function() {
    navigator.mozL10n = hackedGlobals.mozL10n;
    FxAccountsIACHelper = hackedGlobals.FxAccountsIACHelper;
    suiteSandbox.restore();
  });

  suite('FxaModel', function() {
  /*
  - FxaModel
    - inputs come from MockFxAccountsIACHelper
    - outputs are passed to the test, which watches the Observable model
    - on logout event, publishes loggedout Observable state
    - on login event, publishes loggedin Observable state
    - on verified event, publishes verified Observable state
    - if the same event is fired twice (logout fired, logout fired again),
      ensure that no Observable state change occurs
      - this lets us avoid unnecessary DOM changes
    - on error, ... ?
    - on visibilitychange, ... ?
  */
    suiteSetup(function() {});
    suiteTeardown(function() {});
    test('stuff', function() {
      assert.isNotNull('not null');
    });
  });

  suite('FxaPanel', function() {
  /*
  - FxaPanel
    - inputs come from passing fake data into onFxAccountStateChange callback
    - outputs are checking html state?
    - on login, logout, verified, ensure the right state is shown
    - on visibilitychange, ensure handlers are detached + DOM hidden?
    - on visibilitychange back to visible, ensure panel is reactivated
    - when the state changes, ensure the transition overlay is shown & hidden
      properly
  */
    suiteSetup(function() {});
    suiteTeardown(function() {});
    test('stuff', function() {
      assert.isNotNull('not null');
    });
  });

  suite('FxaMenu', function() {
  /*
  - FxaMenu
    - same as panel, except there's no transition overlay:
  (pasted from FxaPanel suite comment)
    - inputs come from passing fake data into onFxAccountStateChange callback
    - outputs are checking html state?
    - on login, logout, verified, ensure the right state is shown
    - on visibilitychange, ensure handlers are detached + DOM hidden?
    - on visibilitychange back to visible, ensure panel is reactivated
    - when the state changes, ensure the transition overlay is shown & hidden
      properly
  */
    suiteSetup(function() {});
    suiteTeardown(function() {});
    test('stuff', function() {
      assert.isNotNull('not null');
    });
  });

  suite('Integration tests', function() {
  /*
  - integration tests
    - inputs come from MockFxAccountsIACHelper
    - outputs are panel and menu html state
    - on logout, login, verified event, correct html is visible
    - on visibilitychange, everything's hidden
    - on visibilitychange again, everything's reactivated
  */
    suiteSetup(function() {});
    suiteTeardown(function() {});
    test('stuff', function() {
      assert.isNotNull('not null');
    });
  });
});
