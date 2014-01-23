'use strict';

mocha.globals(['Settings', 'MockFxAccountsIACHelper']);
requireApp('settings/test/unit/mock_l10n.js');
requireApp('settings/js/mvvm/models.js');
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
  });

  suiteTeardown(function() {
    navigator.mozL10n = hackedGlobals.mozL10n;
    suiteSandbox.restore();
  });

  suite('FxaModel', function() {
    suiteSetup(function() {
      // init the model
      FxaModel.init(MockFxAccountsIACHelper);
      // watch the model's Observable outputs for signals
    });
    suiteTeardown(function() {
      // just for cleanness, we can destroy the model.
      // but the model should really be scoped to this suite, eh?
    });
    test('on verifiedlogin, should publish verified state', function(done) {
      function modelStateTestCallback(newVal, oldVal) {
        assert.equal('verified', newVal.state);
        assert.equal('foo@bar.com', newVal.email);
        FxaModel.fxAccountState.unobserve('fxAccountState',
          modelStateTestCallback);
        done();
      };
      FxaModel.fxAccountState.observe('fxAccountState', modelStateTestCallback);

      MockFxAccountsIACHelper.setCurrentState({
        accountId: 'foo@bar.com',
        verified: true
      });
      MockFxAccountsIACHelper.fireEvent('onverifiedlogin');
    });
    test('on login event, should publish Observable unverified login state',
      function(done) {
      function unverifiedCallback(newVal, oldVal) {
        assert.equal('unverified', newVal.state);
        assert.equal('baz@quux.com', newVal.email);
        FxaModel.fxAccountState.unobserve('fxAccountState',
          unverifiedCallback);
        done();
      };
      FxaModel.fxAccountState.observe('fxAccountState', unverifiedCallback);

      MockFxAccountsIACHelper.setCurrentState({
        accountId: 'baz@quux.com',
        verified: false
      });
      MockFxAccountsIACHelper.fireEvent('onlogin');
    });
    test('on logout event, should publish Observable logged-out state',
      function(done) {
      function loggedoutCallback(newVal, oldVal) {
        assert.equal('loggedout', newVal.state);
        assert.equal(null, newVal.email);
        FxaModel.fxAccountState.unobserve('fxAccountState',
          loggedoutCallback);
        done();
      };
      FxaModel.fxAccountState.observe('fxAccountState', loggedoutCallback);

      MockFxAccountsIACHelper.setCurrentState(null);
      MockFxAccountsIACHelper.fireEvent('onlogout');
    });
    test('on error, do something',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, do the right thing',
      function(done) { return done(new Error('not implemented yet'));
    });
  });

  suite('FxaPanel', function() {
    suiteSetup(function() {
      // init mock FxaModel (just an Observable we control)
      // init FxaPanel
      // attach mock html to page, for verifying state change
    });
    suiteTeardown(function() {
      // destroy mock FxaModel
      // destroy FxaPanel
      // remove mock html from page
    });
    test('when loggedout state is Observed, show the right html',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('when verified login state is Observed, show the right html',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('when unverified login state is Observed, show the right html',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document hidden, handlers should be detached',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document hidden, DOM should be hidden',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document shown, handlers should be reattached',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document shown, DOM should be unhidden',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on state change, show transition overlay',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('when transition overlay is shown, ensure it hides itself',
      function(done) { return done(new Error('not implemented yet'));
    });
  });

  suite('FxaMenu', function() {
    suiteSetup(function() {
      // init mock FxaModel (just an Observable we control)
      // init FxaMenu
      // attach mock html to page, for verifying state change
    });
    suiteTeardown(function() {
      // destroy mock FxaModel
      // destroy FxaMenu
      // remove mock html from page
    });
    test('when loggedout state is Observed, show the right html',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('when verified login state is Observed, show the right html',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('when unverified login state is Observed, show the right html',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document hidden, handlers should be detached',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document hidden, DOM should be hidden',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document shown, handlers should be reattached',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on visibilitychange, document shown, DOM should be unhidden',
      function(done) { return done(new Error('not implemented yet'));
    });
  });

  suite('Integration tests', function() {
    suiteSetup(function() {
      // init mock FxAccountsIACHelper
      // init FxaModel
      // add menu and panel html to the page
      // init FxaPanel
      // init FxaMenu
    });
    suiteTeardown(function() {
      // destroy mock FxAccountsIACHelper
      // destroy mock FxaModel
      // destroy mock FxaMenu
      // destroy mock FxaPanel
      // remove mock html from page
    });
    test('on logout fxa event, correct panel html is shown',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on logout fxa event, correct menu html is shown',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on verified login fxa event, correct panel html is shown',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on verified login fxa event, correct menu html is shown',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on unverified login fxa event, correct panel html is shown',
      function(done) { return done(new Error('not implemented yet'));
    });
    test('on unverified login fxa event, correct menu html is shown',
      function(done) { return done(new Error('not implemented yet'));
    });
  });
});
