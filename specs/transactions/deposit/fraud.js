'use strict';

let depositTestSeed = require('seeds/deposit.seed');
let personTestSeed = require('seeds/person.seed.extended');
let paymentAccountTestSeed = require('seeds/payment-account.seed');
let { prettifyRes } = require('common');

let goodPersonId;
let badPersonId;
let goodPersonWallets;
let badPersonWallets;
let goodPersonPaymentAccountId;

module.exports = () => {
    describe('#fraud', function() {
        before('Create dependencies', function() {
            return Promise.all([
                personTestSeed.up(),
                personTestSeed.up(),
            ]).then(([goodPerson, badPerson]) => {
                goodPersonId = goodPerson.personId;
                goodPersonWallets = goodPerson.wallets;
                badPersonId = badPerson.personId;
                badPersonWallets = badPerson.wallets;

                return Promise.all([
                    paymentAccountTestSeed.up(goodPersonId),
                    paymentAccountTestSeed.up(badPersonId),
                ]).then(([psOfGoodPerson]) => {
                    goodPersonPaymentAccountId = psOfGoodPerson.body.id;
                });
            });
        });

        after('Clean up', function() {
            return Promise.all([
                personTestSeed.down(goodPersonId),
                personTestSeed.down(badPersonId),
            ]);
        });

        it('shouldn`t create #deposit using CC of another person', function() {
            let depositData = {
                person_id: badPersonId,
                target: {
                    id: badPersonWallets.realWalletId,
                },
                type: 'deposit',
                amount: 11000 + Math.round(Math.random() * 100),
                processing_fee: 10,
                source: {
                    id: goodPersonPaymentAccountId,
                    card: {
                        cvv: '123',
                    },
                },
            };

            return depositTestSeed.up(depositData)
                .then(({ res }) => {
                    expect(res.status).equal(400, prettifyRes(res));
                    let { errors } = res.body;

                    expect(errors[0].field).equal('source.id');
                    expect(errors[0].message).equal('Specified payment account doesn\'t belong to the identity');
                });
        });

        it('shouldn`t create #deposit using wallet of another person', function() {
            let depositData = {
                person_id: goodPersonId,
                target: {
                    id: badPersonWallets.realWalletId,
                },
                type: 'deposit',
                amount: 11000 + Math.round(Math.random() * 100),
                processing_fee: 10,
                source: {
                    id: goodPersonPaymentAccountId,
                    card: {
                        cvv: '123',
                    },
                },
            };

            return depositTestSeed.up(depositData)
                .then(({ res }) => {
                    expect(res.status).equal(400, prettifyRes(res));
                    let { errors } = res.body;

                    expect(errors[0].field).equal('target.id');
                    expect(errors[0].message).equal('Wallet not found');
                });
        });

        it('shouldn`t create #deposit using wallet invalid type', function() {
            let depositData = {
                person_id: goodPersonId,
                target: {
                    id: goodPersonWallets.bonusWalletId,
                },
                type: 'deposit',
                amount: 11000 + Math.round(Math.random() * 100),
                processing_fee: 10,
                source: {
                    id: goodPersonPaymentAccountId,
                    card: {
                        cvv: '123',
                    },
                },
            };

            return depositTestSeed.up(depositData)
                .then(({ res }) => {
                    expect(res.status).equal(400, prettifyRes(res));
                    let { errors } = res.body;

                    expect(errors[0].field).equal('target.id');
                    expect(errors[0].message).equal('Wallet not found');
                });
        });

        it('shouldn`t create #deposit using removed payment account', function() {
            let depositData = {
                person_id: goodPersonId,
                target: {
                    id: goodPersonWallets.realWalletId,
                },
                type: 'deposit',
                amount: 11000 + Math.round(Math.random() * 100),
                processing_fee: 10,
                source: {
                    id: goodPersonPaymentAccountId,
                    card: {
                        cvv: '123',
                    },
                },
            };

            return request
                .asStuff
                .delete(`/v1/persons/${goodPersonId}/payment-accounts/${goodPersonPaymentAccountId}`)
                .then(({ body }) => {
                    expect(body.id).equal(goodPersonPaymentAccountId);

                    return depositTestSeed.up(depositData)
                        .then(({ res }) => {
                            expect(res.status).equal(400, prettifyRes(res));
                            let { errors } = res.body;

                            expect(errors[0].field).equal('source.id');
                            expect(errors[0].message).equal('Payment Account not found');
                        });
                });
        });
    });
};
