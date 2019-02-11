
'use strict';

let depositTestSeed = require('seeds/deposit.seed');
let { prettifyRes } = require('common');

let secondPersonId;
let secondPaymentProcessorId;
let firstPersonId;
let firstPaymentProcessorId;

describe('Person Matching', function() {
    describe('#read', function() {
        before('Create dependencies', function() {
            return Promise.all([
                depositTestSeed.up(),
                depositTestSeed.up(),
            ])
                .then(([resultFirst, resultSecond]) => {
                    expect(resultFirst.res.status)
                        .equal(200, prettifyRes(resultFirst.res, 'Deposit should be created with status 200'));
                    expect(resultSecond.res.status)
                        .equal(200, prettifyRes(resultSecond.res, 'Deposit should be created with status 200'));
                    secondPersonId = resultSecond.personId;
                    secondPaymentProcessorId = resultSecond.paymentProcessorId;
                    firstPersonId = resultFirst.personId;
                    firstPaymentProcessorId = resultFirst.paymentProcessorId;
                });
        });

        after('Clean up', function() {
            return Promise.all([
                depositTestSeed.down(secondPaymentProcessorId, secondPersonId),
                depositTestSeed.down(firstPaymentProcessorId, firstPersonId),
            ]);
        });

        it('should get matching with other palyer', function() {
            return request
                .asStuff
                .get(`/v1/persons/${firstPersonId}/matches`)
                .then((res) => {
                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Person matching should be returned with status 200'));
                    expect(res.body[0].data[0].is_match_by_ip).equal(true, prettifyRes(res));
                    expect(res.body[0].data[0].is_match_by_fingerprint).equal(true, prettifyRes(res));
                    expect(res.body[0].data[0].is_match_by_payment_accounts).equal(true, prettifyRes(res));

                    let matchedPerson = res.body.find(({ id }) => (id === secondPersonId));

                    expect(matchedPerson && matchedPerson.id)
                        .equal(secondPersonId, prettifyRes(res));
                });
        });
    });
});
