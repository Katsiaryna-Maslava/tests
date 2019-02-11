'use strict';

let create = require('specs/wallets/create');
let read = require('specs/wallets/read');
let update = require('specs/wallets/update');
let balance = require('specs/wallets/balance');

describe('Wallets', function() {
    create();
    read();
    update();
    balance();
});
