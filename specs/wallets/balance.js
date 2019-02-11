'use strict';

let personTestSeed = require('seeds/person.seed.extended');
let { prettifyRes } = require('common');

let walletId;
let personId;

module.exports = () => {
    describe('#wallets balance', function() {
        before('Create dependencies', function() {
            return personTestSeed.up()
                .then((personData) => {
                    walletId = personData.wallets.realWalletId;
                    personId = personData.personId;
                });
        });

        after('Clean up', function() {
            return personTestSeed.down(personId);
        });

        it('should increment balance', function() {
            return request
                .asStuff
                .post('/v1/transactions')
                .send({
                    target: {
                        id: walletId,
                    },
                    amount: 10000,
                    type: 'adjustment',
                })
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Amount should be incremented with status 200'));
                })
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets/`)
                    .then((walletsResponse) => {
                        let wallets = walletsResponse.body;

                        let walletAmount = wallets.find(wallet => wallet.id === walletId).amount;

                        expect(walletAmount).equal(1010000, prettifyRes(walletsResponse));
                    }));
        });

        it('should decrement balance', function() {
            return request
                .asStuff
                .post('/v1/transactions')
                .send({
                    target: {
                        id: walletId,
                    },
                    amount: -10000,
                    type: 'adjustment',
                })
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Amount should be incremented with status 200'));
                })
                .then(() => request
                    .asStuff
                    .get(`/v1/persons/${personId}/wallets/`)
                    .then((walletsResponse) => {
                        let wallets = walletsResponse.body;
                        let walletAmount = wallets.find(wallet => wallet.id === walletId).amount;

                        expect(walletAmount).equal(1000000, prettifyRes(walletsResponse));
                    }));
        });
    });
};
