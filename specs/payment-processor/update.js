'use strict';

let { prettifyRes } = require('common');
let { down, up } = require('seeds/payment-processor.seed');

let paymentProcessorId;

module.exports = () => {
    describe('#update', function() {
        beforeEach('create new Payment Processor', function() {
            return up().then((processorId) => {
                paymentProcessorId = processorId;
            });
        });

        afterEach('Clean up Payment Processor', function() {
            return down(paymentProcessorId);
        });

        it('should update payment processor name', function() {
            let paymentProcessorData = {
                name: 'updated paymentProcessor',
            };

            return request
                .asStuff
                .put(`/v1/payment-processors/${paymentProcessorId}`)
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payment Processor should be updated with status 200'));

                    expect(body.name).equal(paymentProcessorData.name, prettifyRes(res, 'should update name'));

                    expect(body.id).equal(paymentProcessorId);
                });
        });

        it('should update payment processor types', function() {
            let paymentProcessorData = {
                types: [
                    {
                        name: 'credit-card',
                        non_coded: true,
                        card_brands: [{ name: 'visa' }],
                    },
                ],
            };

            return request
                .asStuff
                .put(`/v1/payment-processors/${paymentProcessorId}`)
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payment Processor should be updated with status 200'));

                    expect(body.id).equal(paymentProcessorId);

                    expect(body.types.length).equal(1);
                    expect(body.types[0].name).equal('credit-card');
                    expect(body.types[0].non_coded).equal(true);

                    expect(body.types[0].card_brands).to.be.an('array');
                    expect(body.types[0].card_brands.length).equal(1);
                    expect(body.types[0].card_brands.map(b => b.name)).to.include('visa');
                });
        });

        it('shouldn\'t update payment processor adapter and types', function() {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [{ name: 'neteller' }],
            };

            return request
                .asStuff
                .put(`/v1/payment-processors/${paymentProcessorId}`)
                .send(paymentProcessorData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payment Processor shouldn\'t be updated with status 400'));

                    expect(body.errors.length).equal(1, prettifyRes(res));

                    expect(body.errors[0].field).equal('types', prettifyRes(res));
                })
                .then(() => request
                    .asStuff
                    .get(`/v1/payment-processors/${paymentProcessorId}`))
                .then((res) => {
                    let { body } = res;

                    expect(body.adapter).equal('Citigate', prettifyRes(res));

                    expect(body.types.length).equal(1, prettifyRes(res));

                    expect(body.types[0].name).equal('credit-card', prettifyRes(res));
                });
        });

        it('shouldn\'t update payment processor unique types', function() {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [
                    {
                        name: 'credit-card',
                        non_coded: true,
                        card_brands: [{ name: 'visa' }],
                    },
                    {
                        name: 'credit-card',
                        non_coded: true,
                        card_brands: [{ name: 'visa' }],
                    },
                ],
            };

            return request
                .asStuff
                .put(`/v1/payment-processors/${paymentProcessorId}`)
                .send(paymentProcessorData)
                .then((res) => {
                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payment Processor shouldn\'t be updated with status 400'));

                    let errors = res.body.errors.map(error => error.field);

                    expect(errors.length).equal(1, prettifyRes(res));

                    expect(errors.includes('unique_payment_processor_payment_method')).equal(true, prettifyRes(res));
                });
        });
    });
};
