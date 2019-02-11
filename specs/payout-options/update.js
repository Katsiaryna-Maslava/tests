'use strict';

let { prettifyRes } = require('common');
let { down, up } = require('seeds/payout-options-and-limits.seed');

let payoutOptionId;

module.exports = () => {
    describe('#update', function() {
        beforeEach('create new Payout option', function() {
            return up().then((id) => {
                payoutOptionId = id;
            });
        });

        afterEach('Clean up Payout option', function() {
            return down(payoutOptionId);
        });

        it('should update Payout option name', function() {
            let payoutOptionsData = {
                name: 'updated payoutOption',
            };

            return request
                .asStuff
                .put(`/v1/payout-options/${payoutOptionId}`)
                .send(payoutOptionsData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout option should be updated with status 200'));

                    expect(body.name).equal(payoutOptionsData.name, prettifyRes(res, 'should update name'));

                    expect(body.id).equal(payoutOptionId);
                });
        });

        it('shouldn\'t update Payout option adapter and types', function() {
            let payoutOptionsData = {
                velocity_unit: 'invalid',
                timeframe_unit: 'invalid',
            };

            return request
                .asStuff
                .put(`/v1/payout-options/${payoutOptionId}`)
                .send(payoutOptionsData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payout option shouldn\'t be updated with status 400'));

                    expect(body.errors.length).equal(2, prettifyRes(res));

                    expect(body.errors[0].field).equal('velocity_unit', prettifyRes(res));
                    expect(body.errors[1].field).equal('timeframe_unit', prettifyRes(res));
                })
                .then(() => request
                    .asStuff
                    .get(`/v1/payout-options/${payoutOptionId}`))
                .then((res) => {
                    let { body } = res;

                    expect(body.velocity_unit).equal('week', prettifyRes(res));
                    expect(body.timeframe_unit).equal('day', prettifyRes(res));
                });
        });
    });
};
