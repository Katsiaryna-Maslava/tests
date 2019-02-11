'use strict';

let { prettifyRes } = require('common');
let personTestSeed = require('seeds/person.seed');

let personId;

module.exports = () => {
    describe('#update', function() {
        beforeEach('create new person', function() {
            return personTestSeed.up()
                .then(({ body }) => {
                    personId = body.id;
                });
        });

        afterEach('clean up person', function() {
            return personTestSeed.down(personId);
        });

        it('should update standart person', function() {
            let personData = {
                external_id: 'test-idasd',
                first_name: 'testffffff',
                last_name: 'asfasffasasfasfa',
                profile_level: 'gold',
                country: 'US',
                city: 'minsk',
                region: 'minsk',
                score_adjustment: 450,
                street: 'ggggg',
                post_code: '260034',
                password: '888888',
                phone: '22222222222',
                email: '22@22.com',
                gender: 'female',
                date_of_birth: '2015-03-14',
                allow_bonus: false,
                referral_source: 'qqweq',
                promo_code: 'asdasd',
                password_2: '888888',
                social_security_number: '574123240',
            };

            return request
                .asStuff
                .put(`/v1/persons/${personId}`)
                .send(personData)
                .then((res) => {
                    let { body, status } = res;

                    expect(status).equal(200, prettifyRes(body, 'Person should be updated with status 200'));

                    expect(body.external_id).equal(personData.external_id, prettifyRes(res));
                    expect(body.first_name).equal(personData.first_name, prettifyRes(res));
                    expect(body.last_name).equal(personData.last_name, prettifyRes(res));
                    expect(body.profile_level).equal(personData.profile_level, prettifyRes(res));
                    expect(body.country).equal(personData.country, prettifyRes(res));
                    expect(body.city).equal(personData.city, prettifyRes(res));
                    expect(body.region).equal(personData.region, prettifyRes(res));
                    expect(body.street).equal(personData.street, prettifyRes(res));
                    expect(body.phone).equal(personData.phone, prettifyRes(res));
                    expect(body.email).equal(personData.email, prettifyRes(res));
                    expect(body.gender).equal(personData.gender, prettifyRes(res));
                    expect(body.allow_bonus).equal(personData.allow_bonus, prettifyRes(res));
                    expect(body.referral_source).equal(personData.referral_source, prettifyRes(res));
                    expect(body.promo_code).equal(personData.promo_code, prettifyRes(res));
                    expect(body.social_security_number).equal(personData.social_security_number, prettifyRes(res));
                });
        });

        it('shouldn`t update person primary currency', function() {
            let personData = {
                primary_currency: 'EUR',
            };

            return request
                .asStuff
                .put(`/v1/persons/${personId}`)
                .send(personData)
                .then(({ body, status }) => {
                    expect(status).equal(200, prettifyRes(status, 'Person should be update with status 200'));

                    expect(body.primary_currency).equal('USD', prettifyRes(body));
                });
        });

        it('Shouldn`t update roles with incorrect fields', function() {
            let personData = {
                phone: '',
                first_name: '',
                last_name: '',
                email: '',
                street: '',
                date_of_birth: '',
                city: '',
                post_code: '',
                country: null,
            };

            return request
                .asStuff
                .put(`/v1/persons/${personId}`)
                .send(personData)
                .then((res) => {
                    let { status, body } = res;

                    expect(status).equal(400, prettifyRes(status, 'Person shouldn`t be update with status 400'));

                    let errors = body.errors.map(e => e.field);

                    expect(errors.length).equal(9, prettifyRes(res));
                    expect(errors.includes('phone')).equal(true, prettifyRes(res));
                    expect(errors.includes('first_name')).equal(true, prettifyRes(res));
                    expect(errors.includes('last_name')).equal(true, prettifyRes(res));
                    expect(errors.includes('email')).equal(true, prettifyRes(res));
                    expect(errors.includes('street')).equal(true, prettifyRes(res));
                    expect(errors.includes('date_of_birth')).equal(true, prettifyRes(res));
                    expect(errors.includes('city')).equal(true, prettifyRes(res));
                    expect(errors.includes('post_code')).equal(true, prettifyRes(res));
                    expect(errors.includes('country')).equal(true, prettifyRes(res));
                });
        });
    });
};
