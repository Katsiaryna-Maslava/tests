'use strict';

let paymentProcessorSeed = require('seeds/payment-processor.seed');
let binRuleSeed = require('seeds/bin-rule.seed');
let binProcessorSeed = require('seeds/bin-processor.seed');
let { prettifyRes } = require('common');

let binProcessorId;
let paymentProcessorId;
let binRuleId;

module.exports = () => {
    describe('#update', function () {
        beforeEach('Create new Payment Processor, Bin Rule and Bin Processor', function() {
            return Promise.all([
                paymentProcessorSeed.up(),
                binRuleSeed.up(),
            ])
                .then(([processorId, binRuleResult]) => {
                    paymentProcessorId = processorId; // TODO: refactor in payment processors seed
                    binRuleId = binRuleResult.body.id;

                    return binProcessorSeed.up({
                        paymentProcessorId,
                        binRuleId: binRuleResult.body.id,
                    });
                })
                .then(({ body: { id } }) => {
                    binProcessorId = id;
                });
        });

        afterEach('Clean up', function() {
            return Promise.all([
                binProcessorId && binProcessorSeed.down(binProcessorId),
                paymentProcessorId && paymentProcessorSeed.down(paymentProcessorId),
                binRuleId && binRuleSeed.down(binRuleId),
            ].filter(Boolean));
        });

        it('Should update Bin Processor', function() {
            let binProcessorData = {
                profileCondition: 'equal',
                profileLevel: 'silver',
            };

            return request
                .asStuff
                .put(`/v1/bin-processors/${binProcessorId}`)
                .send(binProcessorData)
                .then(({ body, status }) => {
                    expect(status).equal(200, prettifyRes(body, 'Bin Processor should be updated with status 200'));

                    expect(body.profile_condition).equal(binProcessorData.profileCondition, prettifyRes(body));
                    expect(body.profile_level).equal(binProcessorData.profileLevel, prettifyRes(body));
                });
        });

        it('Shouldn`t update Bin Processor with invalid Profile Condition and Profile Level', function() {
            let binProcessorData = {
                profileCondition: 'max',
                profileLevel: 1,
            };

            return request
                .asStuff
                .put(`/v1/bin-processors/${binProcessorId}`)
                .send(binProcessorData)
                .then(({ body, status }) => {
                    expect(status).equal(400, prettifyRes(body, 'Bin Processor shouldn`t be updated with status 400'));

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(2, prettifyRes(body));
                    expect(errors.includes('profile_condition')).equal(true, prettifyRes(body));
                    expect(errors.includes('profile_level')).equal(true, prettifyRes(body));
                });
        });
    });
};
