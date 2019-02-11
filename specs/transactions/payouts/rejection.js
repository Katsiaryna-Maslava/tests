'use strict';

let payoutRequestTestSeed = require('seeds/payout-request.seed');
let paymentProcessorTestSeed = require('seeds/payment-processor.seed');
let payoutOptionTestSeed = require('seeds/payout-options-and-limits.seed');
let paymentAccountTestSeed = require('seeds/payment-account.seed');
let walletTestSeed = require('seeds/wallet.seed');
let personTestSeed = require('seeds/person.seed.extended');
let { INITIAL_WALLET_AMOUNT } = require('seeds/person.seed.extended');
let { prettifyRes, getWallets } = require('common');
let { request } = require('config.test');
let { cleanUpTable } = require('common/db');

let payoutOptionId;
let paymentProcessorId;
let payoutRequestId;
let personId;

const COMMENTS_FOR_REJECTED_PAYOUT_REQUEST = 'Sadness';
const PAYOUT_REQUEST_REJECTION_STATUS = 'rejected';

module.exports = () => {
    describe('#rejection', function() {
        afterEach('Clean up', async function() {
            await Promise.all([
                cleanUpTable('payout_requests'),
                payoutRequestTestSeed.down(paymentProcessorId, personId, payoutOptionId),
            ]);

            payoutOptionId = null;
            paymentProcessorId = null;
            payoutRequestId = null;
            personId = null;
        });

        it('should reject payout request for Credit Card', async function() {
            let payoutRequestResult = await payoutRequestTestSeed.up();

            let { res } = payoutRequestResult;

            expect(res.status).equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
            expect(res.body.id).be.a('string');
            expect(res.body.target.type).equal('credit-card', 'Payout Request should be created for Credit Card');

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

            let rejectPayoutRequestData = {
                status: PAYOUT_REQUEST_REJECTION_STATUS,
                comments: COMMENTS_FOR_REJECTED_PAYOUT_REQUEST,
            };

            let { body: rejectedPayoutRequestResult } = await request
                .asStuff
                .put(`/v1/payout-requests/${payoutRequestId}`)
                .send(rejectPayoutRequestData);

            expect(rejectedPayoutRequestResult.status).equal(
                PAYOUT_REQUEST_REJECTION_STATUS,
                `Status should be equal ${PAYOUT_REQUEST_REJECTION_STATUS}`,
            );
            expect(rejectedPayoutRequestResult.comments).equal(
                COMMENTS_FOR_REJECTED_PAYOUT_REQUEST,
                `Comment should be equal ${COMMENTS_FOR_REJECTED_PAYOUT_REQUEST}`,
            );

            wallets = await getWallets(personId);

            realwallet = wallets.find(wallet => wallet.type === 'real');
            realWalletAmount = realwallet.amount;

            expect(realWalletAmount)
                .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Real money should be equal to the initial amount');

            pendingWalletAmount = realwallet.pending.amount;

            expect(pendingWalletAmount).equal(0, 'Pending Wallet should be equal to the initial amount');
        });

        it('should reject payout request for Neteller', async function() {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [{ name: 'neteller', non_coded: false, card_brands: [] }],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let payoutOptionData = {
                payment_method: 'neteller',
                default_payment_processor_id: paymentProcessorId,
            };

            await payoutOptionTestSeed.up(payoutOptionData);

            let payoutRequestData = {
                target: {
                    neteller_secure_id: 555223,
                    identifier: 'netellertest_EUR@neteller.com',
                    type: 'neteller',
                    card: null,
                },
                payment_processor_id: paymentProcessorId,
            };

            let payoutRequestResult = await payoutRequestTestSeed.up(payoutRequestData);

            let { res } = payoutRequestResult;

            expect(res.status).equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
            expect(res.body.id).be.a('string');
            expect(res.body.target.type).equal('neteller', 'Payout Request should be created for Neteller');

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

            let rejectPayoutRequestData = {
                status: PAYOUT_REQUEST_REJECTION_STATUS,
                comments: COMMENTS_FOR_REJECTED_PAYOUT_REQUEST,
            };

            let { body: rejectedPayoutRequestResult } = await request
                .asStuff
                .put(`/v1/payout-requests/${payoutRequestId}`)
                .send(rejectPayoutRequestData);

            expect(rejectedPayoutRequestResult.status).equal(
                PAYOUT_REQUEST_REJECTION_STATUS,
                `Status should be equal ${PAYOUT_REQUEST_REJECTION_STATUS}`,
            );
            expect(rejectedPayoutRequestResult.comments).equal(
                COMMENTS_FOR_REJECTED_PAYOUT_REQUEST,
                `Comment should be equal ${COMMENTS_FOR_REJECTED_PAYOUT_REQUEST}`,
            );

            wallets = await getWallets(personId);

            realwallet = wallets.find(wallet => wallet.type === 'real');
            realWalletAmount = realwallet.amount;

            expect(realWalletAmount)
                .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Real money should be equal to the initial amount');

            pendingWalletAmount = realwallet.pending.amount;

            expect(pendingWalletAmount).equal(0, 'Pending Wallet should be equal to the initial amount');
        });

        it('should reject payout request for Venus Point', async function() {
            let paymentProcessorData = {
                adapter: 'Venus Point',
                supported_actions: 'deposit-payout',
                currencies: ['USD'],
                types: [{ name: 'venus-point' }],
            };

            let paymentAccountData = {
                source_type: 'venus-point',
                identifier: 'U003455',
            };

            let walletData = {
                method: 'withdrawal-deposit',
                name: 'Venus Point',
                type: 'venus-point',
            };

            let person = await personTestSeed.up();

            personId = person.personId;

            let [{ body: venusPointPaymentAccount }, processorId, { body: personWallet }] = await Promise.all([
                paymentAccountTestSeed.up(personId, paymentAccountData),
                paymentProcessorTestSeed.up(paymentProcessorData),
                walletTestSeed.up(personId, walletData),
            ]);

            paymentProcessorId = processorId;
            let paymentAccountId = venusPointPaymentAccount.id;
            let walletId = personWallet.id;

            let incrementionWalletData = {
                personId,
                target: {
                    id: walletId,
                },
                amount: INITIAL_WALLET_AMOUNT,
                type: 'adjustment',
                currency: 'USD',
            };

            let incrementionWalletResult = await request
                .asStuff
                .post('/v1/transactions')
                .send(incrementionWalletData);

            expect(incrementionWalletResult.status)
                .equal(
                    200,
                    prettifyRes(incrementionWalletResult, 'Venus point Balance should be incremented with status 200')
                );

            let payoutRequestData = {
                person_id: personId,
                source: { id: walletId },
                target: { id: paymentAccountId },
                payment_processor_id: paymentProcessorId,
            };

            let payoutOptionData = {
                payment_method: 'venus-point',
                default_payment_processor_id: paymentProcessorId,
            };

            await payoutOptionTestSeed.up(payoutOptionData);

            let payoutRequestResult = await payoutRequestTestSeed.up(payoutRequestData);

            let { res } = payoutRequestResult;

            expect(res.status).equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
            expect(res.body.id).be.a('string');
            expect(res.body.target.type).equal('venus-point', 'Payout Request should be created for Venus Point');

            payoutRequestId = payoutRequestResult.payoutRequestId;
            payoutOptionId = payoutRequestResult.payoutOptionId;

            let totalAmount = res.body.charge_amount + res.body.processing_fee_amount;

            let wallets = await getWallets(personId);

            let venusPointWallet = wallets.find(wallet => wallet.type === 'venus-point');
            let venusPointWalletAmount = venusPointWallet.amount;
            let expectedVenusPointWalletAmount = INITIAL_WALLET_AMOUNT - totalAmount;

            expect(venusPointWalletAmount).equal(
                expectedVenusPointWalletAmount,
                'Wallet with Venus Point money should be decremented on this amount',
            );

            let pendingWalletAmount = venusPointWallet.pending.amount;

            expect(pendingWalletAmount).equal(totalAmount, 'Pending Wallet should be incremented on this amount;');

            let rejectPayoutRequestData = {
                status: PAYOUT_REQUEST_REJECTION_STATUS,
                comments: COMMENTS_FOR_REJECTED_PAYOUT_REQUEST,
            };

            let { body: rejectedPayoutRequestResult } = await request
                .asStuff
                .put(`/v1/payout-requests/${payoutRequestId}`)
                .send(rejectPayoutRequestData);

            expect(rejectedPayoutRequestResult.status).equal(
                PAYOUT_REQUEST_REJECTION_STATUS,
                `Status should be equal ${PAYOUT_REQUEST_REJECTION_STATUS}`,
            );
            expect(rejectedPayoutRequestResult.comments).equal(
                COMMENTS_FOR_REJECTED_PAYOUT_REQUEST,
                `Comment should be equal ${COMMENTS_FOR_REJECTED_PAYOUT_REQUEST}`,
            );

            wallets = await getWallets(personId);

            venusPointWallet = wallets.find(wallet => wallet.type === 'venus-point');
            venusPointWalletAmount = venusPointWallet.amount;

            expect(venusPointWalletAmount)
                .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Venus Point money should be equal to the initial amount');

            pendingWalletAmount = venusPointWallet.pending.amount;

            expect(pendingWalletAmount)
                .equal(0, 'Pending Wallet with Venus Point money should be equal to the initial amount');

            await paymentAccountTestSeed.down(personId, paymentAccountId);
        });
    });
};
