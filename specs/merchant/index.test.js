'use strict';

let creationTest = require('specs/merchant/create');
let deletingTest = require('specs/merchant/delete');
let editingTest = require('specs/merchant/edit');
let updatingTest = require('specs/merchant/update');
let viewingTest = require('specs/merchant/view');

describe('Merchant', function() {
    creationTest();
    deletingTest();
    editingTest();
    updatingTest();
    viewingTest();
});
