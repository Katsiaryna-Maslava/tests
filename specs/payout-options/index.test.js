'use strict';

let create = require('./create');
let update = require('./update');
let read = require('./read');
let remove = require('./delete');
let getAdditionalPayoutData = require('./additional-payout-data');
let createLimits = require('./limits/create.js');
let updateLimits = require('./limits/update.js');

describe('Payout Options', function() {
    create();
    update();
    read();
    remove();
    getAdditionalPayoutData();

    describe('Limits', function() {
        createLimits();
        updateLimits();
    });
});
