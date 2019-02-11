'use strict';

let binRuleSeed = require('seeds/bin-rule.seed');
let { prettifyRes } = require('common');
let { dummy } = require('config.test');

let binRuleId;

module.exports = () => {
    describe('#create', function() {
        afterEach('Clean Up', function () {
            return binRuleId && binRuleSeed.down(binRuleId);
        });

        it('Should Create new Bin Rule with Custom fields', function () {
            return binRuleSeed.up().then(({ body }) => {
                binRuleId = body.id;

                return null;
            });
        });

        it('Should Create new Bin Rule for Bin Number', function () {
            let binRuleData = {
                binRuleType: 'binNumber',
                binNumber: '424242',
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    expect(body.bin_rule_type).equal(binRuleData.binRuleType, prettifyRes(body));
                    expect(body.bin_number).equal(binRuleData.binNumber, prettifyRes(body));
                });
        });

        it('Should Create new Bin Rule for Reg. Exp', function () {
            let binRuleData = {
                binRuleType: 'regExp',
                regExp: '^(?:4[2-9]{12}(?:[0-9]{3}))?',
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    expect(body.bin_rule_type).equal(binRuleData.binRuleType, prettifyRes(body));
                    expect(body.reg_exp).equal(binRuleData.regExp, prettifyRes(body));
                });
        });

        it('Should Create new Bin Rule for Bin Number Range', function () {
            let binRuleData = {
                binRuleType: 'range',
                rangeFrom: '111111',
                rangeTo: '222222',
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    expect(body.bin_rule_type).equal(binRuleData.binRuleType, prettifyRes(body));
                    expect(body.range_from).equal(binRuleData.rangeFrom, prettifyRes(body));
                    expect(body.range_to).equal(binRuleData.rangeTo, prettifyRes(body));
                });
        });

        it('Shouldn`t Create invalid Bin Rule', function () {
            let binRuleData = {
                binRuleType: 'bad type',
                currencies: ['USD', 'EUR'],
                merchantId: dummy.MERCHANT_ID,
            };

            return binRuleSeed.negativeUp(binRuleData)
                .then(({ body }) => {
                    binRuleId = null;

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(2, prettifyRes(body));
                    expect(errors.includes('bin_rule_type')).equal(true, prettifyRes(body));
                    expect(errors.includes('currency_code')).equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Create invalid Bin Rule', function () {
            let binRuleData = {
                binRuleType: 'range',
                rangeFrom: '1',
                rangeTo: '22',
                currencies: ['USD', 'EUR'],
                merchantId: dummy.MERCHANT_ID,
            };

            return binRuleSeed.negativeUp(binRuleData)
                .then(({ body }) => {
                    binRuleId = null;

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(3, prettifyRes(body));
                    expect(errors.includes('range_from')).equal(true, prettifyRes(body));
                    expect(errors.includes('range_to')).equal(true, prettifyRes(body));
                    expect(errors.includes('currency_code')).equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Create duplicated Bin Rule with Custom Fields', function () {
            let binRuleData = {
                binRuleType: 'customFields',
                cardTypes: [{ type: 'mastercard' }],
                countries: ['FR'],
                currencies: [{ currencyCode: 'USD' }],
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    return binRuleSeed.negativeUp(binRuleData);
                })
                .then(({ body }) => {
                    let errors = body.errors.map(error => error.field);

                    expect(errors.includes('unique_custom_fields')).equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Create duplicated Bin Rule for Bin Number', function () {
            let binRuleData = {
                binRuleType: 'binNumber',
                currencies: [{ currencyCode: 'USD' }],
                binNumber: '424242',
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    return binRuleSeed.negativeUp(binRuleData);
                })
                .then(({ body, status }) => {
                    expect(status)
                        .equal(400, prettifyRes(body, 'Duplicated Bin Rule shouldn`t be created with status 400'));

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(1, prettifyRes(body));

                    expect(errors.includes('unique_bin_number')).equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Create duplicated Bin Rule for Reg. Exp', function () {
            let binRuleData = {
                binRuleType: 'regExp',
                currencies: [{ currencyCode: 'USD' }],
                regExp: '^(?:4[2-9]{12}(?:[0-9]{3}))?',
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    return binRuleSeed.negativeUp(binRuleData);
                })
                .then(({ body, status }) => {
                    expect(status)
                        .equal(400, prettifyRes(body, 'Duplicated Bin Rule shouldn`t be created with status 400'));

                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(1, prettifyRes(body));

                    expect(errors.includes('unique_reg_exp')).equal(true, prettifyRes(body));
                });
        });

        it('Shouldn`t Create duplicated Bin Rule for Bin Number Rage', function () {
            let binRuleData = {
                binRuleType: 'range',
                currencies: [{ currencyCode: 'USD' }],
                rangeFrom: '111111',
                rangeTo: '222222',
            };

            return binRuleSeed.up(binRuleData)
                .then(({ body }) => {
                    binRuleId = body.id;

                    return binRuleSeed.negativeUp(binRuleData);
                })
                .then(({ body }) => {
                    let errors = body.errors.map(error => error.field);

                    expect(errors.length).equal(1, prettifyRes(body));

                    expect(errors.includes('unique_ranges')).equal(true, prettifyRes(body));
                });
        });
    });
};
