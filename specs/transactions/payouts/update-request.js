'use strict';

let payoutRequestTestSeed = require('seeds/payout-request.seed');
let { INITIAL_WALLET_AMOUNT } = require('seeds/person.seed.extended');
let paymentProcessorTestSeed = require('seeds/payment-processor.seed');
let paymentAccountTestSeed = require('seeds/payment-account.seed');
let { prettifyRes, getWallets } = require('common');
let { cleanUpTable } = require('common/db');

let payoutOptionId;
let paymentProcessorId;
let payoutRequestId;
let personId;
let paymentAccountId;

const COMMENTS_FOR_PAYOUT_REQUEST = 'Hello';
const PAYMENT_PROCESSOR_ADAPTER_NAME = 'Ingenico';

module.exports = () => {
    describe('#update', function() {
        beforeEach('Create new Payout Request', async function() {
            let payoutRequestResult = await payoutRequestTestSeed.up();

            let { res } = payoutRequestResult;

            expect(res.status).equal(200, prettifyRes(res, 'Payout Request should created with status 200'));
            expect(res.body.id).be.a('string');

            paymentAccountId = res.body.target.id;
            payoutRequestId = payoutRequestResult.payoutRequestId;
            paymentProcessorId = payoutRequestResult.paymentProcessorId;
            personId = payoutRequestResult.personId;
            payoutOptionId = payoutRequestResult.payoutOptionId;
            let totalAmount = res.body.charge_amount + res.body.processing_fee_amount;

            let wallets = await getWallets(personId);

            let realwallet = wallets.find(wallet => wallet.type === 'real');
            let realWalletAmount = realwallet.amount;
            let expectedRealWalletAmount = INITIAL_WALLET_AMOUNT - totalAmount;

            expect(realWalletAmount)
                .equal(expectedRealWalletAmount, 'Wallet with Real money should be decremented on this amount');

            let pendingWalletAmount = realwallet.pending.amount;

            expect(pendingWalletAmount).equal(totalAmount, 'Pending Wallet should be incremented on this amount');
        });

        afterEach('Clean up', async function() {
            await Promise.all([
                cleanUpTable('payout_requests'),
                personId && paymentAccountId && paymentAccountTestSeed.down(personId, paymentAccountId),
            ]);

            // need to call after clean up payment-account
            await payoutRequestTestSeed.down(paymentProcessorId, personId, payoutOptionId);

            await cleanUpTable('payout_options');

            payoutOptionId = null;
            paymentProcessorId = null;
            payoutRequestId = null;
            personId = null;
            paymentAccountId = null;
        });

        it('should update payout request (comments and payment processor)', async function() {
            let newPaymentProcessorData = {
                adapter: PAYMENT_PROCESSOR_ADAPTER_NAME,
                types: [{ name: 'credit-card', non_coded: false, card_brands: [] }],
            };

            let newPaymentProcessorId = await paymentProcessorTestSeed.up(newPaymentProcessorData);

            let { body: updatedPayoutRequestResult } = await request
                .asStuff
                .put(`/v1/payout-requests/${payoutRequestId}`)
                .send({
                    comments: COMMENTS_FOR_PAYOUT_REQUEST,
                    paymentProcessorId: newPaymentProcessorId,
                });

            let {
                adapter: updatedPaymentProcessorAdapter,
                id: updatedPaymentProcessorId,
            } = updatedPayoutRequestResult.payment_processor;

            expect(updatedPayoutRequestResult.comments)
                .equal(COMMENTS_FOR_PAYOUT_REQUEST, `Comment should be equal ${COMMENTS_FOR_PAYOUT_REQUEST}`);

            expect(updatedPaymentProcessorId)
                .equal(newPaymentProcessorId, `Payment processor id should be equal ${newPaymentProcessorId}`);

            expect(updatedPaymentProcessorAdapter).equal(
                PAYMENT_PROCESSOR_ADAPTER_NAME,
                `Payment processor adapter should be equal ${PAYMENT_PROCESSOR_ADAPTER_NAME}`,
            );

            await paymentProcessorTestSeed.down(newPaymentProcessorId);
        });
    });
};
