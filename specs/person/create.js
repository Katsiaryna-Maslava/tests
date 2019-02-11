'use strict';

let personTestSeed = require('seeds/person.seed');
let { dummy } = require('config.test');
let { prettifyRes } = require('common');

let currentPersonId;

module.exports = () => {
    describe('#create', function() {
        after('Clean up', function() {
            if (currentPersonId) {
                return personTestSeed.down(currentPersonId);
            }

            return Promise.resolve();
        });

        it('should create anon person', function() {
            let anonPersonData = {
                profile_level: 'anon',
                country: 'UNSPECIFIED',
            };

            return personTestSeed.up(anonPersonData)
                .then(({ body }) => {
                    currentPersonId = body.id;

                    expect(body.profile_level).equal(anonPersonData.profile_level, prettifyRes(body));
                    expect(body.country).equal(anonPersonData.country, prettifyRes(body));
                });
        });

        it('should create standart person', function() {
            let personData = {
                external_id: 'external-id',
                first_name: 'john',
                last_name: 'beer',
                profile_level: 'newbie',
                country: 'GB',
                city: 'test',
                region: 'test',
                score_adjustment: '0',
                street: 'test',
                post_code: '20021',
                password: '123456',
                phone: '32123443456',
                email: '1@1.com',
                gender: 'male',
                date_of_birth: '2017-03-14',
                brand_id: dummy.BRAND_ID,
                allow_bonus: true,
                referral_source: null,
                promo_code: null,
                password_2: '123456',
                primary_currency: 'USD',
                social_security_number: null,
            };

            return personTestSeed.up(personData)
                .then(({ body }) => {
                    currentPersonId = body.id;

                    expect(body.external_id).equal(personData.external_id, prettifyRes(body));
                    expect(body.first_name).equal(personData.first_name, prettifyRes(body));
                    expect(body.last_name).equal(personData.last_name, prettifyRes(body));
                    expect(body.profile_level).equal(personData.profile_level, prettifyRes(body));
                    expect(body.country).equal(personData.country, prettifyRes(body));
                    expect(body.city).equal(personData.city, prettifyRes(body));
                    expect(body.region).equal(personData.region, prettifyRes(body));
                    expect(body.street).equal(personData.street, prettifyRes(body));
                    expect(body.phone).equal(personData.phone, prettifyRes(body));
                    expect(body.email).equal(personData.email, prettifyRes(body));
                    expect(body.gender).equal(personData.gender, prettifyRes(body));
                    expect(body.account.brand.id).equal(personData.brand_id, prettifyRes(body));
                    expect(body.allow_bonus).equal(personData.allow_bonus, prettifyRes(body));
                    expect(body.referral_source).equal(personData.referral_source, prettifyRes(body));
                    expect(body.promo_code).equal(personData.promo_code, prettifyRes(body));
                    expect(body.primary_currency).equal(personData.primary_currency, prettifyRes(body));
                    expect(body.social_security_number).equal(personData.social_security_number, prettifyRes(body));
                });
        });

        it('shouldn\'t create invalid anon person', function() {
            let personData = {
                profile_level: 'anon',
                brand_id: dummy.BRAND_ID,
                gender: 'AFASFSA',
            };

            return personTestSeed.negativeUp(personData)
                .then(({ body }) => {
                    currentPersonId = null;

                    let errors = body.errors.map(e => e.field);

                    expect(errors.length).equal(2, prettifyRes(body));
                    expect(errors.includes('primary_currency')).equal(true, prettifyRes(body));
                    expect(errors.includes('gender')).equal(true, prettifyRes(body));
                });
        });

        it('shouldn\'t create invalid standart person', function() {
            let personData = {
                profile_level: 'newbie',
                brand_id: dummy.BRAND_ID,
            };

            return personTestSeed.negativeUp(personData)
                .then(({ body }) => {
                    currentPersonId = body.id;

                    let errors = body.errors.map(e => e.field);

                    expect(errors.length).equal(14, prettifyRes(body));
                    expect(errors.includes('primary_currency')).equal(true, prettifyRes(body));
                    expect(errors.includes('first_name')).equal(true, prettifyRes(body));
                    expect(errors.includes('last_name')).equal(true, prettifyRes(body));
                    expect(errors.includes('gender')).equal(true, prettifyRes(body));
                    expect(errors.includes('date_of_birth')).equal(true, prettifyRes(body));
                    expect(errors.includes('phone')).equal(true, prettifyRes(body));
                    expect(errors.includes('email')).equal(true, prettifyRes(body));
                    expect(errors.includes('password')).equal(true, prettifyRes(body));
                    expect(errors.includes('password_2')).equal(true, prettifyRes(body));
                    expect(errors.includes('country')).equal(true, prettifyRes(body));
                    expect(errors.includes('street')).equal(true, prettifyRes(body));
                    expect(errors.includes('city')).equal(true, prettifyRes(body));
                    expect(errors.includes('post_code')).equal(true, prettifyRes(body));
                    expect(errors.includes('city')).equal(true, prettifyRes(body));
                });
        });
    });
};
