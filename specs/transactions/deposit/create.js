'use strict';

let paymentProcessorTestSeed = require('seeds/payment-processor.seed');
let walletTestSeed = require('seeds/wallet.seed');
let paymentAccountTestSeed = require('seeds/payment-account.seed');
let personTestSeed = require('seeds/person.seed.extended');
let depositTestSeed = require('seeds/deposit.seed');
let { prettifyRes } = require('common');

let personId;
let personWallets;
let paymentProcessorId;
let paymentAccountId;

const INITIAL_WALLET_AMOUNT = 10000;

module.exports = () => {
    describe('#create', function () {
        beforeEach('Create dependencies', function () {
            return personTestSeed.up({}, INITIAL_WALLET_AMOUNT)
                .then((person) => {
                    personId = person.personId;
                    personWallets = person.wallets;
                });
        });

        afterEach('Clean up', function () {
            return Promise.all([
                personTestSeed.down(personId),
                paymentProcessorId && paymentProcessorTestSeed.down(paymentProcessorId),
                paymentAccountId && paymentAccountTestSeed.down(personId, paymentAccountId),
            ]);
        });

        it('should create deposit without walletId', function() {
            return depositTestSeed.up({}, ['target_id'])
                .then(({ res }) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));
                });
        });

        it('should create deposit using CC and update wallet amount', function() {
            let amount = 123;
            let { realWalletId } = personWallets;

            return depositTestSeed.up({ person_id: personId, amount, target: { id: realWalletId } })
                .then(({ res }) => {
                    let isTransactionApproved = res.body.status.approved;

                    expect(isTransactionApproved).equal(true, prettifyRes(res, 'Transaction should be approved'));
                    expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));

                    return request
                        .asStuff
                        .get(`/v1/persons/${personId}/wallets/`)
                        .then((walletsResponse) => {
                            let wallets = walletsResponse.body;
                            let walletAmount = wallets.find(wallet => wallet.id === res.body.target.id).amount;
                            let expectedAmount = INITIAL_WALLET_AMOUNT + amount;

                            expect(walletAmount)
                                .equal(expectedAmount, prettifyRes(res, 'Wallet amount should be updated'));
                        });
                });
        });

        it('should create deposit using CC and update wallet amount with updated API', function () {
            let { realWalletId } = personWallets;
            let data = {
                type: 'deposit',
                source: {
                    type: 'credit-card',
                    card: {
                        number: '4242424242424242',
                        name: 'CARDHOLDER NAME',
                        expiry: '2022-12',
                        cvv: '287',
                    },
                },
                person_id: personId,
                amount: 23456,
                target: { id: realWalletId },
            };

            return depositTestSeed.up(data)
                .then(({ res }) => {
                    let isTransactionApproved = res.body.status.approved;

                    expect(isTransactionApproved).equal(true, prettifyRes(res, 'Transaction should be approved'));
                    expect(res.status).equal(200, prettifyRes(res, 'Transaction should be created with status 200'));

                    return request
                        .asStuff
                        .get(`/v1/persons/${personId}/wallets/`)
                        .then((walletsResponse) => {
                            let wallets = walletsResponse.body;
                            let walletAmount = wallets.find(({ id }) => id === realWalletId).amount;
                            let expectedAmount = INITIAL_WALLET_AMOUNT + data.amount;

                            expect(walletAmount)
                                .equal(expectedAmount, prettifyRes(res, 'Wallet amount should be updated'));
                        });
                });
        });

        it('should create deposit using Neteller and update wallet amount', function () {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [{ name: 'neteller', non_coded: false, card_brands: [] }],
            };

            return paymentProcessorTestSeed.up(paymentProcessorData)
                .then((processorId) => {
                    paymentProcessorId = processorId;
                    let { realWalletId } = personWallets;
                    let data = {
                        person_id: personId,
                        amount: 1234,
                        source: {
                            neteller_secure_id: 908379,
                            identifier: 'netellertest_EUR@neteller.com',
                            card: null,
                            type: 'neteller',
                        },
                        target: { id: realWalletId },
                        payment_processor_id: paymentProcessorId,
                    };

                    return depositTestSeed.up(data).then(({ res }) => {
                        expect(res.status)
                            .equal(200, prettifyRes(res, 'Transaction should be created with status 200'));

                        return request
                            .asStuff
                            .post(`/v1/transactions/webhooks/${res.body.id}/neteller`)
                            .then((authRes) => {
                                expect(authRes.status).equal(302, prettifyRes(
                                    authRes,
                                    'Transaction should be authorized with status 302'
                                ));

                                return request
                                    .asStuff
                                    .get(`/v1/persons/${res.body.identity.person.id}/wallets/`)
                                    .then((walletsResponse) => {
                                        let wallets = walletsResponse.body;
                                        let walletId = res.body.target.id;
                                        let walletAmount = wallets.find(wallet => wallet.id === walletId).amount;
                                        let expectedAmount = INITIAL_WALLET_AMOUNT + data.amount;

                                        expect(walletAmount)
                                            .equal(expectedAmount, prettifyRes(res, 'Wallet amount should be updated'));
                                    });
                            });
                    });
                });
        });

        it('should create deposit using existing Neteller and update wallet amount', async function () {
            let paymentProcessorData = {
                adapter: 'Neteller',
                types: [{ name: 'neteller', non_coded: false, card_brands: [] }],
            };

            let paymentAccountData = {
                source_type: 'neteller',
                neteller_secure_id: 908239,
                identifier: 'netellertest_USD@neteller.com',
            };

            let { body: paymentAccount } = await paymentAccountTestSeed.up(personId, paymentAccountData);

            paymentAccountId = paymentAccount.id;

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let { realWalletId } = personWallets;
            let data = {
                person_id: personId,
                amount: 1,
                payment_processor_id: paymentProcessorId,
                source: {
                    id: paymentAccountId,
                    type: 'neteller',
                    neteller_secure_id: 908379,
                    card: null,
                },
                target: {
                    id: personWallets.realWalletId,
                },
            };

            let { res: depositResponse } = await depositTestSeed.up(data);

            expect(depositResponse.status)
                .equal(200, prettifyRes(depositResponse, 'Transaction should be created with status 200'));

            let netellerAuthResult = await request
                .asStuff
                .post(`/v1/transactions/webhooks/${depositResponse.body.id}/neteller`);

            expect(netellerAuthResult.status)
                .equal(
                    302,
                    prettifyRes(netellerAuthResult, 'Transaction should be authorized with status 302')
                );

            let { body: wallets } = await request
                .asStuff
                .get(`/v1/persons/${personId}/wallets/`);

            let walletAmount = wallets.find(wallet => wallet.id === realWalletId).amount;
            let expectedAmount = INITIAL_WALLET_AMOUNT + data.amount;

            expect(walletAmount)
                .equal(expectedAmount, prettifyRes(depositResponse, 'Wallet amount should be updated'));
        });

        it('should create deposit using existing CC and update wallet amount', async function () {
            let { body: paymentAccount } = await paymentAccountTestSeed.up(personId);

            paymentAccountId = paymentAccount.id;

            let { body: initialWallets } = await request.asStuff.get(`/v1/persons/${personId}/wallets/`);
            let { realWalletId } = personWallets;
            let currentWalletAmount = initialWallets.find(wallet => wallet.id === realWalletId).amount;

            let paymentProcessorData = {
                adapter: 'Citigate',
                supported_actions: 'deposit',
                currencies: ['USD'],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let amount = 1 + Math.round(Math.random() * 100);
            let expectedWalletAmount = currentWalletAmount + amount;
            let depositData = {
                person_id: personId,
                amount,
                payment_processor_id: paymentProcessorId,
                source: {
                    id: paymentAccountId,
                    card: {
                        cvv: '123',
                    },
                },
                target: {
                    id: personWallets.realWalletId,
                },
            };

            let { res: depositResponse } = await depositTestSeed.up(depositData);

            let isTransactionApproved = depositResponse.body.status.approved;

            expect(isTransactionApproved)
                .equal(true, prettifyRes(depositResponse, 'Transaction should be approved'));
            expect(depositResponse.status)
                .equal(200, prettifyRes(depositResponse, 'Transaction should be created with status 200'));

            let { body: wallets } = await request.asStuff.get(`/v1/persons/${personId}/wallets/`);

            let walletAmount = wallets
                .find(wallet => wallet.id === realWalletId).amount;

            expect(walletAmount).equal(
                expectedWalletAmount,
                prettifyRes(depositResponse, 'Wallet amount should be updated')
            );
        });

        it('should authorize deposit using Pago Technology', async function () {
            let paymentProcessorData = {
                adapter: 'Pago Technology',
                supported_actions: 'deposit',
                currencies: ['USD'],
            };

            paymentProcessorId = await paymentProcessorTestSeed.up(paymentProcessorData);

            let data = {
                amount: 1234,
                payment_processor_id: paymentProcessorId,
            };

            let { res: depositResponse } = await depositTestSeed.up(data);

            paymentAccountId = depositResponse.body.source.id; // for up payment account

            expect(depositResponse.status).equal(
                200,
                prettifyRes(depositResponse, 'Transaction should be created with status 200')
            );
            expect(depositResponse.body.status.code).equal(
                0,
                prettifyRes(depositResponse, 'Transaction should be created with code 0 (AUTHORIZED)')
            );
        });

        it('Should Create 2nd deposit with payment account which account is email ', function () {
            let paymentProcessorData = {
                adapter: 'Collect Xpress',
                supported_actions: 'deposit',
                currencies: ['USD'],
                types: [{ name: 'alipay' }],
            };

            return paymentProcessorTestSeed.up(paymentProcessorData)
                .then((processorId) => {
                    paymentProcessorId = processorId;
                    let depositData = {
                        amount: 200,
                        payment_processor_id: paymentProcessorId,
                        source: {
                            identifier: 'check@mail.com',
                            type: 'alipay',
                        },
                    };

                    return depositTestSeed.up(depositData).then(({ res }) => {
                        expect(res.status).equal(
                            200,
                            prettifyRes(res.body, 'Transaction should be created with status 200')
                        );
                        expect(res.body.target.id).equal(depositData.target.id);
                        expect(res.body.target_amount).equal(depositData.amount);

                        return res;
                    })
                        .then((response) => {
                            let secondDepositData = {
                                amount: 300,
                                payment_processor_id: paymentProcessorId,
                                source: {
                                    id: response.body.source.id,
                                    type: 'alipay',
                                },
                                person_id: response.body.identity.person.id,
                                target: {
                                    id: response.body.target.id,
                                },
                            };

                            paymentAccountId = response.body.source.id; // for clean up

                            return depositTestSeed.up(secondDepositData)
                                .then(({ res }) => {
                                    expect(res.status).equal(
                                        200,
                                        prettifyRes(res.body, 'Transaction should be created with status 200')
                                    );
                                    expect(res.body.source.id).equal(secondDepositData.source.id);
                                    expect(res.body.target.id).equal(secondDepositData.target.id);
                                    expect(res.body.target_amount).equal(secondDepositData.amount);
                                });
                        });
                });
        });

        it('Should perform deposit with new Venus Point', async function () {
            let paymentProcessorData = {
                adapter: 'Venus Point',
                supported_actions: 'deposit',
                currencies: ['USD'],
                types: [{ name: 'venus-point' }],
            };

            let walletData = {
                method: 'withdrawal-deposit',
                name: 'Venus Point',
                type: 'venus-point',
            };

            let [{ body: wallet }, processorId] = await Promise.all([
                walletTestSeed.up(personId, walletData),
                paymentProcessorTestSeed.up(paymentProcessorData),
            ]);

            let currentWalletAmount = wallet.amount;

            paymentProcessorId = processorId;

            let depositData = {
                amount: 600,
                payment_processor_id: paymentProcessorId,
                source: {
                    type: 'venus-point',
                    identifier: 'U003455',
                    password: 'DomVenusPoint123',
                },
                target: { id: wallet.id },
                person_id: personId,
            };

            let { res: depositResponse } = await depositTestSeed.up(depositData);

            paymentAccountId = depositResponse.body.source.id; // for clean up

            expect(depositResponse.status)
                .equal(
                    200,
                    prettifyRes(depositResponse), 'Txn should be created with 200 status'
                );

            expect(depositResponse.body.status.code)
                .equal(
                    0,
                    prettifyRes(depositResponse), 'Transaction should be created with code 0 (AUTHORIZED)'
                );

            expect(depositResponse.body.target_amount)
                .equal(
                    depositData.amount,
                    prettifyRes(depositResponse), 'Transaction amount should be same as requested'
                );

            let { body: wallets } = await request.asStuff.get(`/v1/persons/${personId}/wallets/`);

            let walletAmount = wallets
                .find(({ type }) => type === 'venus-point').amount;
            let expectedWalletAmount = currentWalletAmount + depositData.amount;

            expect(walletAmount).equal(
                expectedWalletAmount,
                prettifyRes(depositResponse, 'Wallet amount should be updated')
            );
        });

        it('Should perform deposit with existing Venus Point account', async function() {
            let paymentProcessorData = {
                adapter: 'Venus Point',
                supported_actions: 'deposit',
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

            let [{ body: venusPointPaymentAccount }, processorId, { body: wallet }] = await Promise.all([
                paymentAccountTestSeed.up(personId, paymentAccountData),
                paymentProcessorTestSeed.up(paymentProcessorData),
                walletTestSeed.up(personId, walletData),
            ]);

            paymentProcessorId = processorId;
            paymentAccountId = venusPointPaymentAccount.id;

            let depositData = {
                amount: 123,
                payment_processor_id: paymentProcessorId,
                source: { id: paymentAccountId, password: 'DomVenusPoint123' },
                target: wallet.id,
                person_id: personId,
            };

            let { res: depositResponse } = await depositTestSeed.up(depositData);

            paymentAccountId = depositResponse.body.source.id;

            expect(depositResponse.status)
                .equal(
                    200,
                    prettifyRes(depositResponse), 'Txn should be created with 200 status'
                );

            expect(depositResponse.body.status.code)
                .equal(
                    0,
                    prettifyRes(depositResponse), 'Transaction should be created with code 0 (AUTHORIZED)'
                );

            expect(depositResponse.body.target_amount)
                .equal(
                    depositData.amount,
                    prettifyRes(depositResponse), 'Transaction amount should be same as requested'
                );
        });
    });
};
