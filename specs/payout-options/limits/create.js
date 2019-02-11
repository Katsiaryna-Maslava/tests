'use strict';

let { prettifyRes } = require('common');
let { getPatoutOptionsAndLimitsData, down } = require('seeds/payout-options-and-limits.seed');

module.exports = () => {
    describe('#create', function() {
        it('should create payout option limits', function() {
            let { payoutOptionData, payoutLimitsData } = getPatoutOptionsAndLimitsData();

            return request
                .asStuff
                .post('/v1/payout-options')
                .send(payoutOptionData)
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Payout option should be created with status 200'));
                    expect(res.body.id).be.a('string');

                    return res.body.id;
                })
                .then((payoutOptionId) => {
                    payoutLimitsData.payout_method_option_id = payoutOptionId;

                    return request
                        .asStuff
                        .post(`/v1/payout-options/${payoutOptionId}/limits`)
                        .send(payoutLimitsData)
                        .then((res) => {
                            expect(res.status)
                                .equal(200, prettifyRes(res, 'Payout Limit should be created with status 200'));

                            expect(res.body[0].id).be.a('string');
                            expect(res.body[0].payout_method_option_id).be.a('string');
                            expect(res.body[0].currency).be.a('string');
                            expect(res.body[0].fees).be.a('array');

                            return down(payoutOptionId);
                        });
                });
        });

        it('shouldn`t create payout option limit', function() {
            let { payoutOptionData } = getPatoutOptionsAndLimitsData();

            return request
                .asStuff
                .post('/v1/payout-options')
                .send(payoutOptionData)
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Payout option should be created with status 200'));
                    expect(res.body.id).be.a('string');

                    return res.body.id;
                })
                .then(payoutOptionId => request
                    .asStuff
                    .post(`/v1/payout-options/${payoutOptionId}/limits`)
                    .send({})
                    .then((res) => {
                        let { errors } = res.body;

                        expect(res.status)
                            .equal(400, prettifyRes(res, 'Payout Limit should be created with status 200'));

                        expect(errors).to.be.an('array');
                        expect(errors.length).equal(3);

                        expect(errors[0].field).equal('currency');
                        expect(errors[1].field).equal('fees');
                        expect(errors[2].field).equal('payout_method_option_id');

                        return down(payoutOptionId);
                    }));
        });
    });
};
