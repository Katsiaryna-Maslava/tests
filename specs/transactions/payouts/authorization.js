'use strict';

let payoutRequestTestSeed = require('seeds/payout-request.seed');
let { prettifyRes } = require('common');

let payoutOptionId;
let paymentProcessorId;
let payoutRequestId;
let personId;

module.exports = () => {
    describe('#authorization', function() {
        after('Clean up', function() {
            return payoutRequestTestSeed.down(paymentProcessorId, personId, payoutOptionId);
        });

        it('should authorize payout-request with chargeAmount more then half of wallet amount', function() {
            return payoutRequestTestSeed.up({ charge_amount: 600000 })
                .then((result) => {
                    let { res } = result;

                    expect(res.status).equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
                    expect(res.body.id).be.a('string');

                    payoutRequestId = result.payoutRequestId;
                    paymentProcessorId = result.paymentProcessorId;
                    personId = result.personId;
                    payoutOptionId = result.payoutOptionId;

                    let authorizePayoutRequestData = {
                        payment_processor_id: paymentProcessorId,
                        comments: 'New comment here',
                        history: 'yes',
                        kyc_or_aml: 'yes',
                        liquidity: 'yes',
                        authorization: 'yes',
                        status: 'authorized-manually',
                    };

                    return payoutRequestTestSeed.authorize(payoutRequestId, authorizePayoutRequestData);
                })
                .then((res) => {
                    expect(res.body.status).equal('authorized-manually');
                });
        });
    });
};
