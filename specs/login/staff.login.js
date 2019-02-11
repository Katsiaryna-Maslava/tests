'use strict';

let { generateUniqueEmail } = require('common');
let { prettifyRes } = require('common');
let staffTestSeed = require('seeds/staff.seed');

module.exports = () => {
    describe('#staff login', function() {
        it('Should successfully log in as existing staff', function () {
            let staffData = {
                password: 'test-password',
                password_2: 'test-password',
                email: generateUniqueEmail('test-login'),
            };

            return staffTestSeed.up(staffData)
                .then(() => request
                    .post('/v1/staff/signin')
                    .send({ password: staffData.password, email: staffData.email }))
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Staff should be logged in with status 200'));
                    expect(res.body.token).to.be.an('string');
                });
        });

        it('Shouldn\'t log in with invalid password', function () {
            let staffData = {
                password: 'test-password',
                password_2: 'test-password',
                email: generateUniqueEmail('test-login'),
            };

            return staffTestSeed.up(staffData)
                .then(() => request
                    .post('/v1/staff/signin')
                    .send({ password: 'invalid-password', email: staffData.email }))
                .then((res) => {
                    expect(res.status).equal(400, prettifyRes(res, 'Staff should not be logged in with status 400'));

                    // very important! we shouldn't say what exactly field is incorrect because of security reasons
                    expect(res.body.errors[0].field).equal('', prettifyRes(res));
                    expect(res.body.errors[0].message).equal('Invalid credentials', prettifyRes(res));
                });
        });

        it('Shouldn\'t log in with invalid email and password', function () {
            let staffData = {
                password: 'UNexSistingPassword123',
                email: 'NOtFOunddddEmail@testter.test',
            };

            return request
                .post('/v1/staff/signin')
                .send({ password: staffData.password, email: staffData.email })
                .then((res) => {
                    expect(res.status).equal(400, prettifyRes(res, 'Staff should not be logged in with status 400'));

                    // very important! we shouldn't say what exactly field is incorrect because of security reasons
                    expect(res.body.errors[0].field).equal('', prettifyRes(res));
                    expect(res.body.errors[0].message).equal('Invalid credentials', prettifyRes(res));
                });
        });
    });
};
