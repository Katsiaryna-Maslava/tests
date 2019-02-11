'use strict';

let { stringify } = require('querystring');
let { prettifyRes } = require('common');
let { down, up } = require('seeds/payout-options-and-limits.seed');
let personSeed = require('seeds/person.seed');

let payoutOptionId;
let personId;

module.exports = () => {
    describe('#get additional payout data', function() {
        beforeEach('create new Payout Option', function() {
            return Promise.all([
                up(),
                personSeed.up(),
            ])
                .then(([optionId, personResponse]) => {
                    payoutOptionId = optionId;
                    personId = personResponse.body.id;
                });
        });

        afterEach('Clean up Payout Option', function() {
            return Promise.all([
                payoutOptionId && down(payoutOptionId),
                personId && personSeed.down(personId),
            ].filter(Boolean));
        });

        it('should get Payout Option Parameters', function() {
            let data = {
                personId,
                charge: 20000,
                payoutMethod: 'credit-card',
                cardBrand: 'visa',
                currency: 'USD',
            };

            let querystring = stringify(data);

            return request
                .asStuff
                .get(`/v1/payout-options/params?${querystring}`)
                .then(({ status, body }) => {
                    expect(status)
                        .equal(200, prettifyRes(body, 'Payout Option Parameters should be returned with status 200'));
                    // TODO: refactor payout options (PO) seed and
                    // compare results below with returned entity by PO seed

                    expect(body.actual_velocity).equal(0, prettifyRes(body));
                    expect(body.velocity).equal(23, prettifyRes(body));
                    expect(body.velocity_unit).equal('week', prettifyRes(body));
                    expect(body.timeframe).equal(1, prettifyRes(body));
                    expect(body.timeframe_unit).equal('day', prettifyRes(body));
                    expect(body.minimum_amount).equal(0, prettifyRes(body));
                    expect(body.maximum_amount).equal(1000000, prettifyRes(body));
                });
        });

        it('should get Payout Methods for specified fields', function() {
            let data = {
                country: 'US',
                profileLevel: 'newbie',
                currency: 'USD',
            };

            let querystring = stringify(data);

            return request
                .asStuff
                .get(`/v1/payout-options/payout-methods?${querystring}`)
                .then(({ body, status }) => {
                    expect(status)
                        .equal(200, prettifyRes(body, 'Payout Methods should be returned with status 200'));
                    // TODO: refactor payout options (PO) seed and
                    // compare results below with returned entity by PO seed
                    expect(body).be.a('array');
                    expect(body.length).equal(1, prettifyRes(body));
                    expect(body.includes('credit-card')).equal(true, prettifyRes(body));
                });
        });

        it('should get Payout Methods for specified person', function() {
            let data = {
                personId,
            };

            let querystring = stringify(data);

            return request
                .asStuff
                .get(`/v1/payout-options/payout-methods?${querystring}`)
                .then(({ body, status }) => {
                    expect(status)
                        .equal(200, prettifyRes(body, 'Payout Methods should be returned with status 200'));
                    // TODO: refactor payout options (PO) seed and
                    // compare results below with returned entity by PO seed
                    expect(body).be.a('array');
                    expect(body.length).equal(1, prettifyRes(body));
                    expect(body.includes('credit-card')).equal(true, prettifyRes(body));
                });
        });

        it('should get Fee for specified person and payout params', function() {
            let data = {
                personId,
                charge: 6500,
                payoutMethod: 'credit-card',
                cardBrand: 'visa',
                currency: 'USD',
            };

            let querystring = stringify(data);

            return request
                .asStuff
                .get(`/v1/payout-options/fee?${querystring}`)
                .then(({ body, status }) => {
                    expect(status)
                        .equal(200, prettifyRes(body, 'Fee should be returned with status 200'));
                    // TODO: refactor payout options (PO) seed and
                    // recalculate result here
                    expect(body).be.a('object');
                    expect(body.fee).equal(130, prettifyRes(body));
                });
        });

        it('shouldn`t get Fee for unspecified person and payout params', function() {
            let data = {
                charge: 6500,
                payoutMethod: 'credit-card',
                cardBrand: 'visa',
                currency: 'USD',
            };

            let querystring = stringify(data);

            return request
                .asStuff
                .get(`/v1/payout-options/fee?${querystring}`)
                .then(({ body, status }) => {
                    expect(status)
                        .equal(200, prettifyRes(body, 'Fee shouldn`t be returned with status 200'));
                    // TODO: refactor payout options (PO) seed and
                    // recalculate result here
                    expect(body).be.a('array');
                    expect(body.length).equal(0, prettifyRes(body));
                });
        });

        it('shouldn`t get Fee for non-existing person and payout params', function() {
            let data = {
                personId: 'adfasdf',
                charge: 6500,
                payoutMethod: 'credit-card',
                cardBrand: 'visa',
                currency: 'USD',
            };

            let querystring = stringify(data);

            return request
                .asStuff
                .get(`/v1/payout-options/fee?${querystring}`)
                .then(({ body, status }) => {
                    expect(status)
                        .equal(404, prettifyRes(body, 'Fee shouldn`t be returned with status 404'));
                });
        });
    });
};
