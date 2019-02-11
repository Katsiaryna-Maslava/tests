'use strict';

let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed.extended');
let depositTestSeed = require('seeds/deposit.seed');

let paymentProcessorId;
let merchantId;
let personId;

module.exports = () => {
    describe('#api-user login', function () {
        before('Create dependencies', async function() {
            let person = await personTestSeed.up({});

            personId = person.personId;
            merchantId = person.account.brand.merchant.id;
        });

        it('Should successfully generate API key', async function() {
            let apiKeyResponse = await request
                .asStuff
                .post(`/v1/merchants/${merchantId}/api-keys`)
                .send({});

            expect(apiKeyResponse.status).equal(
                200,
                prettifyRes(apiKeyResponse, 'Staff should succesfully generage apiKey')
            );
            expect(apiKeyResponse.body.private_key).to.be.a(
                'string',
                prettifyRes(apiKeyResponse, 'Private key should be a string')
            );
        });

        it('Should successfully log in as api User', async function () {
            let apiKeyResponse = await request
                .asStuff
                .post(`/v1/merchants/${merchantId}/api-keys`)
                .send({});

            expect(apiKeyResponse.status).equal(
                200,
                prettifyRes(apiKeyResponse, 'Staff should succesfully generage apiKey')
            );
            expect(apiKeyResponse.body.private_key).to.be.a(
                'string',
                prettifyRes(apiKeyResponse, 'Private key should be a string')
            );
            let apiKey = apiKeyResponse.body.private_key;

            let loginResponse = await request
                .post('/v1/api/signin')
                .send({ api_key: apiKey });

            expect(loginResponse.status).equal(
                200,
                prettifyRes(apiKeyResponse, 'Staff should succesfully login using apiKey')
            );
            expect(loginResponse.body.token).to.be.a(
                'string',
                prettifyRes(apiKeyResponse, 'Token should be a string')
            );
        });

        it('Should successfully execute deposit with generated API key', async function () {
            let apiKeyResponse = await request
                .asStuff
                .post(`/v1/merchants/${merchantId}/api-keys`)
                .send({});

            expect(apiKeyResponse.status).equal(
                200,
                prettifyRes(apiKeyResponse, 'Staff should succesfully generage apiKey')
            );
            expect(apiKeyResponse.body.private_key).to.be.a(
                'string',
                prettifyRes(apiKeyResponse, 'Private key should be a string')
            );
            let apiKey = apiKeyResponse.body.private_key;

            let loginResponse = await request
                .post('/v1/api/signin')
                .send({ api_key: apiKey });

            expect(loginResponse.status).equal(
                200,
                prettifyRes(loginResponse, 'Staff should succesfully login using apiKey')
            );
            expect(loginResponse.body.token).to.be.a(
                'string',
                prettifyRes(apiKeyResponse, 'Token should be a string')
            );

            let { token } = loginResponse.body;
            let data = {
                type: 'deposit',
                amount: 1200,
                person_id: personId,
            };

            let depositData = await depositTestSeed.getDepositData(data);
            let res = await request.withToken(token)
                .post('/v1/transactions')
                .send(depositData);

            paymentProcessorId = res.body.source_payment_processor.id;

            expect(res.status).equal(200, prettifyRes(res, 'Deposit should be created with status 200'));
            expect(res.body.source_amount).equal(1200, prettifyRes(res, 'Deposit amounts should be equal'));
        });

        after('Clean up', function() {
            return depositTestSeed.down(paymentProcessorId, personId);
        });
    });
};
