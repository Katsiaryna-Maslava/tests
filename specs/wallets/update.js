'use strict';

let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed');
let walletTestSeed = require('seeds/wallet.seed');

let personId;

module.exports = () => {
    describe('#update', function() {
        before('create new person', function() {
            return personTestSeed.up()
                .then(({ body }) => {
                    personId = body.id;
                })
                .then(() => walletTestSeed.down());
        });

        after('clean up person', function() {
            return personTestSeed.down(personId);
        });

        it('should update existing real Wallet', function() {
            let createWalletData = {
                type: 'real',
                name: 'test iban wallet',
                show_in_cashier: true,
                method: 'deposit',
            };

            return walletTestSeed.up(personId, createWalletData)
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets`)
                    .then((res) => {
                        let { body } = res;
                        let walletId = body[0].id;
                        let walletData = {
                            name: 'update test iban wallet',
                            show_in_cashier: true,
                            method: 'withdrawal-deposit',
                        };

                        return request
                            .asStuff
                            .put(`/v1/persons/${personId}/wallets/${walletId}`)
                            .send(walletData)
                            .then((responce) => {
                                expect(responce.status).equal(200, prettifyRes(responce.body));

                                expect(responce.body.type).equal(
                                    createWalletData.type,
                                    prettifyRes(responce.body)
                                );
                                expect(responce.body.name).equal(walletData.name, prettifyRes(responce.body));
                                expect(responce.body.show_in_cashier).equal(
                                    walletData.show_in_cashier,
                                    prettifyRes(responce.body)
                                );
                                expect(responce.body.method).equal(walletData.method, prettifyRes(responce.body));
                            });
                    })
                    .then(() => walletTestSeed.down()));
        });
    });
};
