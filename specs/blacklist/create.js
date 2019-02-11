'use strict';

let { prettifyRes } = require('common');
let reputationTestSeed = require('seeds/reputation.seed');
let personTestSeed = require('seeds/person.seed');
let paymentAccountTestSeed = require('seeds/payment-account.seed');
let coreTest = require('core/tests/integration/specs/blacklist/create');

let { constants } = reputationTestSeed;
let paymentAccountConstants = paymentAccountTestSeed.constants;

module.exports = () => {
    describe('#create:', function() {
        coreTest();

        it('Should create valid payment source entry', function() {
            let personId;

            return personTestSeed.up()
                .then(({ body: { id } }) => {
                    personId = id;

                    return paymentAccountTestSeed.up(personId)
                        .then(res =>
                            reputationTestSeed.up({
                                entity_id: res.body.id, identifier: null, is_payment_account: true,
                            })
                                .then(({ body }) => {
                                    this.test.reputationId = body.id;

                                    expect(body.id_type).equal(constants.id_type, prettifyRes(body));
                                    expect(body.truncated_identifier)
                                        .equal(paymentAccountConstants.truncated_identifier, prettifyRes(body));
                                    expect(body.enforce).equal(constants.enforce, prettifyRes(body));
                                    expect(body.merchant_id).equal(constants.merchant_id, prettifyRes(body));
                                    expect(body.comment).equal(constants.comment, prettifyRes(body));
                                }));
                })
                .then(() => personTestSeed.down(personId));
        });
    });
};
