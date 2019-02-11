'use strict';

let moment = require('moment');
let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed');
let paymentAccountSeed = require('seeds/payment-account.seed');

let personId;

module.exports = () => {
    describe('#update', function() {
        after('Clean up', function() {
            return personTestSeed.down(personId);
        });

        before('Clean up', function() {
            return personTestSeed.up()
                .then(({ body: { id } }) => {
                    personId = id;
                });
        });

        it('Should update credit card', function() {
            let paymentAccountData = {
                is_enabled: false,
                expiry: moment().add(3, 'year').format('YYYY-MM'),
                comment: 'My card UPDATE',
            };

            return paymentAccountSeed.up(personId)
                .then(({ body: { id } }) => request
                    .asStuff
                    .put(`/v1/persons/${personId}/payment-accounts/${id}`)
                    .send(paymentAccountData)
                    .then(({ body, status }) => {
                        expect(status).equal(200, prettifyRes(
                            body,
                            'Payment source should be created with status 200'
                        ));

                        expect(body.id).equal(id, prettifyRes(body));
                        expect(body.is_enabled).equal(paymentAccountData.is_enabled, prettifyRes(body));
                        expect(body.expiry).equal(paymentAccountData.expiry, prettifyRes(body));
                        expect(body.comment).equal(paymentAccountData.comment, prettifyRes(body));
                    })
                    .then(() => paymentAccountSeed.down(personId, id)));
        });
    });
};
