'use strict';

let feeOptionSeed = require('seeds/fee-options.seed.js');
let depositTestSeed = require('seeds/deposit.seed');
let personTestSeed = require('seeds/person.seed.extended');
let paymentProcessorSeed = require('seeds/payment-processor.seed');
let { prettifyRes } = require('common');

let feeOptionId;
let personId;
let merchantId;
let personWallets;
let transactionId;
let paymentProcessorId;

const INITIAL_WALLET_AMOUNT = 10000;

let defalutFeePrice = {
    flat_price: 0,
    percentage_price: 0,
    percentage_min_fee_amount: 0,
    percentage_max_fee_amount: 1000,
};

let defaultFeeSubSet = {
    amount_from: 0,
    amount_to: 30000,
    total: 0,
};

module.exports = () => {
    describe('#apply', function () {
        beforeEach('Create dependencies', function () {
            return personTestSeed.up({}, INITIAL_WALLET_AMOUNT)
                .then((person) => {
                    personId = person.personId;
                    merchantId = person.account.brand.merchant.id;
                    personWallets = person.wallets;
                });
        });

        afterEach('Clean Up', function () {
            return Promise.all([
                paymentProcessorId && paymentProcessorSeed.down(paymentProcessorId),
                feeOptionId && feeOptionSeed.down(feeOptionId),
            ]);
        });

        it('should apply global fee option to deposit', async function () {
            let globalFeeOptionData = {
                action: 'deposit',
                name: 'Global fee option for deposit',
                merchant_id: 'ALL',
                payment_processor_id: 'ALL',
                payment_adapter: 'ALL',
            };

            let { body: feeOptionBody } = await feeOptionSeed.up(globalFeeOptionData);

            feeOptionId = feeOptionBody.id;

            let feeSubSet = {
                ...defaultFeeSubSet,
                margin: {
                    ...defalutFeePrice,
                    flat_price: 3,
                },
                reseller: {
                    ...defalutFeePrice,
                    flat_price: 5,
                },
            };

            let feeSetData = {
                action: 'deposit',
                calculation_type: 'flat',
                currency: 'USD',
                fees: [feeSubSet],
                merchant_id: 'ALL',
                payment_merhod: 'credit-card',
            };

            let feeSetResonse = await request
                .asStuff
                .post(`/v1/fee-options/${feeOptionId}/fee-sets/`)
                .send(feeSetData);

            expect(feeSetResonse.status)
                .equal(200, prettifyRes(feeSetResonse, 'Fee sets shoud be created with status 200'));
            expect(Boolean(feeSetResonse.body.fee_sets
                .find(feeSet => feeSet.fees[0].reseller.flat_price === feeSubSet.reseller.flat_price)))
                .equal(true);
            expect(Boolean(feeSetResonse.body.fee_sets
                .find(feeSet => feeSet.fees[0].margin.flat_price === feeSubSet.margin.flat_price)))
                .equal(true);

            let { realWalletId } = personWallets;
            let data = {
                type: 'deposit',
                person_id: personId,
                amount: 1500,
                target: { id: realWalletId },
            };

            let { res } = await depositTestSeed.up(data);

            expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));
            transactionId = res.body.id;

            let { body: txnBody } = await request
                .asStuff
                .get(`/v1/transactions/${transactionId}`);
            let marginInCents = feeSubSet.margin.flat_price * 100;
            let resellerPriceInCents = feeSubSet.reseller.flat_price * 100;

            expect(txnBody.status.margin_amount).equal(marginInCents);
            expect(txnBody.status.reseller_price_amount).equal(resellerPriceInCents);
        });

        it('should apply merhcant specific fee option to deposit', async function () {
            let merchantFeeOptionData = {
                action: 'deposit',
                name: 'Merchant Specific fee option for payout',
                merchant_id: merchantId,
                payment_processor_id: 'ALL',
                payment_adapter: 'ALL',
            };

            let { body } = await feeOptionSeed.up(merchantFeeOptionData);

            feeOptionId = body.id;

            let feeSubSet = {
                ...defaultFeeSubSet,
                margin: {
                    ...defalutFeePrice,
                    flat_price: 2,
                },
                reseller: {
                    ...defalutFeePrice,
                    flat_price: 4,
                },
            };

            let feeSetData = {
                action: 'deposit',
                calculation_type: 'flat',
                currency: 'USD',
                fees: [feeSubSet],
                merchant_id: merchantId,
                payment_merhod: 'credit-card',
            };
            let feeSetResponse = await request
                .asStuff
                .post(`/v1/fee-options/${feeOptionId}/fee-sets/`)
                .send(feeSetData);

            expect(feeSetResponse.status)
                .equal(200, prettifyRes(feeSetResponse, 'Fee sets shoud be created with status 200'));
            expect(Boolean(feeSetResponse.body.fee_sets
                .find(feeSet => feeSet.fees[0].reseller.flat_price === feeSubSet.reseller.flat_price)))
                .equal(true);
            expect(Boolean(feeSetResponse.body.fee_sets
                .find(feeSet => feeSet.fees[0].margin.flat_price === feeSubSet.margin.flat_price)))
                .equal(true);
            let { realWalletId } = personWallets;

            let data = {
                type: 'deposit',
                person_id: personId,
                amount: 1500,
                target: { id: realWalletId },
            };

            let { res } = await depositTestSeed.up(data);

            expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));
            transactionId = res.body.id;
            let { body: { status: { margin_amount, reseller_price_amount } } } = await request
                .asStuff
                .get(`/v1/transactions/${transactionId}`);

            let marginInCents = feeSubSet.margin.flat_price * 100;
            let resellerPriceInCents = feeSubSet.reseller.flat_price * 100;

            expect(margin_amount).equal(marginInCents);
            expect(reseller_price_amount).equal(resellerPriceInCents);
        });

        it('should apply customer specific fee option', async function () {
            let customerFeeOptionData = {
                action: 'deposit',
                name: 'Customer specific fee option for deposit',
                person_id: personId,
                credit_card_brand: ['ALL'],
            };

            let { body } = await feeOptionSeed.up(customerFeeOptionData);

            feeOptionId = body.id;

            let feeSubSet = {
                ...defaultFeeSubSet,
                margin: {
                    ...defalutFeePrice,
                    flat_price: 3,
                },
                reseller: {
                    ...defalutFeePrice,
                    flat_price: 4,
                },
            };

            let feeSetData = {
                action: 'deposit',
                calculation_type: 'flat',
                currency: 'USD',
                fees: [feeSubSet],
                merchant_id: merchantId,
                payment_merhod: 'credit-card',
            };

            let feeSetResponse = await request
                .asStuff
                .post(`/v1/fee-options/${feeOptionId}/fee-sets/`)
                .send(feeSetData);

            expect(feeSetResponse.status)
                .equal(200, prettifyRes(feeSetResponse, 'Fee sets shoud be created with status 200'));
            expect(Boolean(feeSetResponse.body.fee_sets
                .find(feeSet => feeSet.fees[0].reseller.flat_price === feeSubSet.reseller.flat_price)))
                .equal(true);
            expect(Boolean(feeSetResponse.body.fee_sets
                .find(feeSet => feeSet.fees[0].margin.flat_price === feeSubSet.margin.flat_price)))
                .equal(true);

            let { realWalletId } = personWallets;
            let data = {
                type: 'deposit',
                merchant_id: merchantId,
                person_id: personId,
                amount: 2000,
                target: { id: realWalletId },
            };

            let { res } = await depositTestSeed.up(data);

            expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));
            transactionId = res.body.id;
            let { body: { status: { margin_amount, reseller_price_amount } } } = await request
                .asStuff
                .get(`/v1/transactions/${transactionId}`);
            let marginInCents = feeSubSet.margin.flat_price * 100;
            let resellerPriceInCents = feeSubSet.reseller.flat_price * 100;

            expect(margin_amount).equal(marginInCents);
            expect(reseller_price_amount).equal(resellerPriceInCents);
        });

        it('should apply payment processor fee to transaction', async function () {
            let paymnetProcessorData = {
                merchant_id: merchantId,
            };
            let processorId = await paymentProcessorSeed.up(paymnetProcessorData);

            paymentProcessorId = processorId;
            let feeSubSet = {
                amount_from: 0,
                amount_to: 6500,
                transaction: {
                    ...defalutFeePrice,
                    flat_price: 43,
                },
            };

            let feeSetData = {
                calculation_type: 'flat',
                currency: 'UNSPECIFIED',
                fees: [feeSubSet],
                merchant_id: merchantId,
                payment_method: 'credit-card',
            };
            let feeSetResponse = await request
                .asStuff
                .put(`/v1/payment-processors/${processorId}/fee`)
                .send(feeSetData);

            expect(Boolean(feeSetResponse.body.fees
                .find(feeSet => feeSet.transaction.flat_price === feeSubSet.transaction.flat_price)))
                .equal(true);
            expect(Boolean(feeSetResponse.body.fees
                .find(feeSet => feeSet.amount_from === feeSubSet.amount_from)))
                .equal(true);
            expect(Boolean(feeSetResponse.body.fees
                .find(feeSet => feeSet.amount_to === feeSubSet.amount_to)))
                .equal(true);

            let { realWalletId } = personWallets;
            let data = {
                type: 'deposit',
                merchant_id: merchantId,
                person_id: personId,
                amount: 2000,
                target: { id: realWalletId },
                paymentProcessorId: processorId,
            };

            let { res } = await depositTestSeed.up(data);

            expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));

            transactionId = res.body.id;
            let { body: { status: { transaction_price_amount } } } = await request
                .asStuff
                .get(`/v1/transactions/${transactionId}`);
            let transactionPriceInCents = feeSubSet.transaction.flat_price * 100;

            expect(transaction_price_amount)
                .equal(transactionPriceInCents, 'Transaction prices should be equal');

            feeOptionId = null;
        });
    });
};
