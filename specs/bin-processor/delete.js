'use strict';

let binProcessorSeed = require('seeds/bin-processor.seed');
let paymentProcessorSeed = require('seeds/payment-processor.seed');
let binRuleSeed = require('seeds/bin-rule.seed');

module.exports = () => {
    describe('#delete', function () {
        it('Should delete Bin Processor', function() {
            return Promise.all([
                paymentProcessorSeed.up(),
                binRuleSeed.up(),
            ])
                .then(([paymentProcessorId, binRuleResult]) =>
                    binProcessorSeed.up({
                        paymentProcessorId,
                        binRuleId: binRuleResult.body.id, // TODO: Refactor payment processor seed
                    }))
                .then(({ body: { id, bin_rule_id, payment_processor_id } }) => Promise.all([
                    binProcessorSeed.down(id),
                    binRuleSeed.down(bin_rule_id),
                    paymentProcessorSeed.down(payment_processor_id),
                ]));
        });
    });
};
