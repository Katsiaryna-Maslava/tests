'use strict';

let { prettifyRes } = require('common');

let binProcessorSeed = require('seeds/bin-processor.seed');
let paymentProcessorSeed = require('seeds/payment-processor.seed');
let binRuleSeed = require('seeds/bin-rule.seed');

let binProcessorId;
let paymentProcessorId;
let binRuleId;

module.exports = () => {
    describe('#create', function () {
        beforeEach('create new Payment Processor and Bin Rule', function() {
            return Promise.all([
                paymentProcessorSeed.up(),
                binRuleSeed.up(),
            ])
                .then(([processorId, binRuleResult]) => {
                    paymentProcessorId = processorId; // TODO: refactor in payment processors seed
                    binRuleId = binRuleResult.body.id;
                });
        });

        afterEach('Clean up', function() {
            return Promise.all([
                binProcessorId && binProcessorSeed.down(binProcessorId),
                paymentProcessorId && paymentProcessorSeed.down(paymentProcessorId),
                binRuleId && binRuleSeed.down(binRuleId),
            ].filter(Boolean));
        });

        it('Should create new bin processor', function () {
            let binProcessorData = {
                binRuleId,
                paymentProcessorId,
                profileCondition: 'min',
                profileLevel: 'bronze',
            };

            return binProcessorSeed.up(binProcessorData)
                .then(({ body }) => {
                    binProcessorId = body.id;

                    expect(body.bin_rule_id).equal(binProcessorData.binRuleId, prettifyRes(body));
                    expect(body.payment_processor.id).equal(binProcessorData.paymentProcessorId, prettifyRes(body));
                    expect(body.profile_condition).equal(binProcessorData.profileCondition, prettifyRes(body));
                    expect(body.profile_level).equal(binProcessorData.profileLevel, prettifyRes(body));
                });
        });

        it('Shouldn\'t create invalid bin processor', function () {
            let binProcessorData = {
                binRuleId,
                paymentProcessorId,
            };

            return binProcessorSeed.negativeUp(binProcessorData)
                .then(({ body }) => {
                    binProcessorId = null;

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(2, prettifyRes(body));
                    expect(errors.includes('profile_level'));
                    expect(errors.includes('profile_condition'));
                });
        });

        it('Shouldn\'t create invalid bin processor', function () {
            let binProcessorData = {
                binRuleId,
                paymentProcessorId,
                profileCondition: 1,
                profileLevel: 2,
            };

            return binProcessorSeed.negativeUp(binProcessorData)
                .then(({ body }) => {
                    binProcessorId = null;

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(2, prettifyRes(body));
                    expect(errors.includes('profile_level'));
                    expect(errors.includes('profile_condition'));
                });
        });
    });
};
