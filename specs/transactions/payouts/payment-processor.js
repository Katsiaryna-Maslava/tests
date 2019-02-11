'use strict';

let payoutRequestTestSeed = require('seeds/payout-request.seed');
let { prettifyRes } = require('common');
let paymentProcessorTestSeed = require('seeds/payment-processor.seed');

let paymentProcessorId;
let disabledPaymentProcessorId;
let notSupportingPayoutPaymentProcessorId;
let notSupportingCCBrandPaymentProcessorId;

module.exports = () => {
    describe('#Payment processor validation', function() {
        before('Create dependencies', function() {
            let disabledPaymentProcessorData = {
                enabled: false,
            };

            let notSupportingPayoutPaymentProcessorData = {
                supported_actions: 'deposit',
            };

            let notSupportingCCBrandPaymentProcessorData = {
                types: [{
                    name: 'credit-card',
                    non_coded: false,
                    card_brands: [{ name: 'amex' }],
                }],
            };

            return Promise.all([
                paymentProcessorTestSeed.up(),
                paymentProcessorTestSeed.up(disabledPaymentProcessorData),
                paymentProcessorTestSeed.up(notSupportingPayoutPaymentProcessorData),
                paymentProcessorTestSeed.up(notSupportingCCBrandPaymentProcessorData),
            ]).then((paymentProcessors) => {
                paymentProcessorId = paymentProcessors[0];
                disabledPaymentProcessorId = paymentProcessors[1];
                notSupportingPayoutPaymentProcessorId = paymentProcessors[2];
                notSupportingCCBrandPaymentProcessorId = paymentProcessors[3];
            });
        });

        after('Clean up', function() {
            return Promise.all([
                paymentProcessorTestSeed.down(paymentProcessorId),
                paymentProcessorTestSeed.down(disabledPaymentProcessorId),
                paymentProcessorTestSeed.down(notSupportingPayoutPaymentProcessorId),
                paymentProcessorTestSeed.down(notSupportingCCBrandPaymentProcessorId),
            ]);
        });

        it('shouldn\'t create payout-request with disabled Payment Processor', function() {
            return payoutRequestTestSeed.up({ payment_processor_id: disabledPaymentProcessorId })
                .then(({ res }) => {
                    expect(res.status).equal(400, prettifyRes(res));
                    let { errors } = res.body;

                    expect(errors[0].field).equal('payment_processor_id');
                    expect(errors[0].message).equal('Payment Processor is disabled');
                });
        });

        it('shouldn\'t create payout-request with not supporting payouts Payment Processor', function() {
            return payoutRequestTestSeed.up({ payment_processor_id: notSupportingPayoutPaymentProcessorId })
                .then(({ res }) => {
                    expect(res.status).equal(400, prettifyRes(res));
                    let { errors } = res.body;

                    expect(errors[0].field).equal('payment_processor_id');
                    expect(errors[0].message).equal('Payment Processor doesn\'t support payouts');
                });
        });

        it('shouldn\'t create payout-request with not supporting CC brand Payment Processor', function() {
            return payoutRequestTestSeed.up({ payment_processor_id: notSupportingCCBrandPaymentProcessorId })
                .then(({ res }) => {
                    expect(res.status).equal(400, prettifyRes(res));
                    let { errors } = res.body;

                    expect(errors[0].field).equal('payment_processor_id');
                    expect(errors[0].message).equal('Payment Processor doesn\'t support Card Brand of Payment Account');
                });
        });

        it('shouldn\'t authorize payout-request with disabled Payment Processor', function() {
            return payoutRequestTestSeed.up()
                .then(({ payoutRequestId }) => payoutRequestTestSeed
                    .authorize(payoutRequestId, { payment_processor_id: disabledPaymentProcessorId })
                    .then((res) => {
                        expect(res.status).equal(400, prettifyRes(res));
                        let { errors } = res.body;

                        expect(errors[0].field).equal('payment_processor_id');
                        expect(errors[0].message).equal('Payment Processor is disabled');
                    }));
        });

        it('shouldn\'t authorize payout-request with not supporting payouts Payment Processor', function() {
            return payoutRequestTestSeed.up()
                .then(({ payoutRequestId }) => payoutRequestTestSeed
                    .authorize(payoutRequestId, { payment_processor_id: notSupportingPayoutPaymentProcessorId })
                    .then((res) => {
                        expect(res.status).equal(400, prettifyRes(res));
                        let { errors } = res.body;

                        expect(errors[0].field).equal('payment_processor_id');
                        expect(errors[0].message).equal('Payment Processor doesn\'t support payouts');
                    }));
        });

        it('shouldn\'t authorize payout-request with not supporting CC brand Payment Processor', function() {
            return payoutRequestTestSeed.up()
                .then(({ payoutRequestId }) => payoutRequestTestSeed
                    .authorize(payoutRequestId, { payment_processor_id: notSupportingCCBrandPaymentProcessorId })
                    .then((res) => {
                        expect(res.status).equal(400, prettifyRes(res));

                        let errors = res.body.errors.map(e => e.field);

                        expect(errors.length).equal(1, prettifyRes(res));
                        expect(errors.includes('payment_processor_id')).equal(true, prettifyRes(res));
                    }));
        });
    });
};
