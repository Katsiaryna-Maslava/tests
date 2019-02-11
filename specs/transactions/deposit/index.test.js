'use strict';

let create = require('./create');
let fraud = require('./fraud');

describe('Deposit', function() {
    create();
    fraud();
});
