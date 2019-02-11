'use strict';

let staffLoginTest = require('specs/login/staff.login');
let apiUserLoginTest = require('specs/login/api-user.login');

describe('Login', function() {
    staffLoginTest();
    apiUserLoginTest();
});
