'use strict';

let autoPayoutRuleSeed = require('seeds/auto-payout-rule.seed');
let { prettifyRes } = require('common');
let { dummy: { BRAND_ID } } = require('config.test');

module.exports = () => {
    describe('#delete', function() {
        it('Should Delete Auto Payout Rule', async function () {
            let autoPayoutRule = await autoPayoutRuleSeed.up({}, BRAND_ID);

            expect(autoPayoutRule.status)
                .equal(200, prettifyRes(autoPayoutRule, 'Payout Request should be created with status 200'));

            return autoPayoutRuleSeed.down(autoPayoutRule.body.brand_id, autoPayoutRule.body.id);
        });
    });
};
