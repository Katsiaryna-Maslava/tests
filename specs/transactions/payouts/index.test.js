'use strict';

let create = require('./create-request');
let update = require('./update-request');
let authorization = require('./authorization');
let rejection = require('./rejection');
let paymentProcessor = require('./payment-processor');

describe('Payout requests', function() {
    create();
    update();
    authorization();
    rejection();
    paymentProcessor();
});
