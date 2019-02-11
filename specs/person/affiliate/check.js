'use strict';

let personTestSeed = require('seeds/person.seed');
let { prettifyRes } = require('common');

let firstAffiliateId;
let secondAffiliateId;
let personId;

module.exports = () => {
    describe('#setting', function() {
        beforeEach('Create a 2 affiliates and 1 not-affiliate', async () => {
            let affiliatePersonData = {
                is_affiliate: true,
            };
            let notAffiliatePersonData = {
                is_affiliate: false,
            };

            let [firstPersonResponse, secondPersonResponse, thridPersonResponse] = await Promise.all([
                personTestSeed.up(affiliatePersonData),
                personTestSeed.up(affiliatePersonData),
                personTestSeed.up(notAffiliatePersonData),
            ]);

            let { body: firstPersonBody } = firstPersonResponse;
            let { body: secondPersonBody } = secondPersonResponse;
            let { body: thirdPersonBody } = thridPersonResponse;

            firstAffiliateId = firstPersonBody.id;
            secondAffiliateId = secondPersonBody.id;
            personId = thirdPersonBody.id;
        });

        afterEach('Delete 2 affiliates and 1 not-affiliate set', function() {
            return Promise.all([
                firstAffiliateId && personTestSeed.down(firstAffiliateId),
                secondAffiliateId && personTestSeed.down(secondAffiliateId),
                personId && personTestSeed.down(personId),
            ]);
        });

        it('should allow customer get affiliates', async function () {
            let { status, body } = await request.asStuff.get('/v1/affiliates');

            expect(status)
                .equal(200, prettifyRes(body, 'Affiliates should be returned with status 200'));
            expect(body.map(({ id }) => id).includes(firstAffiliateId))
                .equal(true, prettifyRes(body));
            expect(body.map(({ id }) => id).includes(secondAffiliateId))
                .equal(true, prettifyRes(body));
        });

        it('should add affiliate to person', async function() {
            let personData = {
                affiliate_id: firstAffiliateId,
            };

            let { body, status } = await request.asStuff
                .put(`/v1/persons/${personId}`)
                .send(personData);

            expect(status).equal(200, prettifyRes(body, 'Persons affiliate should be created with status 200'));
            expect(body.affiliate_id).equal(personData.affiliate_id, prettifyRes(body));
            personId = body.id;
        });

        it('should update persons affiliate', async function() {
            let personData = {
                affiliate_id: secondAffiliateId,
            };

            let { body, status } = await request.asStuff
                .put(`/v1/persons/${personId}`)
                .send(personData);

            expect(status).equal(200, prettifyRes(body, 'Persons affiliate should be updated with status 200'));
            expect(body.affiliate_id).equal(personData.affiliate_id, prettifyRes(body));
        });

        it('should discard person from being an affiliate', async function() {
            let personData = {
                is_affiliate: false,
            };

            let { body, status } = await request.asStuff
                .put(`/v1/persons/${firstAffiliateId}`)
                .send(personData);

            expect(status).equal(200, prettifyRes(
                body,
                'Persons affiliate status should be updated with status 200'
            ));
            expect(body.is_affiliate).equal(personData.is_affiliate, prettifyRes(body));
        });
    });
};
