'use strict';

let autoPayoutRuleSeed = require('seeds/auto-payout-rule.seed');
let { prettifyRes } = require('common');
let { dummy: { BRAND_ID } } = require('config.test');

module.exports = () => {
    describe('#update', function() {
        it('Should Update Auto Payout Rule', async function () {
            let autoPayoutRule = await autoPayoutRuleSeed.up({}, BRAND_ID);

            expect(autoPayoutRule.status)
                .equal(200, prettifyRes(autoPayoutRule, 'Payout Request should be created with status 200'));

            expect(autoPayoutRule.body.age_from).to.be.null;
            expect(autoPayoutRule.body.age_to).to.be.null;

            let autoPayoutRuleData = {
                age_from: 21,
                age_to: 60,
            };

            let updatedAutoPayoutRule = await request
                .asStuff
                .put(`/v1/brands/${autoPayoutRule.body.brand_id}/auto-payout-rules/${autoPayoutRule.body.id}`)
                .send(autoPayoutRuleData);

            expect(updatedAutoPayoutRule.body.age_from).equal(
                autoPayoutRuleData.age_from,
                prettifyRes(updatedAutoPayoutRule, 'Rule should be update'),
            );
            expect(updatedAutoPayoutRule.body.age_to).equal(
                autoPayoutRuleData.age_to,
                prettifyRes(updatedAutoPayoutRule, 'Rule should be update'),
            );

            return autoPayoutRuleSeed.down(autoPayoutRule.body.brand_id, autoPayoutRule.body.id);
        });
    });
};
