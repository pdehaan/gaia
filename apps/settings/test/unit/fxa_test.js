/* globals loadBodyHTML, Observable, MockL10n, MockFxAccountsIACHelper,
  HtmlImports, FxaModel, FxaPanel, FxaMenu */

'use strict';

mocha.globals([
  'loadBodyHTML',
  'Observable',
  'MockL10n',
  'MockFxAccountsIACHelper',
  'HtmlImports',
  'FxaModel',
  'FxaPanel',
  'FxaMenu'
]);
require('/shared/js/text_normalizer.js');
require('/shared/test/unit/load_body_html_helper.js');
require('/shared/js/html_imports.js');

require('mock_fx_accounts_iac_helper.js');
requireApp('settings/test/unit/mock_l10n.js');
requireApp('settings/js/mvvm/models.js');
requireApp('settings/js/firefox_accounts.js');

suite('firefox accounts >', function() {
  var suiteSandbox = sinon.sandbox.create(),
    hackedGlobals = {};

  suiteSetup(function() {
    // TODO I think we don't actually want l10n to fire?
    //      because we use that stanza to do dependency injection?
    hackedGlobals.mozL10n = navigator.mozL10n;
    window.navigator.mozL10n = MockL10n;
//    suiteSandbox.stub(MockL10n, 'ready');
  });

  suiteTeardown(function() {
    window.navigator.mozL10n = hackedGlobals.mozL10n;
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
        FxaModel.unobserve('fxAccountState',
          modelStateTestCallback);
        done();
      }
      FxaModel.observe('fxAccountState', modelStateTestCallback);

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
        FxaModel.unobserve('fxAccountState',
          unverifiedCallback);
        done();
      }
      FxaModel.observe('fxAccountState', unverifiedCallback);

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
        FxaModel.unobserve('fxAccountState',
          loggedoutCallback);
        done();
      }
      FxaModel.observe('fxAccountState', loggedoutCallback);

      MockFxAccountsIACHelper.setCurrentState(null);
      MockFxAccountsIACHelper.fireEvent('onlogout');
    });
  });

  suite('FxaPanel', function() {
    var mockFxaModel;

    suiteSetup(function(done) {
      // init mock FxaModel (just an Observable we control)
      mockFxaModel = Observable({
        fxAccountState: {
          state: 'loggedout',
          email: 'asdf@jkl.com'
        }
      });
      mockFxaModel.onLoginClick = function onLoginClick() {};
      mockFxaModel.onLogoutClick = function onLogoutClick() {};

      // attach mock html to page, for verifying state change:
      // first, load settings app
      loadBodyHTML('/index.html');
      // next, insert fxa panel into page
      var importHook = document.createElement('link');
      importHook.setAttribute('rel', 'import');
      importHook.setAttribute('href', '/elements/fxa.html');
      document.head.appendChild(importHook);
      HtmlImports.populate(function onDOMReady() {
        // double-check panel is ready
        if (null == document.getElementById('fxa-logged-out')) {
          throw new Error('failed to load fxa panel into page');
        }
        // init FxaPanel
        FxaPanel.init(mockFxaModel);
        done();
      });
    });
    suiteTeardown(function() {
      // destroy mock FxaModel
      // destroy FxaPanel
      // remove mock html from page
    });
    test('when loggedout state is Observed, show the right html', function() {
        // updating the Observable should auto-update the Panel
        mockFxaModel.fxAccountState = {
          state: 'loggedout',
          email: null
        };
        // check that logged-out state is shown
        assert.isFalse(document.getElementById('fxa-logged-out').hidden);
        assert.isTrue(document.getElementById('fxa-unverified').hidden);
        assert.isTrue(document.getElementById('fxa-logged-in').hidden);
    });
    test('when verified login state is Observed, show the right html',
      function() {
        mockFxaModel.fxAccountState = {
          state: 'verified',
          email: 'ver@ified.com'
        };
        assert.isTrue(document.getElementById('fxa-logged-out').hidden);
        assert.isTrue(document.getElementById('fxa-unverified').hidden);
        assert.isFalse(document.getElementById('fxa-logged-in').hidden);
        assert.equal('ver@ified.com',
          document.getElementById('fxa-logged-in-email').textContent);
    });
    test('when unverified login state is Observed, show the right html',
      function() {
        mockFxaModel.fxAccountState = {
          state: 'unverified',
          email: 'un@verified.com'
        };
        assert.isTrue(document.getElementById('fxa-logged-out').hidden);
        assert.isFalse(document.getElementById('fxa-unverified').hidden);
        assert.isTrue(document.getElementById('fxa-logged-in').hidden);
        assert.equal('un@verified.com',
          document.getElementById('fxa-unverified-email').textContent);
    });
    test('when transition overlay is shown, ensure it hides itself',
      function() {
        var clock = sinon.useFakeTimers();
        var spinnerEl = document.getElementById('fxa-overlay');

        // start by ensuring the overlay is hidden as a precondition.
        // this can fail. not sure why, but we do a lot of state toggling
        // without waiting for the animation to finish (in previous tests).
        // TODO find a better way to reset state between tests
        spinnerEl.classList.remove('show');

        assert.isFalse(spinnerEl.classList.contains('show'));
        FxaPanel.showSpinner();
        clock.tick(10);
        assert.isTrue(spinnerEl.classList.contains('show'));
        // total delay is 200. advance clock so the el should be re-hidden
        clock.tick(200);
        assert.isFalse(spinnerEl.classList.contains('show'));
        clock.restore();
    });
  });

  suite('FxaMenu', function() {
    // TODO some copypasta from FxaPanel suite setup. extract/dry up.
    var mockFxaModel,
      fxaDescEl;

    suiteSetup(function() {
      // init mock FxaModel (just an Observable we control)
      mockFxaModel = Observable({
        fxAccountState: {
          state: 'loggedout',
          email: 'asdf@jkl.com'
        }
      });
      mockFxaModel.onLoginClick = function onLoginClick() {};
      mockFxaModel.onLogoutClick = function onLogoutClick() {};

      // attach mock html to page, for verifying state change:
      // for the menu, we only need the settings app
      loadBodyHTML('/index.html');

      // double-check panel is ready
      fxaDescEl = document.getElementById('fxa-desc');
      if (!fxaDescEl) {
        throw new Error('failed to load settings page html');
      }
      // init FxaMenu
      FxaMenu.init(mockFxaModel);
    });
    suiteTeardown(function() {
      // destroy mock FxaModel
      // destroy FxaMenu
      // remove mock html from page
    });
    test('when loggedout state is Observed, show the right html',
      function() {
      // updating the Observable should auto-update the Panel
      mockFxaModel.fxAccountState = {
        state: 'loggedout',
        email: null
      };
      assert.equal(fxaDescEl.textContent, '');
    });
    test('when verified login state is Observed, show the right html',
      function() {
      mockFxaModel.fxAccountState = {
        state: 'verified',
        email: 'ver@ified.com'
      };
      assert.equal(fxaDescEl.textContent, 'Logged in as ver@ified.com');
    });
    test('when unverified login state is Observed, show the right html',
      function() {
      mockFxaModel.fxAccountState = {
        state: 'unverified',
        email: 'un@verified.com'
      };
      assert.equal(fxaDescEl.textContent, 'Please check your email');
    });
  });

});
