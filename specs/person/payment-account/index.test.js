'use strict';

let create = require('specs/person/payment-account/create');
let update = require('specs/person/payment-account/update');
let remove = require('specs/person/payment-account/delete');

describe('Payment Account', function() {
    create();
    update();
    remove();
});
