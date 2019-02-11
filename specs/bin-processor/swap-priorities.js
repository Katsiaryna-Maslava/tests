'use strict';

let paymentProcessorSeed = require('seeds/payment-processor.seed');
let binRuleSeed = require('seeds/bin-rule.seed');
let binProcessorSeed = require('seeds/bin-processor.seed');
let { prettifyRes } = require('common');

let binProcessorFirst;
let binProcessorSecond;
let paymentProcessorIdFirst;
let paymentProcessorIdSecond;
let binRuleId;

module.exports = () => {
    describe('#swap-priorities', function () {
        beforeEach('Create new Payment Processors, Bin Rules and Bin Processors', function() {
            return Promise.all([
                paymentProcessorSeed.up(),
                paymentProcessorSeed.up(),
                binRuleSeed.up(),
            ])
                .then(([processorIdFirst, processorIdSecond, binRuleResult]) => {
                    paymentProcessorIdFirst = processorIdFirst; // TODO: refactor in payment processors seed
                    paymentProcessorIdSecond = processorIdSecond;
                    binRuleId = binRuleResult.body.id;

                    return binProcessorSeed.up({
                        paymentProcessorId: paymentProcessorIdSecond,
                        binRuleId,
                    })
                        .then(({ body }) => {
                            binProcessorFirst = body;

                            return null;
                        })
                        .then(() => binProcessorSeed.up({
                            paymentProcessorId: paymentProcessorIdFirst,
                            binRuleId,
                        }))
                        .then(({ body }) => {
                            binProcessorSecond = body;

                            return null;
                        });
                });
        });

        afterEach('Clean up', function() {
            return Promise.all([
                binProcessorFirst && binProcessorSeed.down(binProcessorFirst.id),
                binProcessorSecond && binProcessorSeed.down(binProcessorSecond.id),
                paymentProcessorIdFirst && paymentProcessorSeed.down(paymentProcessorIdFirst),
                paymentProcessorIdSecond && paymentProcessorSeed.down(paymentProcessorIdSecond),
                binRuleId && binRuleSeed.down(binRuleId),
            ].filter(Boolean));
        });

        it('Should Swap Bin Processors priority', function() {
            return request
                .asStuff
                .post('/v1/bin-processors/swap-priorities')
                .send([
                    {
                        id: binProcessorFirst.id,
                        priority: 2,
                    },
                    {
                        id: binProcessorSecond.id,
                        priority: 5,
                    },
                ])
                .then(({ status, body }) => {
                    expect(status).equal(200, prettifyRes('Swap Bin Priority should be with status 200'));

                    expect(body).to.be.an('array');
                    expect(Boolean(body.find(el => el.id === binProcessorFirst.id && el.priority === 2)))
                        .equal(true, prettifyRes(body));
                    expect(Boolean(body.find(el => el.id === binProcessorSecond.id && el.priority === 5)))
                        .equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Swap Bin Processors priority (count < 2)', function() {
            return request
                .asStuff
                .post('/v1/bin-processors/swap-priorities')
                .send([binProcessorFirst])
                .then(({ status, body }) => {
                    expect(status).equal(400, prettifyRes('Fail of Swap Bin Priority should be with status 400'));

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(1, prettifyRes(body));
                    expect(errors.includes('body')).equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Swap Bin Processors priority (not array)', function() {
            return request
                .asStuff
                .post('/v1/bin-processors/swap-priorities')
                .send(binProcessorFirst)
                .then(({ status, body }) => {
                    expect(status).equal(400, prettifyRes('Fail of Swap Bin Priority should be with status 400'));

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(1, prettifyRes(body));
                    expect(errors.includes('body')).equal(true, prettifyRes(body));
                });
        });
    });
};
