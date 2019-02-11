'use strict';

let personSeed = require('seeds/person.seed');
let binRuleSeed = require('seeds/bin-rule.seed');
let paymentAccountSeed = require('seeds/payment-account.seed');
let paymentProcessorSeed = require('seeds/payment-processor.seed');
let binProcessorSeed = require('seeds/bin-processor.seed');
let { prettifyRes } = require('common');
let { dummy } = require('config.test');

let personId;
let binRuleId;
let paymentProcessorId;
let paymentAccountId;
let binProcessorId;

module.exports = () => {
    describe('#update', function() {
        beforeEach('Create Dependencies', async function () {
            let [{ body: { id: createdPersonId } }, createdProcessorId, { body: { id: createdBinRuleId } }] =
                await Promise.all([
                    personSeed.up(),
                    paymentProcessorSeed.up(),
                    binRuleSeed.up({ cardTypes: [{ type: 'visa' }], countries: ['NONDETECTED'] }),
                ]);

            personId = createdPersonId;
            paymentProcessorId = createdProcessorId;
            binRuleId = createdBinRuleId;

            let binProcessorData = {
                binRuleId,
                paymentProcessorId,
                profileCondition: 'min',
                profileLevel: 'newbie',
            };

            let { body: { id: createdBinProcessorId } } = await binProcessorSeed.up(binProcessorData);

            binProcessorId = createdBinProcessorId;
        });
        afterEach('Clean Up', async function () {
            await Promise.all([
                binRuleId && binRuleSeed.down(binRuleId),
                binProcessorId && binProcessorSeed.down(binProcessorId),
                paymentAccountId && paymentAccountSeed.down(personId, paymentAccountId),
                paymentProcessorId && paymentProcessorSeed.down(paymentProcessorId),
            ]);

            await personSeed.down(personId);
        });

        it('Test payment account via bin rules', async function () {
            let { body: { id: createdPaymentAccountId } } = await paymentAccountSeed.up(personId);

            paymentAccountId = createdPaymentAccountId;

            let testData = {
                merchantId: dummy.MERCHANT_ID,
                paymentAccountId,
            };

            let { body } = await request
                .asStuff
                .post('/v1/bin-rules/test')
                .send(testData);

            let matchedBinRules = body.matches_result.map(match => match.bin_rule_id);
            let matchedBinRule = body.matches_result.find(match => match.bin_rule_id === binRuleId);
            let matchedBinProcessors = matchedBinRule.matches.matched_bin_processors_result
                .map(match => match.bin_processor_id);

            expect(matchedBinRules.includes(binRuleId)).equal(true, prettifyRes(body));
            expect(matchedBinRule.matches.row).equal(true, prettifyRes(body));
            expect(matchedBinRule.matches.card_selector).equal(true, prettifyRes(body));
            expect(matchedBinRule.matches.currency).equal(true, prettifyRes(body));
            expect(matchedBinProcessors.includes(binProcessorId)).equal(true, prettifyRes(body));
        });
    });
};
