/* global FxaPanel */

'use strict';

navigator.mozL10n.ready(function onL10nReady() {
  function onPanelReady() {
    FxaPanel.init();
    window.removeEventListener('panelready', onPanelReady);
  }
  window.addEventListener('panelready', onPanelReady);
});
