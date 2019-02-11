'use strict';

let { prettifyRes } = require('common');
let { getPatoutOptionsAndLimitsData, down } = require('seeds/payout-options-and-limits.seed');

module.exports = () => {
    describe('#create', function() {
        it('should create payout option', function() {
            let { payoutOptionData } = getPatoutOptionsAndLimitsData();

            return request
                .asStuff
                .post('/v1/payout-options')
                .send(payoutOptionData)
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Payout option should be created with status 200'));
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

                    return down(res.body.id);
                });
        });

        it('shouldn`t create payout option', function() {
            return request
                .asStuff
                .post('/v1/payout-options')
                .send({})
                .then((res) => {
                    expect(res.status)
                        .equal(400, prettifyRes(res, 'Payout option shouldn`t be created with status 400'));

                    expect(res.body.errors).to.be.an('array');

                    let errors = res.body.errors.map(e => e.field);

                    expect(errors.length).equal(5, prettifyRes(res));
                    expect(errors.includes('merchant_id')).equal(true, prettifyRes(res));
                    expect(errors.includes('payment_method')).equal(true, prettifyRes(res));
                    expect(errors.includes('name')).equal(true, prettifyRes(res));
                    expect(errors.includes('default_payment_processor_id')).equal(true, prettifyRes(res));
                    expect(errors.includes('geo_rules_error')).equal(true, prettifyRes(res));
                });
        });
    });
};
