'use strict';

let _ = require('lodash');
let feeOptionSeed = require('seeds/fee-options.seed');
let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed');
let paymentProcessorSeed = require('seeds/payment-processor.seed');
let { cleanUpCollection } = require('common/db');
let { mappedCurrencies } = require('src/constants/currency-codes');
let {
    profileLevels,
    transactionTypesMap,
    paymentMethods,
    paymentProcessor: { creditCardBrands },
} = require('src/constants/app-constants');
let {
    feeTypesMap, transactionTypeToPaymentMethodsMap, calculationTypesMap, feeActionsMap,
} = require('src/constants/limits-and-fee');

module.exports = () => {
    describe('#create', function () {
        afterEach('Clean Up', async function () {
            await cleanUpCollection('feeOptions');
        });

        it('should create global fee option', async function () {
            let globalFeeOptionData = {
                action: 'payout',
                name: 'Global fee option for payout',
                merchant_id: 'ALL',
                payment_processor_id: 'ALL',
                payment_adapter: 'ALL',
                is_except_of_country: false,
            };
            let { body } = await feeOptionSeed.up(globalFeeOptionData);

            expect(body.action).equal(globalFeeOptionData.action);
            expect(body.name).equal(globalFeeOptionData.name);
            expect(body.merchant_id).equal(globalFeeOptionData.merchant_id);
            expect(body.payment_processor_id).equal(globalFeeOptionData.payment_processor_id);
            expect(body.payment_adapter).equal(globalFeeOptionData.payment_adapter);
        });

        it('should create merchant specific fee option', async function () {
            let merchantFeeOptionData = {
                action: 'payout',
                name: 'Merchant Specific fee option for payout',
                merchant_id: 'Hk0egjObl',
                payment_processor_id: 'ALL',
                payment_adapter: 'ALL',
                is_except_of_country: false,
            };

            let { body } = await feeOptionSeed.up(merchantFeeOptionData);

            expect(body.action).equal(merchantFeeOptionData.action);
            expect(body.name).equal(merchantFeeOptionData.name);
            expect(body.merchant_id).equal(merchantFeeOptionData.merchant_id);
            expect(body.payment_processor_id).equal(merchantFeeOptionData.payment_processor_id);
            expect(body.payment_adapter).equal(merchantFeeOptionData.payment_adapter);
        });

        it('should create customer specific fee option', async function () {
            let { body: { id } } = await personTestSeed.up();
            let customerFeeOptionData = {
                action: 'deposit',
                name: 'Cusomer specific fee option for deposit',
                person_id: id,
            };

            let feeOptionResponse = await feeOptionSeed.up(customerFeeOptionData);

            expect(feeOptionResponse.body.action).equal(customerFeeOptionData.action, prettifyRes(feeOptionResponse));
            expect(feeOptionResponse.body.person_id)
                .equal(customerFeeOptionData.person_id, prettifyRes(feeOptionResponse));
        });

        it('should create affiliate fee option', async function () {
            let affiliatePersonData = {
                is_affiliate: true,
            };

            let affiliateResponse = await personTestSeed.up(affiliatePersonData);

            expect(affiliateResponse.status).equal(
                200,
                prettifyRes(affiliateResponse, 'Affiliate should be created with status 200')
            );

            let affiliateFeeData = {
                affiliate_id: affiliateResponse.body.id,
            };

            let feeOptionResponse = await feeOptionSeed.up(affiliateFeeData);

            expect(feeOptionResponse.status).equal(
                200,
                prettifyRes(feeOptionResponse, 'Affiliate fee be created with status 200')
            );
            expect(feeOptionResponse.body.affiliate_id)
                .equal(affiliateFeeData.affiliate_id, prettifyRes(feeOptionResponse));
        });

        it(
            'should create fee option for payment processor with different applicability criteria',
            async function () {
                let processorId = await paymentProcessorSeed.up({});
                let { body: { adapter } } = await request.asStuff.get(`/v1/payment-processors/${processorId}`);

                let feeOptionData = {
                    payment_adapter: adapter,
                    payment_processor_id: processorId,
                    profile_levels: profileLevels,
                    credit_card_brand: [creditCardBrands.amex, creditCardBrands.visa],
                    geo_target: ['AG', 'US', 'AF'],
                };

                let feeOptionCreationResponse = await feeOptionSeed.up(feeOptionData);

                let {
                    payment_processor_id, profile_levels, geo_target, credit_card_brand,
                } = feeOptionCreationResponse.body;

                expect(feeOptionCreationResponse.status).equal(
                    200,
                    prettifyRes(feeOptionCreationResponse, 'Fee option be created with status 200')
                );

                expect(payment_processor_id).equal(feeOptionData.payment_processor_id);

                expect(feeOptionCreationResponse.body.type).equal(
                    feeTypesMap.general,
                    prettifyRes(feeOptionCreationResponse, 'Should create General fee option, not Proceesor')
                );

                expect(_.difference(profile_levels, feeOptionData.profile_levels).length)
                    .equal(
                        0,
                        prettifyRes(feeOptionCreationResponse, 'Should be no difference between profile-levels arrays')
                    );

                expect(_.difference(geo_target, feeOptionData.geo_target).length)
                    .equal(
                        0,
                        prettifyRes(feeOptionCreationResponse, 'Should be no difference between geo target arrays')
                    );

                expect(_.difference(credit_card_brand, feeOptionData.credit_card_brand).length)
                    .equal(
                        0,
                        prettifyRes(feeOptionCreationResponse, 'Should be no difference between credit card brands')
                    );

                // cleanUp processor. It will also clean up fee options with pp applicability criteria
                await paymentProcessorSeed.down(processorId);
            }
        );

        it('should create fee options for deposit, payout, and transfer transactions', async function () {
            let transactionTypesForTest = Object.values(feeActionsMap);

            let feeOptionsResponses = await Promise
                .all(transactionTypesForTest.map(transactionType => feeOptionSeed.up({ action: transactionType })));

            feeOptionsResponses.forEach((response) => {
                expect(response.status).equal(
                    200,
                    prettifyRes(response, 'Fee option be created with status 200')
                );

                expect(transactionTypesForTest.includes(response.body.action)).equal(true);
            });
        });

        it('should create deposit fee options for allowed payment methods', async function () {
            let paymentMethodsForTest = Object.values(transactionTypeToPaymentMethodsMap.deposit);

            let feeOptionsResponses = await Promise.all(paymentMethodsForTest.map(method =>
                feeOptionSeed.up({ action: transactionTypesMap.deposit, payment_method: method })));

            feeOptionsResponses.forEach((response) => {
                expect(response.status).equal(
                    200,
                    prettifyRes(response, 'Fee option be created with status 200')
                );

                expect(response.body.action).equal(transactionTypesMap.deposit);
                expect(paymentMethodsForTest.includes(response.body.payment_method)).equal(true);
            });
        });

        it('should create payout fee options for allowed payment methods', async function () {
            let paymentMethodsForTest = Object.values(transactionTypeToPaymentMethodsMap.payout);

            let feeOptionsResponses = await Promise.all(paymentMethodsForTest.map(method =>
                feeOptionSeed.up({ action: transactionTypesMap.payout, payment_method: method })));

            feeOptionsResponses.forEach((response) => {
                expect(response.status).equal(
                    200,
                    prettifyRes(response, 'Fee option be created with status 200')
                );

                expect(response.body.action).equal(transactionTypesMap.payout);
                expect(paymentMethodsForTest.includes(response.body.payment_method)).equal(true);
            });
        });

        it('should create transfer fee options for allowed payment methods', async function () {
            let paymentMethodsForTest = Object.values(transactionTypeToPaymentMethodsMap.transfer);

            let feeOptionsResponses = await Promise.all(paymentMethodsForTest.map(method =>
                feeOptionSeed.up({ action: transactionTypesMap.transfer, payment_method: method })));

            feeOptionsResponses.forEach((response) => {
                expect(response.status).equal(
                    200,
                    prettifyRes(response, 'Fee option be created with status 200')
                );

                expect(response.body.action).equal(transactionTypesMap.transfer);
                expect(paymentMethodsForTest.includes(response.body.payment_method)).equal(true);
            });
        });

        it('should NOT create transfer fee options for not allowed payment methods', async function () {
            let paymentMethodsForTest =
            _.difference(paymentMethods, Object.values(transactionTypeToPaymentMethodsMap.transfer));

            let feeOptionsResponses = await Promise.all(paymentMethodsForTest.map((method) => {
                let data = feeOptionSeed.getDefaultFeeOptionData({
                    action: transactionTypesMap.transfer,
                    payment_method: method,
                });

                return feeOptionSeed.negativeUp(data);
            }));

            feeOptionsResponses.forEach((response) => {
                expect(response.status).equal(
                    400,
                    prettifyRes(response, 'Fee option should NOT be created with status 400')
                );

                let errors = response.body.errors.map(error => error.field);

                expect(errors.includes('payment_method')).equal(true);
            });
        });

        it('should NOT create payout fee options for not allowed payment methods', async function () {
            let paymentMethodsForTest =
            _.difference(paymentMethods, Object.values(transactionTypeToPaymentMethodsMap.payout));

            let feeOptionsResponses = await Promise.all(paymentMethodsForTest.map((method) => {
                let data = feeOptionSeed.getDefaultFeeOptionData({
                    action: transactionTypesMap.payout,
                    payment_method: method,
                });

                return feeOptionSeed.negativeUp(data);
            }));

            feeOptionsResponses.forEach((response) => {
                expect(response.status).equal(
                    400,
                    prettifyRes(response, 'Fee option should NOT be created with status 400')
                );

                let errors = response.body.errors.map(error => error.field);

                expect(errors.includes('payment_method')).equal(true);
            });
        });

        it('Should set, update and delete fee sets for fee option', async function () {
        // create fee set
            let { body: feeOption } = await feeOptionSeed.up();
            let defalutFeePrice = {
                flat_price: 5,
                percentage_price: 0,
                percentage_min_fee_amount: 0,
                percentage_max_fee_amount: 0,
            };
            let defaultFee = {
                amount_from: 0,
                amount_to: 20000,
                margin: {
                    ...defalutFeePrice,
                },
                reseller: {
                    ...defalutFeePrice,
                    flat_price: 10,
                },
                total: 0,
            };

            let USDfeeSetData = {
                calculation_type: calculationTypesMap.flat,
                currency: mappedCurrencies.USD,
                fees: [
                    defaultFee,
                    {
                        ...defaultFee,
                        amount_from: 20001,
                        amount_to: 30000,
                        margin: {
                            ...defalutFeePrice,
                            percentage_min_fee_amount: 2,
                            percentage_max_fee_amount: 5,
                        },
                        reseller: {
                            ...defalutFeePrice,
                            flat_price: 10,
                            percentage_min_fee_amount: 2,
                            percentage_max_fee_amount: 5,
                        },
                        total: 0,
                    },
                ],
            };

            let createUSDFeeSetResponse = await request
                .asStuff
                .post(`/v1/fee-options/${feeOption.id}/fee-sets/`)
                .send(USDfeeSetData);

            let createdFeeSetCurrencies = createUSDFeeSetResponse.body.fee_sets.map(({ currency }) => currency);

            expect(createdFeeSetCurrencies.includes(USDfeeSetData.currency))
                .equal(true, prettifyRes(createUSDFeeSetResponse, 'Should create fee set only for requested currency'));

            let createdFeeSet = createUSDFeeSetResponse.body.fee_sets
                .find(({ currency }) => currency === USDfeeSetData.currency);
            let feeRages = createdFeeSet.fees;

            expect(feeRages.length)
                .equal(
                    USDfeeSetData.fees.length,
                    prettifyRes(createUSDFeeSetResponse, 'Should create only requested number of fee ranges')
                );

            // update fee set ( by fee ranges)
            let updateFeeSetData = {
                fees: [defaultFee],
            };

            let updateFeeSetResponse = await request
                .asStuff
                .put(`/v1/fee-options/${feeOption.id}/fee-sets/${USDfeeSetData.currency}`)
                .send(updateFeeSetData);

            let updatedFeeSet = updateFeeSetResponse.body.fee_sets
                .find(({ currency }) => currency === USDfeeSetData.currency);
            let feeRanges = updatedFeeSet.fees;

            expect(feeRanges.length)
                .equal(updateFeeSetData.fees.length, prettifyRes(updateFeeSetResponse, 'Should update fee ranges'));

            // create second fee set
            let EURfeeSetData = {
                ...USDfeeSetData,
                currency: mappedCurrencies.EUR,
            };

            let createEURFeeSetResponse = await request
                .asStuff
                .post(`/v1/fee-options/${feeOption.id}/fee-sets/`)
                .send(EURfeeSetData);

            expect(createEURFeeSetResponse.body.fee_sets.length)
                .equal(
                    2,
                    prettifyRes(createEURFeeSetResponse, 'Should create 2nd fee set for fee option (2 in total))')
                );

            // delete fee set
            let deleteFeeSetResponse = await request
                .asStuff
                .delete(`/v1/fee-options/${feeOption.id}/fee-sets/${USDfeeSetData.currency}`);

            expect(deleteFeeSetResponse.body.fee_sets.length)
                .equal(1, prettifyRes(deleteFeeSetResponse, 'Should leave only 1 fee set'));

            expect(deleteFeeSetResponse.body.fee_sets.find(({ currency }) => currency === USDfeeSetData.currency))
                .equal(undefined, prettifyRes(deleteFeeSetResponse, 'Should remove fee set for specified currency'));
        });
    });
};
