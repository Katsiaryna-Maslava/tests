'use strict';

let create = require('./create');
let update = require('./update');
let remove = require('./delete');
let swapPriorities = require('./swap-priorities');

describe('Bin Processor', function() {
    create();
    update();
    remove();
    swapPriorities();
});
