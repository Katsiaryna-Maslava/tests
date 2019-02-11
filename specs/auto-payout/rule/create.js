'use strict';

let autoPayoutRuleSeed = require('seeds/auto-payout-rule.seed');
let { prettifyRes } = require('common');
let { dummy: { BRAND_ID } } = require('config.test');

module.exports = () => {
    describe('#create', function() {
        it('Should Create Auto Payout Rule', async function () {
            let autoPayoutRule = await autoPayoutRuleSeed.up({}, BRAND_ID);

            expect(autoPayoutRule.status)
                .equal(200, prettifyRes(autoPayoutRule, 'Payout Request should be created with status 200'));

            expect(autoPayoutRule.body.id).be.a('string');
            expect(autoPayoutRule.body.name).be.a('string');
            expect(autoPayoutRule.body.brand_id).be.a('string');
            expect(autoPayoutRule.body.geo_target).be.a('array');
            expect(autoPayoutRule.body.profile_levels).be.a('array');
            expect(autoPayoutRule.body.payment_methods).be.a('array');
            expect(autoPayoutRule.body.currencies).be.a('array');

            return autoPayoutRuleSeed.down(autoPayoutRule.body.brand_id, autoPayoutRule.body.id);
        });
    });
};
