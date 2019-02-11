'use strict';

let walletTestSeed = require('seeds/wallet.seed');
let personTestSeed = require('seeds/person.seed');
let { prettifyRes } = require('common');

let personId;
let personCurrency;

module.exports = () => {
    describe('#create', function() {
        before('Create basic data', function() {
            return personTestSeed.up()
                .then(({ body }) => {
                    personId = body.id;
                    personCurrency = body.primary_currency;

                    return walletTestSeed.down();
                });
        });

        after('Clean up', function() {
            return Promise.all([
                personTestSeed.down(personId),
                walletTestSeed.down(),
            ]);
        });

        it('should create valid real wallet', function() {
            let walletData = {
                type: 'real',
                name: 'test real wallet',
                show_in_cashier: true,
                method: 'deposit',
            };

            return walletTestSeed.up(personId, walletData)
                .then(({ body }) => {
                    expect(body.type).equal(walletData.type, prettifyRes(body));
                    expect(body.name).equal(walletData.name, prettifyRes(body));
                    expect(body.currency).equal(personCurrency, prettifyRes(body));
                    expect(body.show_in_cashier).equal(walletData.show_in_cashier, prettifyRes(body));
                    expect(body.method).equal(walletData.method, prettifyRes(body));
                });
        });

        it('should create valid Venus Point wallet', function() {
            let walletData = {
                type: 'venus-point',
                name: 'test Venus Point wallet',
                show_in_cashier: true,
                method: 'deposit',
            };

            return walletTestSeed.up(personId, walletData)
                .then(({ body }) => {
                    expect(body.type).equal(walletData.type, prettifyRes(body));
                    expect(body.name).equal(walletData.name, prettifyRes(body));
                    expect(body.currency).equal(personCurrency, prettifyRes(body));
                    expect(body.show_in_cashier).equal(walletData.show_in_cashier, prettifyRes(body));
                    expect(body.method).equal(walletData.method, prettifyRes(body));
                });
        });

        it('should create valid play wallet', function() {
            let walletData = {
                type: 'play',
                name: 'test play wallet',
                show_in_cashier: true,
            };

            return walletTestSeed.up(personId, walletData)
                .then(({ body }) => {
                    expect(body.type).equal(walletData.type, prettifyRes(body));
                    expect(body.name).equal(walletData.name, prettifyRes(body));
                    expect(body.show_in_cashier).equal(walletData.show_in_cashier, prettifyRes(body));
                });
        });

        it('should create valid fpp wallet', function() {
            let walletData = {
                type: 'fpp',
                name: 'test fpp wallet',
                show_in_cashier: true,
            };

            return walletTestSeed.up(personId, walletData)
                .then(({ body }) => {
                    expect(body.type).equal(walletData.type, prettifyRes(body));
                    expect(body.name).equal(walletData.name, prettifyRes(body));
                    expect(body.show_in_cashier).equal(walletData.show_in_cashier, prettifyRes(body));
                });
        });

        it('should not create wallet', function() {
            let walletData = {
                type: 'lolo',
                name: 'test real wallet',
                show_in_cashier: true,
                method: 'transfer',
            };

            return walletTestSeed.negativeUp(personId, walletData)
                .then(({ body }) => {
                    let errors = body.errors.map(e => e.field);

                    expect(errors.length).equal(2, prettifyRes(body));
                    expect(errors.includes('type')).equal(true, prettifyRes(body));
                    expect(errors.includes('method')).equal(true, prettifyRes(body));
                });
        });
    });
};
