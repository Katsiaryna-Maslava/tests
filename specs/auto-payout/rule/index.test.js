'use strict';

let create = require('./create');
let update = require('./update');
let remove = require('./delete');

describe('Auto Payout Rule', function() {
    create();
    update();
    remove();
});
