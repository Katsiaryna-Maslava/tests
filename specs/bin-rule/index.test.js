'use strict';

let create = require('./create');
let read = require('./read');
let update = require('./update');
let remove = require('./delete');
let test = require('./test');

describe('Bin Rule', function() {
    create();
    read();
    update();
    remove();
    test();
});
