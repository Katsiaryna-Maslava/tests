'use strict';

let { prettifyRes } = require('common');
let { down, up } = require('seeds/payout-options-and-limits.seed');

let payoutOptionId;

module.exports = () => {
    describe('#read', function() {
        beforeEach('create new Payout Option', function() {
            return up().then((id) => {
                payoutOptionId = id;
            });
        });

        afterEach('Clean up Payout Option', function() {
            return down(payoutOptionId);
        });

        it('shouldn\'t get non-existing Payout Option', function() {
            return request
                .asStuff
                .get('/v1/payout-options/5')
                .then((res) => {
                    expect(res.status)
                        .equal(404, prettifyRes(res, 'Payout Option shouldn\'t be returned with status 404'));
                });
        });

        it('should get Payout Option', function() {
            return request
                .asStuff
                .get(`/v1/payout-options/${payoutOptionId}`)
                .then((res) => {
                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout Option should be returned with status 200'));

                    expect(res.body.id).be.a('string');
                    expect(res.body.name).be.a('string');
                    expect(res.body.velocity).be.a('number');
                    expect(res.body.velocity_unit).be.a('string');
                    expect(res.body.timeframe).be.a('number');
                    expect(res.body.timeframe_unit).be.a('string');
                    expect(res.body.is_enabled).be.a('boolean');
                    expect(res.body.is_require_prior_deposit).be.a('boolean');
                    expect(res.body.profile).be.a('string');
                    expect(res.body.description).be.a('string');
                    expect(res.body.payment_method).be.a('string');
                    expect(res.body.default_payment_processor_id).be.a('string');
                    expect(res.body.geo_rules).be.a('array');
                    expect(res.body.card_brands).be.a('array');
                    expect(res.body.limits).be.a('array');
                });
        });

        it('should get Payout Option list', function() {
            return request
                .asStuff
                .get('/v1/payout-options/')
                .then((res) => {
                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Payout Option list should be returned with status 200'));

                    expect(res.body[0].id).be.a('string');
                    expect(res.body[0].name).be.a('string');
                    expect(res.body[0].velocity).be.a('number');
                    expect(res.body[0].velocity_unit).be.a('string');
                    expect(res.body[0].timeframe).be.a('number');
                    expect(res.body[0].timeframe_unit).be.a('string');
                    expect(res.body[0].is_enabled).be.a('boolean');
                    expect(res.body[0].is_require_prior_deposit).be.a('boolean');
                    expect(res.body[0].profile).be.a('string');
                    expect(res.body[0].description).be.a('string');
                    expect(res.body[0].payment_method).be.a('string');
                    expect(res.body[0].default_payment_processor_id).be.a('string');
                    expect(res.body[0].geo_rules).be.a('array');
                    expect(res.body[0].card_brands).be.a('array');
                    expect(res.body[0].limits).be.a('array');
                });
        });
    });
};
