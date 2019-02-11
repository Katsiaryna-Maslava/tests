'use strict';

let { prettifyRes } = require('common');
let { down, up } = require('seeds/payout-options-and-limits.seed');

let payoutOptionId;
let payoutOption;

module.exports = () => {
    describe('#update', function() {
        beforeEach('create new Payout option', function() {
            return up().then((id) => {
                payoutOptionId = id;

                return request
                    .asStuff
                    .get(`/v1/payout-options/${payoutOptionId}`)
                    .then((res) => {
                        expect(res.status)
                            .equal(200, prettifyRes(res, 'Payout Option should be returned with status 200'));

                        payoutOption = res.body;
                    });
            });
        });

        afterEach('Clean up Payout option', function() {
            return down(payoutOptionId);
        });

        it('should update Payout option split amount', function() {
            let payoutOptionsLimitsData = {
                split_charge_amount: 10,
            };

            return request
                .asStuff
                .put(`/v1/payout-options/${payoutOptionId}/limits/${payoutOption.limits[0].currency}`)
                .send(payoutOptionsLimitsData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout option should be updated with status 200'));

                    expect(body[0].split_charge_amount)
                        .equal(10, prettifyRes(res, 'should update split amount'));

                    expect(body[0].currency).equal(payoutOption.limits[0].currency);
                });
        });
    });
};
