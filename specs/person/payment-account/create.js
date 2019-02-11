'use strict';

let moment = require('moment');
let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed');
let paymentAccountSeed = require('seeds/payment-account.seed');

let personId;
let personIdentityId;

module.exports = () => {
    describe('#create', function() {
        after('Clean up', function() {
            return personTestSeed.down(personId);
        });

        before('Clean up', function() {
            return personTestSeed.up()
                .then(({ body: { id, identityId } }) => {
                    personId = id;
                    personIdentityId = identityId;
                });
        });

        it('Should create credit card', function() {
            let paymentAccountId;
            let paymentAccountData = {
                is_enabled: true,
                source_type: 'credit-card',
                identifier: '4111111111111111',
                expiry: moment().add(2, 'year').format('YYYY-MM'),
                comment: 'My card',
                holder: 'John Due',
            };

            return paymentAccountSeed.up(personId, paymentAccountData)
                .then(({ body }) => {
                    paymentAccountId = body.id;

                    expect(body.is_enabled).equal(paymentAccountData.is_enabled, prettifyRes(body));
                    expect(body.source_type).equal(paymentAccountData.source_type, prettifyRes(body));
                    expect(body.expiry).equal(paymentAccountData.expiry, prettifyRes(body));
                    expect(body.comment).equal(paymentAccountData.comment, prettifyRes(body));
                    expect(body.holder).equal(paymentAccountData.holder, prettifyRes(body));
                    expect(body.identityId).equal(personIdentityId, prettifyRes(body));
                })
                .then(() => paymentAccountSeed.down(personId, paymentAccountId));
        });

        it('Should not create credit card', function() {
            let paymentAccountData = {
                is_enabled: true,
                source_type: 'credit-card',
                identifier: '123123123123123123',
                expiry: moment().add(2, 'year').format('YYYY-MM'),
                comment: 'My card',
                holder: 'John Due',
            };

            return paymentAccountSeed.negativeUp(personId, paymentAccountData)
                .then((res) => {
                    let errors = res.body.errors.map(e => e.field);

                    expect(errors.includes('scheme')).equal(true, prettifyRes(res));
                });
        });
    });
};
