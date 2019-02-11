'use strict';

let payoutRequestTestSeed = require('seeds/payout-request.seed');
let { INITIAL_WALLET_AMOUNT } = require('seeds/person.seed.extended');
let paymentProcessorTestSeed = require('seeds/payment-processor.seed');
let payoutOptionTestSeed = require('seeds/payout-options-and-limits.seed');
let paymentAccountTestSeed = require('seeds/payment-account.seed');
let personTestSeed = require('seeds/person.seed.extended');
let { prettifyRes, getWallets } = require('common');
let walletTestSeed = require('seeds/wallet.seed');
let { cleanUpTable } = require('common/db');

let payoutOptionId;
let paymentProcessorId;
let payoutRequestId;
let personId;
let paymentAccountId;
let walletId;

const PAYMENT_PROCESSOR_FEE_AMOUNT = 0;

module.exports = () => {
    describe('#create', function() {
        afterEach('Clean up', async function() {
            if (payoutRequestId) {
                let payoutRequestReposnse = await payoutRequestTestSeed.authorize(payoutRequestId);

                expect(payoutRequestReposnse.status)
                    .equal(
                        200,
                        prettifyRes(payoutRequestReposnse, 'Payout Request should be authorized with status 200')
                    );
                payoutRequestId = null;
            }

            await Promise.all([
                cleanUpTable('payout_requests'),
                personId && paymentAccountId && paymentAccountTestSeed.down(personId, paymentAccountId),
                walletId && walletTestSeed.down(walletId),
            ]);

            // need to call after clean up payment-account
            await payoutRequestTestSeed.down(paymentProcessorId, personId, payoutOptionId);

            await cleanUpTable('payout_options');

            payoutOptionId = null;
            paymentProcessorId = null;
            payoutRequestId = null;
            personId = null;
            paymentAccountId = null;
            walletId = null;
        });

        it('should create payout-request using new Neteller Payout Data', function() {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [{ name: 'neteller', non_coded: false, card_brands: [] }],
            };

            let payoutOptionData = {
                payment_method: 'neteller',
            };

            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            return paymentProcessorTestSeed.up(paymentProcessorData)
                .then((processorId) => {
                    paymentProcessorId = processorId;
                    payoutOptionData.default_payment_processor_id = processorId;

                    return payoutOptionTestSeed.up(payoutOptionData);
                })
                .then(() => {
                    let data = {
                        target: {
                            neteller_secure_id: 555223,
                            identifier: 'netellertest_EUR@neteller.com',
                            type: 'neteller',
                            card: null,
                        },
                        payment_processor_id: paymentProcessorId,
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                    };

                    return payoutRequestTestSeed.up(data);
                })
                .then((result) => {
                    let { res } = result;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
                    expect(res.body.id).be.a('string');

                    payoutRequestId = result.payoutRequestId;
                    personId = result.personId;
                    payoutOptionId = result.payoutOptionId;

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;
                    let expectedRealWalletAmount = INITIAL_WALLET_AMOUNT - amount;

                    expect(realWalletAmount)
                        .equal(expectedRealWalletAmount, 'Wallet with Real money should be decremented on this amount');

                    let pendingWalletAmount = realwallet.pending.amount;

                    expect(pendingWalletAmount).equal(amount, 'Pending Wallet should be incremented on this amount;');
                });
        });

        it('should create payout-request using existing Neteller Payout Data', function() {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [{ name: 'neteller', non_coded: false, card_brands: [] }],
            };

            let payoutOptionData = {
                payment_method: 'neteller',
            };

            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            return paymentProcessorTestSeed.up(paymentProcessorData)
                .then((processorId) => {
                    paymentProcessorId = processorId;
                    payoutOptionData.default_payment_processor_id = processorId;

                    return Promise.all([
                        personTestSeed.up(),
                        payoutOptionTestSeed.up(payoutOptionData),
                    ]);
                })
                .then(([personData]) => {
                    personId = personData.personId;

                    let data = {
                        person_id: personId,
                        source: {
                            id: personData.wallets.realWalletId,
                        },
                        target: {
                            neteller_secure_id: 555223,
                            card: null,
                            type: 'neteller',
                        },
                        payment_processor_id: paymentProcessorId,
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                    };

                    let sourceData = {
                        identifier: 'netellertest_EUR@neteller.com',
                        source_type: 'neteller',
                    };

                    return paymentAccountTestSeed.up(personId, sourceData)
                        .then(({ body }) => {
                            data.target.id = body.id;
                            paymentAccountId = body.id;

                            return data;
                        });
                })
                .then(payoutRequestTestSeed.up)
                .then((result) => {
                    let { res } = result;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
                    expect(res.body.id).be.a('string');

                    payoutRequestId = result.payoutRequestId;
                    payoutOptionId = result.payoutOptionId;

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;
                    let expectedRealWalletAmount = INITIAL_WALLET_AMOUNT - amount;

                    expect(realWalletAmount)
                        .equal(expectedRealWalletAmount, 'Wallet with Real money should be decremented on this amount');

                    let pendingWalletAmount = realwallet.pending.amount;

                    expect(pendingWalletAmount).equal(amount, 'Pending Wallet should be incremented on this amount;');
                });
        });

        it('should Create Payout Request using new CC payment account', function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            return payoutRequestTestSeed.up({ charge_amount: chargeAmount, payout_fee_amount: payoutFeeAmount })
                .then((result) => {
                    let { res } = result;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout Request should created with status 200'));
                    expect(res.body.id).be.a('string');
                    expect(res.body.charge_amount).equal(chargeAmount);

                    paymentAccountId = res.body.target.id;
                    payoutRequestId = result.payoutRequestId;
                    paymentProcessorId = result.paymentProcessorId;
                    personId = result.personId;
                    payoutOptionId = result.payoutOptionId;

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;
                    let expectedRealWalletAmount = INITIAL_WALLET_AMOUNT - amount;

                    expect(realWalletAmount)
                        .equal(expectedRealWalletAmount, 'Wallet with Real money should be decremented on this amount');

                    let pendingWalletAmount = realwallet.pending.amount;

                    expect(pendingWalletAmount).equal(amount, 'Pending Wallet should be incremented on this amount;');
                });
        });

        it('should Create Payout Request using existing CC payment account', function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            return personTestSeed.up()
                .then((personData) => {
                    personId = personData.personId;

                    let requestData = {
                        person_id: personId,
                        source: {
                            id: personData.wallets.realWalletId,
                        },
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                        target: {
                            card: null,
                        },
                    };

                    return paymentAccountTestSeed.up(personId)
                        .then(({ body: { id } }) => {
                            requestData.target.id = id;
                            paymentAccountId = id;

                            return requestData;
                        });
                })
                .then(payoutRequestTestSeed.up)
                .then((result) => {
                    let { res } = result;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout Request should be created with status 200'));
                    expect(res.body.id).be.a('string');
                    expect(res.body.charge_amount).equal(chargeAmount);

                    payoutRequestId = result.payoutRequestId;
                    paymentProcessorId = result.paymentProcessorId;
                    personId = result.personId;
                    payoutOptionId = result.payoutOptionId;

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;
                    let expectedRealWalletAmount = INITIAL_WALLET_AMOUNT - amount;

                    expect(realWalletAmount)
                        .equal(expectedRealWalletAmount, 'Wallet with Real money should be decremented on this amount');

                    let pendingWalletAmount = realwallet.pending.amount;

                    expect(pendingWalletAmount).equal(amount, 'Pending Wallet should be incremented on this amount;');
                });
        });

        it('shouldn`t Create Payout Request using payment account belonged to another person', function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            return personTestSeed.up()
                .then((personData) => {
                    personId = personData.personId;

                    let requestData = {
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                        target: {
                            card: null,
                        },
                    };

                    return paymentAccountTestSeed.up(personId)
                        .then(({ body: { id } }) => {
                            requestData.target.id = id;
                            paymentAccountId = id;

                            return requestData;
                        });
                })
                .then(payoutRequestTestSeed.up)
                .then(({ res }) => {
                    payoutOptionId = null;
                    paymentProcessorId = null;
                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payout Request should be created with status 400'));
                    expect(res.body.errors[0].field).equal('target.id');
                    expect(res.body.errors[0].message)
                        .equal('Specified payment account doesn\'t belong to the identity');

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;

                    expect(realWalletAmount)
                        .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Real money shouldn`t be decremented');

                    expect(realwallet.pending).equal(null, 'Pending Wallet shouldn`t be incremented');
                });
        });

        it('shouldn`t Create Payout Request using payment account belonged to removed person', function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            return personTestSeed.up()
                .then((personData) => {
                    personId = personData.personId;

                    let requestData = {
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                        target: {
                            card: null,
                        },
                    };

                    return paymentAccountTestSeed.up(personId)
                        .then(({ body: { id } }) => {
                            requestData.target.id = id;
                            paymentAccountId = id;

                            return requestData;
                        })
                        .then(() => personTestSeed.down(personId))
                        .then(() => {
                            personId = null;

                            return Promise.resolve();
                        })
                        .then(() => requestData);
                })
                .then(payoutRequestTestSeed.up)
                .then(({ res }) => {
                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payout Request should be created with status 400'));
                    expect(res.body.errors[0].field).equal('target.id');
                    expect(res.body.errors[0].message)
                        .equal('Payment Account not found');
                });
        });

        it('shouldn`t Create Payout Request using wallet with non-Real type', async function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            let personData = await personTestSeed.up();

            personId = personData.personId;

            let paymentProcessorData = {
                adapter: 'Neteller',
                supported_actions: 'deposit-payout',
                currencies: ['USD'],
                types: [{ name: 'neteller' }],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let payoutRequestData = {
                person_id: personId,
                source: {
                    id: personData.wallets.bonusWalletId,
                },
                target: {
                    neteller_secure_id: 908379,
                    identifier: 'netellertest_EUR@neteller.com',
                    card: null,
                    type: 'neteller',
                },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'neteller', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            paymentAccountId = null;

            let errors = payoutRequestResponse.body.errors.map(({ field }) => field);

            expect(payoutRequestResponse.status)
                .equal(400, prettifyRes(payoutRequestResponse, 'Payout Request should created with status 400'));
            expect(errors.includes('source.id')).equal(true);

            let wallets = await getWallets(personId);
            let realwallet = wallets.find(wallet => wallet.type === 'real');
            let realWalletAmount = realwallet.amount;

            expect(realWalletAmount)
                .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Real money shouldn`t be decremented');

            expect(realwallet.pending).equal(null, 'Pending Wallet shouldn`t be incremented');
        });

        it('shouldn`t Create Payout Request using wallet belonged to another person.', async function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            let personData = await personTestSeed.up();

            personId = personData.personId;

            let paymentProcessorData = {
                adapter: 'Neteller',
                supported_actions: 'deposit-payout',
                currencies: ['USD'],
                types: [{ name: 'neteller' }],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let payoutRequestData = {
                source: {
                    id: personData.wallets.realWalletId,
                },
                target: {
                    neteller_secure_id: 908379,
                    identifier: 'netellertest_EUR@neteller.com',
                    card: null,
                    type: 'neteller',
                },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'neteller', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            let errors = payoutRequestResponse.body.errors.map(({ field }) => field);

            expect(payoutRequestResponse.status)
                .equal(400, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 400'));
            expect(errors.includes('source.id')).equal(true);

            let wallets = await getWallets(personId);
            let realwallet = wallets.find(wallet => wallet.type === 'real');
            let realWalletAmount = realwallet.amount;

            expect(realWalletAmount)
                .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Real money shouldn`t be decremented');

            expect(realwallet.pending).equal(null, 'Pending Wallet shouldn`t be incremented');
        });

        it('shouldn`t Create Payout Request with INSUFFICIENT amount on wallet', function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;
            let realWalletIncrementAmount = 100;

            return personTestSeed.up({}, realWalletIncrementAmount)
                .then((personData) => {
                    personId = personData.personId;

                    let requestData = {
                        person_id: personId,
                        source: {
                            id: personData.wallets.realWalletId,
                        },
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                    };

                    return requestData;
                })
                .then(payoutRequestTestSeed.up)
                .then(({ res }) => {
                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payout Request shouldn`t be created with status 400'));

                    expect(res.body.errors[0].field).equal('charge_amount');
                    expect(res.body.errors[0].message).equal('Not enough balance');
                    expect(res.body.errors[1].field).equal('processing_fee_amount');
                    expect(res.body.errors[1].message)
                        .equal('Amount + Fee is more than available in the Wallet (1 USD)');

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;

                    expect(realWalletAmount).equal(
                        realWalletIncrementAmount,
                        'Wallet with Real money shouldn`t be decremented'
                    );

                    expect(realwallet.pending).equal(null, 'Pending Wallet shouldn`t be incremented');
                });
        });

        it('shouldn`t Create Payout Request with INSUFFICIENT amount on wallet AND has Pending money', function() {
            let chargeAmount = 500000;
            let payoutFeeAmount = 50;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            return payoutRequestTestSeed.up({ charge_amount: chargeAmount, payout_fee_amount: payoutFeeAmount })
                .then((result) => {
                    payoutRequestId = result.payoutRequestId;
                    paymentProcessorId = result.paymentProcessorId;
                    personId = result.personId;
                    payoutOptionId = result.payoutOptionId;

                    let requestData = {
                        person_id: personId,
                        source: {
                            id: result.sourceId,
                        },
                        charge_amount: chargeAmount,
                        payout_fee_amount: payoutFeeAmount,
                    };

                    return requestData;
                })
                .then(payoutRequestTestSeed.up)
                .then(({ res }) => {
                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payout Request should not be created with status 400'));

                    expect(res.body.errors[0].field).equal('charge_amount');
                    expect(res.body.errors[0].message).equal('Not enough balance');
                    expect(res.body.errors[1].field).equal('processing_fee_amount');
                    expect(res.body.errors[1].message)
                        .equal('Amount + Fee is more than available in the Wallet (4999.5 USD)');

                    return getWallets(personId);
                })
                .then((wallets) => {
                    let realwallet = wallets.find(wallet => wallet.type === 'real');
                    let realWalletAmount = realwallet.amount;
                    let expectedRealWalletAmount = INITIAL_WALLET_AMOUNT - amount;

                    expect(realWalletAmount)
                        .equal(expectedRealWalletAmount, 'Wallet with Real money should be decremented once');

                    let pendingWalletAmount = realwallet.pending.amount;

                    expect(pendingWalletAmount).equal(amount, 'Pending Wallet should be incremented once');
                });
        });

        it('shouldn`t Create Payout Request with Payout option limit is reached', async function() {
            let chargeAmount = 1234;
            let payoutFeeAmount = 50;

            payoutOptionId = await payoutOptionTestSeed.up({ velocity: 0 });
            let personData = await personTestSeed.up();

            personId = personData.personId;

            let payoutRequestData = {
                person_id: personId,
                source: {
                    id: personData.wallets.realWalletId,
                },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
            };
            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(400, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 400'));

            let errors = payoutRequestResponse.body.errors.map(({ field }) => field);

            expect(errors.includes('target_type')).equal(true);

            let wallets = await getWallets(personId);

            let realwallet = wallets.find(wallet => wallet.type === 'real');
            let realWalletAmount = realwallet.amount;

            expect(realWalletAmount)
                .equal(INITIAL_WALLET_AMOUNT, 'Wallet with Real money shouldn`t be decremented');

            expect(realwallet.pending).equal(null, 'Pending Wallet shouldn`t be incremented');
        });

        it('should perform payout with new Venus Point account', async function () {
            let chargeAmount = 500;
            let payoutFeeAmount = 50;

            let paymentProcessorData = {
                adapter: 'Venus Point',
                supported_actions: 'deposit-payout',
                currencies: ['USD'],
                types: [{ name: 'venus-point' }],
            };

            let walletData = {
                method: 'withdrawal-deposit',
                name: 'Venus Point',
                type: 'venus-point',
            };

            let person = await personTestSeed.up();

            personId = person.personId;

            let [processorId, { body: wallet }] = await Promise.all([
                paymentProcessorTestSeed.up(paymentProcessorData),
                walletTestSeed.up(personId, walletData),
            ]);

            paymentProcessorId = processorId;
            walletId = wallet.id;

            let incrementionWalletData = {
                personId,
                target: {
                    id: walletId,
                },
                amount: INITIAL_WALLET_AMOUNT,
                type: 'adjustment',
                currency: 'USD',
            };

            let incrementionWalletResult =
                await request.asStuff.post('/v1/transactions').send(incrementionWalletData);

            expect(incrementionWalletResult.status)
                .equal(
                    200,
                    prettifyRes(incrementionWalletResult, 'Venus point Balance should be incremented with status 200')
                );

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            let payoutRequestData = {
                person_id: personId,
                source: { id: walletId },
                target: {
                    type: 'venus-point',
                    identifier: 'QWEE123ASD',
                },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'venus-point', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(200, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 200'));

            payoutRequestId = payoutRequestResponse.body.id;

            let wallets = await getWallets(personId);

            let venusPointWallet = wallets.find(({ type }) => type === 'venus-point');

            let expectedWalletAmount = INITIAL_WALLET_AMOUNT - amount;

            expect(venusPointWallet.amount)
                .equal(
                    expectedWalletAmount,
                    prettifyRes(payoutRequestResponse, 'Wallet with Real money should be decremented')
                );

            expect(venusPointWallet.pending.amount).equal(amount, 'Pending Wallet should be incremented');
        });

        it('should perform payout with existing Venus Point account', async function () {
            let chargeAmount = 500;
            let payoutFeeAmount = 50;

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

            let [{ body: venusPointPaymentAccount }, processorId, { body: wallet }] = await Promise.all([
                paymentAccountTestSeed.up(personId, paymentAccountData),
                paymentProcessorTestSeed.up(paymentProcessorData),
                walletTestSeed.up(personId, walletData),
            ]);

            paymentProcessorId = processorId;
            paymentAccountId = venusPointPaymentAccount.id;
            walletId = wallet.id;

            let incrementionWalletData = {
                personId,
                target: {
                    id: walletId,
                },
                amount: INITIAL_WALLET_AMOUNT,
                type: 'adjustment',
                currency: 'USD',
            };

            let incrementionWalletResult =
                await request.asStuff.post('/v1/transactions').send(incrementionWalletData);

            expect(incrementionWalletResult.status)
                .equal(
                    200,
                    prettifyRes(incrementionWalletResult, 'Venus point Balance should be incremented with status 200')
                );

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            let payoutRequestData = {
                person_id: personId,
                source: { id: walletId },
                target: { id: paymentAccountId },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'venus-point', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(200, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 200'));

            payoutRequestId = payoutRequestResponse.body.id;

            let wallets = await getWallets(personId);

            let venusPointWallet = wallets.find(({ type }) => type === 'venus-point');

            let expectedWalletAmount = INITIAL_WALLET_AMOUNT - amount;

            expect(venusPointWallet.amount)
                .equal(
                    expectedWalletAmount,
                    prettifyRes(payoutRequestResponse, 'Wallet with Real money should be decremented')
                );

            expect(venusPointWallet.pending.amount).equal(amount, 'Pending Wallet should be incremented');
        });

        it('should perform payout with new AliPay account', async function () {
            let chargeAmount = 500;
            let payoutFeeAmount = 50;

            let paymentProcessorData = {
                adapter: 'Collect Xpress',
                currencies: ['USD'],
                types: [{ name: 'alipay' }],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            let payoutRequestData = {
                target: {
                    type: 'alipay',
                    identifier: 'mail@mail.com',
                },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'alipay', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(200, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 200'));

            payoutRequestId = payoutRequestResponse.body.id;
            personId = payoutRequestResponse.body.person.id;

            let wallets = await getWallets(personId);

            let realWallet = wallets.find(({ type }) => type === 'real');

            let expectedWalletAmount = INITIAL_WALLET_AMOUNT - amount;

            expect(realWallet.amount)
                .equal(
                    expectedWalletAmount,
                    prettifyRes(payoutRequestResponse, 'Wallet with Real money should be decremented')
                );

            expect(realWallet.pending.amount).equal(amount, 'Pending Wallet should be incremented');
        });

        it('should create payout-request using existing AliPay account', async function() {
            let chargeAmount = 500;
            let payoutFeeAmount = 50;

            let paymentProcessorData = {
                adapter: 'Collect Xpress',
                supported_actions: 'deposit-payout',
                currencies: ['USD'],
                types: [{ name: 'alipay' }],
            };

            let paymentAccountData = {
                source_type: 'alipay',
                identifier: 'mail@mail.com',
            };

            let person = await personTestSeed.up();

            personId = person.personId;

            let [{ body: alipayPaymentAccount }, processorId] = await Promise.all([
                paymentAccountTestSeed.up(personId, paymentAccountData),
                paymentProcessorTestSeed.up(paymentProcessorData),
            ]);

            paymentProcessorId = processorId;
            paymentAccountId = alipayPaymentAccount.id;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            let payoutRequestData = {
                person_id: personId,
                source: {
                    id: person.wallets.realWalletId,
                },
                target: { id: paymentAccountId },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'alipay', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(200, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 200'));

            payoutRequestId = payoutRequestResponse.body.id;

            let wallets = await getWallets(personId);

            let realWallet = wallets.find(({ type }) => type === 'real');

            let expectedWalletAmount = INITIAL_WALLET_AMOUNT - amount;

            expect(realWallet.amount)
                .equal(
                    expectedWalletAmount,
                    prettifyRes(
                        payoutRequestResponse,
                        'Wallet with Real money should be decremented after Alipay payout'
                    )
                );

            expect(realWallet.pending.amount).equal(amount, 'Pending Wallet should be incremented after Alipay payout');
        });

        it('should perform payout with new WeChat account', async function () {
            let chargeAmount = 500;
            let payoutFeeAmount = 50;

            let paymentProcessorData = {
                adapter: 'Collect Xpress',
                currencies: ['USD'],
                types: [{ name: 'wechat' }],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            let payoutRequestData = {
                target: {
                    type: 'wechat',
                    identifier: 'wechat@mail.com',
                },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'wechat', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(200, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 200'));

            payoutRequestId = payoutRequestResponse.body.id;
            personId = payoutRequestResponse.body.person.id;

            let wallets = await getWallets(personId);

            let realWallet = wallets.find(({ type }) => type === 'real');

            let expectedWalletAmount = INITIAL_WALLET_AMOUNT - amount;

            expect(realWallet.amount)
                .equal(
                    expectedWalletAmount,
                    prettifyRes(payoutRequestResponse, 'Wallet with Real money should be decremented')
                );

            expect(realWallet.pending.amount).equal(amount, 'Pending Wallet should be incremented');
        });

        it('should create payout-request using existing WeChat account', async function() {
            let chargeAmount = 500;
            let payoutFeeAmount = 50;

            let paymentProcessorData = {
                adapter: 'Collect Xpress',
                supported_actions: 'deposit-payout',
                currencies: ['USD'],
                types: [{ name: 'wechat' }],
            };

            let paymentAccountData = {
                source_type: 'wechat',
                identifier: 'mail@mail.com',
            };

            let person = await personTestSeed.up();

            personId = person.personId;

            let [{ body: alipayPaymentAccount }, processorId] = await Promise.all([
                paymentAccountTestSeed.up(personId, paymentAccountData),
                paymentProcessorTestSeed.up(paymentProcessorData),
            ]);

            paymentProcessorId = processorId;
            paymentAccountId = alipayPaymentAccount.id;

            let amount = chargeAmount + payoutFeeAmount + PAYMENT_PROCESSOR_FEE_AMOUNT;

            let payoutRequestData = {
                person_id: personId,
                source: {
                    id: person.wallets.realWalletId,
                },
                target: { id: paymentAccountId },
                charge_amount: chargeAmount,
                payout_fee_amount: payoutFeeAmount,
                payment_processor_id: paymentProcessorId,
            };

            payoutOptionId = await payoutOptionTestSeed.up({
                payment_method: 'wechat', default_payment_processor_id: paymentProcessorId,
            });

            let { res: payoutRequestResponse } = await payoutRequestTestSeed.up(payoutRequestData);

            expect(payoutRequestResponse.status)
                .equal(200, prettifyRes(payoutRequestResponse, 'Payout Request should be created with status 200'));

            payoutRequestId = payoutRequestResponse.body.id;

            let wallets = await getWallets(personId);

            let realWallet = wallets.find(({ type }) => type === 'real');

            let expectedWalletAmount = INITIAL_WALLET_AMOUNT - amount;

            expect(realWallet.amount)
                .equal(
                    expectedWalletAmount,
                    prettifyRes(
                        payoutRequestResponse,
                        'Wallet with Real money should be decremented after WeChat payout'
                    )
                );

            expect(realWallet.pending.amount).equal(amount, 'Pending Wallet should be incremented after WeChat payout');
        });
    });
};
