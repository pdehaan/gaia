
'use strict';

// just use sinon to replace the function bodies
var MockFxAccountsIACHelper = {
    getAccounts: _getAccounts,
    addEventListener: _addEventListener,
    openFlow: _openFlow,
    logout: _logout
};
