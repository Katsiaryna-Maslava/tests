'use strict';

let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed');
let walletTestSeed = require('seeds/wallet.seed');

let personId;

module.exports = () => {
    describe('#read', function() {
        before('create new person', function() {
            return personTestSeed.up()
                .then(({ body }) => {
                    personId = body.id;
                })
                .then(() => walletTestSeed.down());
        });

        after('clean up person', function() {
            return personTestSeed.down(personId)
                .then(() => walletTestSeed.down());
        });

        it('should get existing real Wallet', function() {
            let walletData = {
                type: 'real',
                name: 'test iban wallet',
                show_in_cashier: true,
                method: 'deposit',
            };

            return walletTestSeed.up(personId, walletData)
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets`)
                    .then((res) => {
                        let { body } = res;
                        let walletsTypes = body.map(wallet => wallet.type);

                        expect(res.status).equal(200, prettifyRes(res));
                        expect(walletsTypes.includes(walletData.type)).equal(true, prettifyRes(body));
                    })
                    .then(() => walletTestSeed.down()));
        });

        it('should get existing play Wallet', function() {
            let walletData = {
                type: 'play',
                name: 'test iban wallet',
                show_in_cashier: true,
            };

            return walletTestSeed.up(personId, walletData)
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets`)
                    .then((res) => {
                        let { body } = res;
                        let walletsTypes = body.map(wallet => wallet.type);

                        expect(res.status).equal(200, prettifyRes(res));
                        expect(walletsTypes.includes(walletData.type)).equal(true, prettifyRes(body));
                    })
                    .then(() => walletTestSeed.down()));
        });

        it('should get existing Venus Point Wallet', function() {
            let walletData = {
                type: 'venus-point',
                name: 'test iban wallet',
                show_in_cashier: true,
                method: 'deposit',
            };

            return walletTestSeed.up(personId, walletData)
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets`)
                    .then((res) => {
                        let { body } = res;
                        let walletsTypes = body.map(wallet => wallet.type);

                        expect(res.status).equal(200, prettifyRes(res));
                        expect(walletsTypes.includes(walletData.type)).equal(true, prettifyRes(body));
                    })
                    .then(() => walletTestSeed.down()));
        });

        it('should get existing bonus Wallet', function() {
            let walletData = {
                type: 'bonus',
                name: 'test iban wallet',
                show_in_cashier: true,
                method: 'deposit',
            };

            return walletTestSeed.up(personId, walletData)
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets`)
                    .then((res) => {
                        let { body } = res;
                        let walletsTypes = body.map(wallet => wallet.type);

                        expect(res.status).equal(200, prettifyRes(res));
                        expect(walletsTypes.includes(walletData.type)).equal(true, prettifyRes(body));
                    })
                    .then(() => walletTestSeed.down()));
        });

        it('should get existing fpp Wallet', function() {
            let walletData = {
                type: 'fpp',
                name: 'test iban wallet',
                show_in_cashier: true,
            };

            return walletTestSeed.up(personId, walletData)
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets`)
                    .then((res) => {
                        let { body } = res;
                        let walletsTypes = body.map(wallet => wallet.type);

                        expect(res.status).equal(200, prettifyRes(res));
                        expect(walletsTypes.includes(walletData.type)).equal(true, prettifyRes(body));
                    })
                    .then(() => walletTestSeed.down()));
        });
    });
};
