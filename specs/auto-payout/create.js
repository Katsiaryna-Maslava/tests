'use strict';

let payoutRequestSeed = require('seeds/payout-request.seed');
let autoPayoutRuleSeed = require('seeds/auto-payout-rule.seed');
let personTestSeed = require('seeds/person.seed.extended');
let { prettifyRes } = require('common');
let { cleanUpTable } = require('common/db');
let { dummy: { BRAND_ID } } = require('config.test');
let { payoutRequests: { statusesMap } } = require('src/constants/app-constants');
let identityRepository = require('src/modules/identity/repository');

let autoPayoutRuleId;
let paymentProcessorId;
let personId;

module.exports = () => {
    describe('#create', function() {
        beforeEach('Update brand settings', function () {
            let brandData = {
                is_auto_payout_enabled: true,
                cumulative_payout_threshold_amount: 100000,
                single_payout_threshold_amount: 150,
            };

            return request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(brandData);
        });

        afterEach('Clean Up', async function () {
            let brandData = {
                is_auto_payout_enabled: false,
                cumulative_payout_threshold_amount: null,
                single_payout_threshold_amount: null,
            };

            await Promise.all([
                cleanUpTable('payout_requests'),
                request.asStuff.put(`/v1/brands/${BRAND_ID}`).send(brandData),
                payoutRequestSeed.down(paymentProcessorId, personId),
                autoPayoutRuleId && autoPayoutRuleSeed.down(BRAND_ID, autoPayoutRuleId),
            ]);

            await cleanUpTable('payout_options');
        });

        it('Should Create Payout Request that will be Authorized Automatically', async function () {
            let { body: autoPayoutRule } = await autoPayoutRuleSeed.up({}, BRAND_ID);

            autoPayoutRuleId = autoPayoutRule.id;

            let payoutRequest = await payoutRequestSeed.up();

            paymentProcessorId = payoutRequest.paymentProcessorId;
            personId = payoutRequest.personId;

            expect(payoutRequest.res.status)
                .equal(200, prettifyRes(payoutRequest.res, 'Payout Request should be created with status 200'));

            expect(payoutRequest.res.body.id).be.a('string');
            expect(payoutRequest.res.body.status).equal(
                statusesMap.authorizedAutomatically,
                prettifyRes(payoutRequest.res, 'Status should be Authorized Automatically'),
            );
        });

        it('Should Create Payout Request that is NOT acceptable for Auto Payout criteria', async function () {
            let autoPayoutRuleData = {
                amount_from: 0,
                amount_to: 10,
            };

            let { body: autoPayoutRule } = await autoPayoutRuleSeed.up(autoPayoutRuleData, BRAND_ID);

            autoPayoutRuleId = autoPayoutRule.id;

            let payoutRequest = await payoutRequestSeed.up();

            paymentProcessorId = payoutRequest.paymentProcessorId;
            personId = payoutRequest.personId;

            expect(payoutRequest.res.status)
                .equal(200, prettifyRes(payoutRequest.res, 'Payout Request should be created with status 200'));

            expect(payoutRequest.res.body.id).be.a('string');
            expect(payoutRequest.res.body.status).equal(
                statusesMap.autoPayoutStopped,
                prettifyRes(payoutRequest.res, 'Status should be Auto-Payout Stopped'),
            );
            expect(payoutRequest.res.body.charge_amount).to.be.above(
                autoPayoutRuleData.amount_to,
                prettifyRes(payoutRequest.res, 'Amount should be more than in auto payout rule'),
            );
        });

        it('Should Create Payout Request that is NOT acceptable because of sums in KYC Threshold', async function () {
            let { body: autoPayoutRule } = await autoPayoutRuleSeed.up({}, BRAND_ID);

            autoPayoutRuleId = autoPayoutRule.id;

            let brandData = {
                single_payout_threshold_amount: 10,
            };

            await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(brandData);

            let { res: firstPayoutRequest } = await payoutRequestSeed.up();

            expect(firstPayoutRequest.status)
                .equal(200, prettifyRes(firstPayoutRequest, 'Payout Request should be created with status 200'));

            expect(firstPayoutRequest.body.id).be.a('string');
            expect(firstPayoutRequest.body.status).equal(
                statusesMap.autoPayoutStopped,
                prettifyRes(firstPayoutRequest, 'Status should be Auto-Payout Stopped'),
            );
            expect(firstPayoutRequest.body.charge_amount).to.be.above(
                brandData.single_payout_threshold_amount,
                prettifyRes(firstPayoutRequest, 'Amount should be more than single payout amount in KYC Threshold'),
            );

            await payoutRequestSeed.authorize(firstPayoutRequest.body.id);

            brandData = {
                single_payout_threshold_amount: 150,
                cumulative_payout_threshold_amount: 190,
            };

            await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(brandData);

            let payoutRequestData = {
                person_id: firstPayoutRequest.body.person.id,
                source: {
                    id: firstPayoutRequest.body.source.id,
                },
            };

            let secondPayoutRequest = await payoutRequestSeed.up(payoutRequestData);

            paymentProcessorId = secondPayoutRequest.paymentProcessorId;
            personId = secondPayoutRequest.personId;

            expect(secondPayoutRequest.res.status)
                .equal(200, prettifyRes(secondPayoutRequest.res, 'Payout Request should be created with status 200'));

            expect(secondPayoutRequest.res.body.id).be.a('string');
            expect(secondPayoutRequest.res.body.status).equal(
                statusesMap.autoPayoutStopped,
                prettifyRes(secondPayoutRequest.res, 'Status should be Auto-Payout Stopped'),
            );
            expect(firstPayoutRequest.body.charge_amount + secondPayoutRequest.res.body.charge_amount).to.be.above(
                brandData.cumulative_payout_threshold_amount,
                prettifyRes(
                    secondPayoutRequest.res,
                    'Amount should be more than cumulative payout amount in KYC Threshold',
                ),
            );
        });

        it('Should Create Payout Request when "Auto-payout enabled" is NOT checked', async function () {
            let brandData = {
                is_auto_payout_enabled: false,
            };

            await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(brandData);

            let payoutRequest = await payoutRequestSeed.up();

            paymentProcessorId = payoutRequest.paymentProcessorId;
            personId = payoutRequest.personId;
            autoPayoutRuleId = null;

            expect(payoutRequest.res.status)
                .equal(200, prettifyRes(payoutRequest.res, 'Payout Request should be created with status 200'));

            expect(payoutRequest.res.body.id).be.a('string');
            expect(payoutRequest.res.body.status).equal(
                statusesMap.requested,
                prettifyRes(payoutRequest.res, 'Status should be Requested'),
            );
        });

        it('Should Create Payout Request when Customer KYC files are filled and Approved', async function () {
            let { body: autoPayoutRule } = await autoPayoutRuleSeed.up({}, BRAND_ID);

            autoPayoutRuleId = autoPayoutRule.id;

            let brandData = {
                single_payout_threshold_amount: 10,
            };

            await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(brandData);

            let person = await personTestSeed.up();

            let fullPersonData = await request
                .asStuff
                .get(`/v1/persons/${person.personId}`);

            await identityRepository.update(fullPersonData.body.identity.id, { isKycVerified: true });

            let payoutRequestData = {
                person_id: fullPersonData.body.id,
                source: {
                    id: person.wallets.realWalletId,
                },
            };

            let payoutRequest = await payoutRequestSeed.up(payoutRequestData);

            paymentProcessorId = payoutRequest.paymentProcessorId;
            personId = fullPersonData.body.id;

            expect(payoutRequest.res.status)
                .equal(200, prettifyRes(payoutRequest.res, 'Payout Request should be created with status 200'));

            expect(payoutRequest.res.body.id).be.a('string');
            expect(payoutRequest.res.body.status).equal(
                statusesMap.authorizedAutomatically,
                prettifyRes(payoutRequest.res, 'Status should be Authorized Automatically'),
            );
        });
    });
};
