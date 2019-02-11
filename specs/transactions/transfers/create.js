'use strict';

let personTestSeed = require('seeds/person.seed.extended');
let orderTestSeed = require('seeds/order.seed');
let transferTestSeed = require('seeds/transfer.seed');
let codes = require('src/modules/payment-processor/adapters/codes');
let { calculateHash } = require('common/utils');
let { prettifyRes } = require('common');

let personId;
let merchantId;
const SHA_IN_SECRET_PHRASE = 'VWVK8Sa47TVV8dnOuakadEc7s4Nq9ADHZGssoWbCN28sL8ho';
const SHA_OUT_SECRET_PHRASE = 'T5b21F22l1Loi6d92DtDkSD5BbxbsXyCVvJlQR69Sal0f06s';

module.exports = () => {
    describe('#create', function () {
        beforeEach('Create dependencies', function () {
            return personTestSeed.up()
                .then((person) => {
                    personId = person.personId;
                    merchantId = person.account.brand.merchant.id;
                });
        });

        afterEach('Clean up', function () {
            return Promise.all([
                personTestSeed.down(personId),
                transferTestSeed.down(),
            ]);
        });

        it('should create order if rates are returned by crypto PP', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            expect(orderResponse.status)
                .equal(200, prettifyRes(orderResponse, 'Order should be created with status 200'));

            expect(orderResponse.body.id).be.a('string');
            expect(orderResponse.body.from).be.a('string');
            expect(orderResponse.body.to).be.a('string');
            expect(['EUR', 'USD']).to.include(orderResponse.body.from, prettifyRes(orderResponse.body));
            expect(['BTC', 'BCH']).to.include(orderResponse.body.to, prettifyRes(orderResponse.body));
            expect(orderResponse.body.service_fee).be.a('number');
            expect(orderResponse.body.network_fee).be.a('number');
            expect(orderResponse.body.exchange_rate).be.a('number');
            expect(orderResponse.body.exchange_rate_without_fee).be.a('number');
        });

        it('should not create order with invalid data', async function() {
            let orderResponse = await orderTestSeed.up({});

            let errors = orderResponse.body.errors.map(error => error.field);

            expect(orderResponse.status)
                .equal(400, prettifyRes(orderResponse, 'Order should not be created with status 200'));

            expect(errors.length).equal(1, prettifyRes(orderResponse));
            expect(errors.includes('person_id')).equal(true, prettifyRes(orderResponse));
        });

        it('should create transfer from EUR to BCH', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            let transferResponse = await transferTestSeed.up({ orderId: orderResponse.body.id, personId });

            expect(transferResponse.status)
                .equal(200, prettifyRes(transferResponse, 'Transfer should be created with status 200'));

            expect(transferResponse.body.id).be.a('string');
            expect(transferResponse.body.source).be.a('object');
            expect(transferResponse.body.target).be.a('object');
        });

        it('should create transfer from EUR to BTC', async function() {
            let orderResponse = await orderTestSeed.up({ personId, to: 'BTC' });

            let transferResponse = await transferTestSeed.up({
                orderId: orderResponse.body.id,
                personId,
                target: {
                    currency: 'BTC',
                    identifier: '1PcAXZu7kdsRRGFMj6Fx8jqU9Ng1YZKwiC',
                },
            });

            expect(transferResponse.status)
                .equal(200, prettifyRes(transferResponse, 'Transfer should be created with status 200'));

            expect(transferResponse.body.id).be.a('string');
            expect(transferResponse.body.source).be.a('object');
            expect(transferResponse.body.target).be.a('object');
        });

        it('should create transfer from USD to BCH', async function() {
            let orderResponse = await orderTestSeed.up({ personId, from: 'USD' });

            let transferResponse = await transferTestSeed.up({
                orderId: orderResponse.body.id,
                personId,
                source: {
                    currency: 'USD',
                },
            });

            expect(transferResponse.status)
                .equal(200, prettifyRes(transferResponse, 'Transfer should be created with status 200'));

            expect(transferResponse.body.id).be.a('string');
            expect(transferResponse.body.source).be.a('object');
            expect(transferResponse.body.target).be.a('object');
        });

        it('should create transfer from USD to BTC', async function() {
            let orderResponse = await orderTestSeed.up({ personId, from: 'USD', to: 'BTC' });

            let transferResponse = await transferTestSeed.up({
                orderId: orderResponse.body.id,
                personId,
                source: {
                    currency: 'USD',
                },
                target: {
                    currency: 'BTC',
                    identifier: '1PcAXZu7kdsRRGFMj6Fx8jqU9Ng1YZKwiC',
                },
            });

            expect(transferResponse.status)
                .equal(200, prettifyRes(transferResponse, 'Transfer should be created with status 200'));

            expect(transferResponse.body.id).be.a('string');
            expect(transferResponse.body.source).be.a('object');
            expect(transferResponse.body.target).be.a('object');
        });

        it('should create transfer with different statuses: accepted, approved', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            let transferResponse = await transferTestSeed.up({ orderId: orderResponse.body.id, personId });

            expect(transferResponse.body.status.code)
                .equal(
                    codes.status.ACCEPTED,
                    prettifyRes(transferResponse, 'Transaction status should be equal 2 (ACCEPTED)'),
                );

            await request
                .asStuff
                .post(`/v1/merchants/${merchantId}/adapters-credential`)
                .send({
                    ingenicoTest: {
                        shaInSecretPhrase: SHA_IN_SECRET_PHRASE,
                        shaOutSecretPhrase: SHA_OUT_SECRET_PHRASE,
                    },
                });

            let dataForWebhook = { status: '9', orderId: transferResponse.body.id, amount: 10 };

            dataForWebhook.shasign = calculateHash(dataForWebhook, SHA_OUT_SECRET_PHRASE);

            await request
                .asStuff
                .post('/v1/transactions/webhooks/ingenico')
                .send(dataForWebhook);

            let transaction = await request
                .asStuff
                .get(`/v1/transactions/${transferResponse.body.id}`);

            expect(transaction.body.status.code)
                .equal(
                    codes.status.APPROVED,
                    prettifyRes(transaction, 'Transaction status should be equal 0 (APPROVED)'),
                );
        });

        it('should create transfer with different statuses: accepted, declined', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            let transferResponse = await transferTestSeed.up({ orderId: orderResponse.body.id, personId });

            expect(transferResponse.body.status.code)
                .equal(
                    codes.status.ACCEPTED,
                    prettifyRes(transferResponse, 'Transaction status should be equal 2 (ACCEPTED)'),
                );

            await request
                .asStuff
                .post(`/v1/merchants/${merchantId}/adapters-credential`)
                .send({
                    ingenicoTest: {
                        shaInSecretPhrase: SHA_IN_SECRET_PHRASE,
                        shaOutSecretPhrase: SHA_OUT_SECRET_PHRASE,
                    },
                });

            let dataForWebhook = { status: '0', orderId: transferResponse.body.id, amount: 10 };

            dataForWebhook.shasign = calculateHash(dataForWebhook, SHA_OUT_SECRET_PHRASE);

            await request
                .asStuff
                .post('/v1/transactions/webhooks/ingenico')
                .send(dataForWebhook);

            let transaction = await request
                .asStuff
                .get(`/v1/transactions/${transferResponse.body.id}`);

            expect(transaction.body.status.code)
                .equal(
                    codes.status.DECLINED,
                    prettifyRes(transaction, 'Transaction status should be equal 10 (DECLINED)'),
                );
        });

        it('should not create transfer with invalid data', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            let transferResponse = await transferTestSeed.up({
                orderId: orderResponse.body.id,
                personId: '123',
            });

            let errors = transferResponse.body.errors.map(error => error.field);

            expect(transferResponse.status)
                .equal(400, prettifyRes(transferResponse, 'Transfer should not be created with status 200'));

            expect(errors.length).equal(1, prettifyRes(transferResponse));
            expect(errors.includes('person_id')).equal(true, prettifyRes(transferResponse));
        });

        it('should create transfer with 3d secure', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            let transferResponse = await transferTestSeed.up({
                orderId: orderResponse.body.id,
                personId,
                three_d_secure_redirection_url: 'https://google.com',
            });

            await request
                .asStuff
                .post(`/v1/merchants/${merchantId}/adapters-credential`)
                .send({
                    ingenicoTest: {
                        shaInSecretPhrase: SHA_IN_SECRET_PHRASE,
                        shaOutSecretPhrase: SHA_OUT_SECRET_PHRASE,
                    },
                });

            let dataForWebhook = { status: '9', orderId: transferResponse.body.id, amount: 10 };

            dataForWebhook.shasign = calculateHash(dataForWebhook, SHA_OUT_SECRET_PHRASE);

            await request
                .asStuff
                .post('/v1/transactions/webhooks/ingenico/three-d-secure')
                .send(dataForWebhook);

            let transaction = await request
                .asStuff
                .get(`/v1/transactions/${transferResponse.body.id}`);

            expect(transaction.body.status.code)
                .equal(
                    codes.status.ACCEPTED,
                    prettifyRes(transaction, 'Transaction status should be equal 2 (ACCEPTED)'),
                );
        });

        it('should not create transfer with 3d secure invalid data', async function() {
            let orderResponse = await orderTestSeed.up({ personId });

            let transferResponse = await transferTestSeed.up({
                orderId: orderResponse.body.id,
                personId: '123',
                three_d_secure_redirection_url: 'google.com',
            });

            let errors = transferResponse.body.errors.map(error => error.field);

            expect(transferResponse.status)
                .equal(400, prettifyRes(transferResponse, 'Transfer should not be created with status 200'));

            expect(errors.length).equal(1, prettifyRes(transferResponse));
            expect(errors.includes('person_id')).equal(true, prettifyRes(transferResponse));
        });
    });
};
