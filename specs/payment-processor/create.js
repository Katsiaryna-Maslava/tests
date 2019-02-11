'use strict';

let { prettifyRes } = require('common/index');
let { getPaymentProcessorData, up, down } = require('seeds/payment-processor.seed');

module.exports = () => {
    describe('#create', function() {
        it('should create payment processor with Ingenico adapter', function() {
            let paymentProcessorData = getPaymentProcessorData({
                adapter: 'Ingenico',
                supported_actions: 'deposit-payout',
                types: [
                    {
                        name: 'credit-card',
                        non_coded: false,
                        card_brands: [{ name: 'visa' }, { name: 'amex' }, { name: 'mastercard' }],
                    },
                ],
            });

            return request
                .asStuff
                .post('/v1/payment-processors')
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payment Processor should be created with status 200'));

                    let paymentProcessorId = body.id;

                    let fields = Object.keys(body);

                    expect(fields.includes('deleted_at')).equal(false, prettifyRes(body));

                    expect(paymentProcessorId).be.a('string');

                    expect(body.adapter).equal('Ingenico');

                    expect(body.types).to.be.an('array');
                    expect(body.currencies).to.be.an('array');
                    expect(body.geo_rules).to.be.an('array');
                    expect(body.name).to.be.an('string');
                    expect(body.enabled).to.be.an('boolean');
                    expect(body.testmode).to.be.an('boolean');

                    expect(body.supported_actions).equal('deposit-payout');

                    expect(body.types.length).equal(1);
                    expect(body.types[0].name).equal('credit-card');
                    expect(body.types[0].non_coded).equal(false);

                    expect(body.types[0].card_brands).to.be.an('array');
                    expect(body.types[0].card_brands.length).equal(3);
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('visa');
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('amex');
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('mastercard');

                    return down(paymentProcessorId);
                });
        });

        it('should create payment processor with Citigate adapter', function() {
            let paymentProcessorData = getPaymentProcessorData({
                adapter: 'Citigate',
                supported_actions: 'deposit-payout',
                types: [
                    {
                        name: 'credit-card',
                        non_coded: false,
                        card_brands: [{ name: 'visa' }, { name: 'amex' }, { name: 'mastercard' }],
                    },
                ],
            });

            return request
                .asStuff
                .post('/v1/payment-processors')
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payment Processor should be created with status 200'));

                    let paymentProcessorId = body.id;

                    expect(paymentProcessorId).be.a('string');

                    expect(body.adapter).equal('Citigate');

                    expect(body.types).to.be.an('array');
                    expect(body.currencies).to.be.an('array');
                    expect(body.geo_rules).to.be.an('array');
                    expect(body.name).to.be.an('string');
                    expect(body.enabled).to.be.an('boolean');
                    expect(body.testmode).to.be.an('boolean');

                    expect(body.supported_actions).equal('deposit-payout');

                    expect(body.types.length).equal(1);
                    expect(body.types[0].name).equal('credit-card');
                    expect(body.types[0].non_coded).equal(false);

                    expect(body.types[0].card_brands).to.be.an('array');
                    expect(body.types[0].card_brands.length).equal(3);
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('visa');
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('amex');
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('mastercard');

                    return down(paymentProcessorId);
                });
        });

        it('should create payment processor with Neteller adapter', function() {
            let paymentProcessorData = getPaymentProcessorData({
                adapter: 'Neteller',
                supported_actions: 'deposit',
                types: [{ name: 'neteller' }],
            });

            return request
                .asStuff
                .post('/v1/payment-processors')
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payment Processor should be created with status 200'));

                    let paymentProcessorId = body.id;

                    expect(paymentProcessorId).be.a('string');

                    expect(body.adapter).equal('Neteller');

                    expect(body.supported_actions).equal('deposit');

                    expect(body.types.length).equal(1);
                    expect(body.types[0].name).equal('neteller');

                    return down(paymentProcessorId);
                });
        });

        it('should create payment processor with Skrill adapter', function() {
            let paymentProcessorData = getPaymentProcessorData({
                adapter: 'Skrill',
                supported_actions: 'payout',
                types: [{ name: 'skrill' }],
            });

            return request
                .asStuff
                .post('/v1/payment-processors')
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payment Processor should be created with status 200'));

                    let paymentProcessorId = body.id;

                    expect(paymentProcessorId).be.a('string');
                    expect(body.adapter).equal('Skrill');
                    expect(body.supported_actions).equal('payout');
                    expect(body.types.length).equal(1);
                    expect(body.types[0].name).equal('skrill');

                    return down(paymentProcessorId);
                });
        });

        it('shouldn\'t create payment processor', function() {
            return request
                .asStuff
                .post('/v1/payment-processors')
                .send({})
                .then((res) => {
                    let { errors } = res.body;

                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payment Processor shouldn\'t be created with status 400'));

                    expect(errors).to.be.an('array');
                    expect(errors.length).equal(9);

                    expect(errors[0].field).equal('merchant_id');
                    expect(errors[1].field).equal('adapter');
                    expect(errors[2].field).equal('name');
                    expect(errors[3].field).equal('currencies');
                    expect(errors[4].field).equal('settlement_currency');
                    expect(errors[5].field).equal('geo_rules');
                    expect(errors[6].field).equal('enabled');
                    expect(errors[7].field).equal('supported_actions');
                    expect(errors[8].field).equal('testmode');
                });
        });

        it('should clone Payment Processor', async function() {
            let paymentProcessorId = await up();

            let paymentProcessorResponse = await request
                .asStuff
                .get(`/v1/payment-processors/${paymentProcessorId}`);

            expect(paymentProcessorResponse.status).equal(
                200,
                prettifyRes(paymentProcessorResponse, 'Payment Processor should be created with status 200'),
            );

            let updatedPaymentProcessorData = Object.assign(paymentProcessorResponse.body, {
                name: 'New Payment Processor',
                currencies: ['EUR'],
            });

            let paymentProcessorData = getPaymentProcessorData(updatedPaymentProcessorData);

            let newPaymentProcessorResponse = await request
                .asStuff
                .post('/v1/payment-processors')
                .send(paymentProcessorData);

            let { body: newPaymentProcessorBody } = newPaymentProcessorResponse;
            let newPaymentProcessorId = newPaymentProcessorBody.id;

            expect(newPaymentProcessorResponse.status).equal(
                200,
                prettifyRes(newPaymentProcessorResponse, 'Payment Processor should be created with status 200'),
            );

            expect(newPaymentProcessorId).be.a('string');

            expect(newPaymentProcessorBody.adapter).equal('Citigate');

            expect(newPaymentProcessorBody.types).to.be.an('array');
            expect(newPaymentProcessorBody.currencies).to.be.an('array');
            expect(newPaymentProcessorBody.geo_rules).to.be.an('array');
            expect(newPaymentProcessorBody.name).to.be.an('string');

            return Promise.all([
                down(paymentProcessorId),
                down(newPaymentProcessorId),
            ]);
        });

        it(
            'Payment Processor isn\'t cloned when such values are already existing in other Payment Processor',
            async function() {
                let paymentProcessorId = await up();

                let paymentProcessorResponse = await request
                    .asStuff
                    .get(`/v1/payment-processors/${paymentProcessorId}`);

                expect(paymentProcessorResponse.status).equal(
                    200,
                    prettifyRes(paymentProcessorResponse, 'Payment Processor should be created with status 200'),
                );

                let paymentProcessorData = getPaymentProcessorData(paymentProcessorResponse.body);

                let newPaymentProcessorResponse = await request
                    .asStuff
                    .post('/v1/payment-processors')
                    .send(paymentProcessorData);

                expect(newPaymentProcessorResponse.status).equal(
                    400,
                    prettifyRes(newPaymentProcessorResponse, 'Payment Processor shouldn\'t be created with status 400'),
                );

                let errors = newPaymentProcessorResponse.body.errors.map(error => error.field);

                expect(errors.length)
                    .equal(1, prettifyRes(newPaymentProcessorResponse.body));
                expect(errors.includes('unique_payment_processor_name'))
                    .equal(true, prettifyRes(newPaymentProcessorResponse.body));

                return down(paymentProcessorId);
            },
        );
    });
};
