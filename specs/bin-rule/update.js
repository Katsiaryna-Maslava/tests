'use strict';

let binRuleSeed = require('seeds/bin-rule.seed');
let { prettifyRes } = require('common');
let { dummy } = require('config.test');

let binRuleId;

module.exports = () => {
    describe('#update', function() {
        afterEach('Clean Up', function () {
            return binRuleId && binRuleSeed.down(binRuleId);
        });

        it('Should update Bin Rule with Custom Fields', function () {
            return binRuleSeed.up().then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'customFields',
                    cardTypes: [{ type: 'visa' }],
                    countries: ['CZ', 'FR'],
                    currencies: [{ currencyCode: 'EUR' }],
                    isExceptOfCountry: false,
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ body, status }) => {
                        expect(status).equal(200, prettifyRes(body, 'Bin Rule should be updated with status 200'));

                        expect(body.bin_rule_type).equal(binRuleUpdateData.binRuleType, prettifyRes(body));
                        expect(Boolean(body.card_types
                            .find(t => t.type === 'visa')))
                            .equal(true, prettifyRes(body));
                        expect(Boolean(body.countries
                            .find(c => c === 'CZ')))
                            .equal(true, prettifyRes(body));
                        expect(Boolean(body.countries
                            .find(c => c === 'FR')))
                            .equal(true, prettifyRes(body));
                        expect(Boolean(body.currencies
                            .find(c => c.currency_code === 'EUR')))
                            .equal(true, prettifyRes(body));
                    });
            });
        });

        it('Should update Bin Rule with Bin Number range', function () {
            let binRuleData = {
                binRuleType: 'range',
                rangeFrom: '111111',
                rangeTo: '222222',
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'range',
                    rangeFrom: '222222',
                    rangeTo: '333333',
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ body, status }) => {
                        expect(status).equal(200, prettifyRes(body, 'Bin Rule should be updated with status 200'));

                        expect(body.bin_rule_type).equal(binRuleUpdateData.binRuleType, prettifyRes(body));
                        expect(body.range_from).equal(binRuleUpdateData.rangeFrom, prettifyRes(body));
                        expect(body.range_to).equal(binRuleUpdateData.rangeTo, prettifyRes(body));
                    });
            });
        });

        it('Should update Bin Rule with Bin Number', function () {
            let binRuleData = {
                binRuleType: 'binNumber',
                binNumber: '111111',
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'binNumber',
                    binNumber: '111111',
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ body, status }) => {
                        expect(status).equal(200, prettifyRes(body, 'Bin Rule should be updated with status 200'));

                        expect(body.bin_rule_type).equal(binRuleUpdateData.binRuleType, prettifyRes(body));
                        expect(body.bin_number).equal(binRuleUpdateData.binNumber, prettifyRes(body));
                        expect(body.range_to).equal(binRuleUpdateData.rangeTo, prettifyRes(body));
                    });
            });
        });

        it('Should update Bin Rule with Regular Expression', function () {
            let binRuleData = {
                binRuleType: 'regExp',
                regExp: '111111',
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'regExp',
                    regExp: '123456',
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ body, status }) => {
                        expect(status).equal(200, prettifyRes(body, 'Bin Rule should be updated with status 200'));

                        expect(body.bin_rule_type).equal(binRuleUpdateData.binRuleType, prettifyRes(body));
                        expect(body.reg_exp).equal(binRuleUpdateData.regExp, prettifyRes(body));
                    });
            });
        });

        it('Should update Bin Rule with Regular Expression to Bin Rule with Custom Fields', function () {
            let binRuleData = {
                binRuleType: 'regExp',
                regExp: '111111',
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'customFields',
                    cardTypes: [{ type: 'visa' }],
                    countries: ['CZ', 'FR'],
                    currencies: [{ currencyCode: 'EUR' }],
                    isExceptOfCountry: false,
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ body, status }) => {
                        expect(status).equal(200, prettifyRes(body, 'Bin Rule should be updated with status 200'));

                        expect(body.bin_rule_type).equal(binRuleUpdateData.binRuleType, prettifyRes(body));
                        expect(Boolean(body.card_types
                            .find(t => t.type === 'visa')))
                            .equal(true, prettifyRes(body));
                        expect(Boolean(body.countries
                            .find(c => c === 'CZ')))
                            .equal(true, prettifyRes(body));
                        expect(Boolean(body.countries
                            .find(c => c === 'FR')))
                            .equal(true, prettifyRes(body));
                        expect(Boolean(body.currencies
                            .find(c => c.currency_code === 'EUR')))
                            .equal(true, prettifyRes(body));
                    });
            });
        });

        it('Should change the priority of existing BIN rules by swapping them', async function () {
            let binRuleFirstData = {
                cardTypes: [{ type: 'mastercard' }],
            };
            let binRuleSecondData = {
                cardTypes: [{ type: 'visa' }],
            };

            let { body: firstBinRule } = await binRuleSeed.up(binRuleFirstData);
            let { body: secondBinRule } = await binRuleSeed.up(binRuleSecondData);

            binRuleId = [firstBinRule.id, secondBinRule.id];

            let swapPriorityData = [
                {
                    id: firstBinRule.id,
                    priority: secondBinRule.priority,
                },
                {
                    id: secondBinRule.id,
                    priority: firstBinRule.priority,
                },
            ];

            return request
                .asStuff
                .post('/v1/bin-rules/swap-priorities/')
                .send(swapPriorityData)
                .then(({ status, body }) => {
                    let firstUpdatedBinRule = body.find(({ id }) => id === firstBinRule.id);
                    let secondUpdatedBinRule = body.find(({ id }) => id === secondBinRule.id);

                    expect(status)
                        .equal(200, prettifyRes(body, 'Bin Rules priority should be swapped with status 200'));

                    expect(firstBinRule.priority).equal(secondUpdatedBinRule.priority, prettifyRes(body));
                    expect(secondBinRule.priority).equal(firstUpdatedBinRule.priority, prettifyRes(body));
                });
        });

        it('Shoudn`t update non-existing Bin Rule', function() {
            let binRuleUpdateData = {
                binRuleType: 'binNumber',
                binNumber: '123456',
                merchantId: dummy.MERCHANT_ID,
            };

            return request
                .asStuff
                .put(`/v1/bin-rules/${binRuleId}`)
                .send(binRuleUpdateData)
                .then(({ body, status }) => {
                    binRuleId = null;

                    expect(status)
                        .equal(404, prettifyRes(body, 'Non-existing Bin Rule shouldn`t be updated with status 404'));
                });
        });

        it('Shouldn`t update bin rule with Custom Fields with duplicated data', function () {
            return binRuleSeed.up().then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'customFields',
                    cardTypes: [{ type: 'mastercard' }],
                    countries: ['CZ'],
                    currencies: [{ currencyCode: 'EUR' }],
                    isExceptOfCountry: false,
                    merchantId: dummy.MERCHANT_ID,
                };

                return binRuleSeed.up(binRuleUpdateData)
                    .then(() => request
                        .asStuff
                        .put(`/v1/bin-rules/${binRuleId}`)
                        .send(binRuleUpdateData)
                        .then(({ status, body }) => {
                            expect(status)
                                .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                            let errors = body.errors.map(error => error.field);

                            expect(errors.length).equal(1, prettifyRes(body));

                            expect(errors.includes('unique_custom_fields')).equal(true, prettifyRes(body));
                        }));
            });
        });

        it('Shouldn`t update bin rule with Bin Number Range with duplicated data', function () {
            let binRuleData = {
                binRuleType: 'range',
                rangeFrom: '123456',
                rangeTo: '456789',
                merchantId: dummy.MERCHANT_ID,
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleSecondData = {
                    binRuleType: 'range',
                    rangeFrom: '666666',
                    rangeTo: '777777',
                    merchantId: dummy.MERCHANT_ID,
                };

                return binRuleSeed.up(binRuleSecondData)
                    .then(() => request
                        .asStuff
                        .put(`/v1/bin-rules/${binRuleId}`)
                        .send(binRuleSecondData)
                        .then(({ status, body }) => {
                            expect(status)
                                .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                            let errors = body.errors.map(error => error.field);

                            expect(errors.length).equal(1, prettifyRes(body));

                            expect(errors.includes('unique_ranges')).equal(true, prettifyRes(body));
                        }));
            });
        });

        it('Shouldn`t update bin rule with Bin Number with duplicated data', function () {
            let binRuleData = {
                binRuleType: 'binNumber',
                binNumber: '123456',
                merchantId: dummy.MERCHANT_ID,
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleSecondData = {
                    binRuleType: 'binNumber',
                    binNumber: '456789',
                    merchantId: dummy.MERCHANT_ID,
                };

                return binRuleSeed.up(binRuleSecondData)
                    .then(() => request
                        .asStuff
                        .put(`/v1/bin-rules/${binRuleId}`)
                        .send(binRuleSecondData)
                        .then(({ status, body }) => {
                            expect(status)
                                .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                            let errors = body.errors.map(error => error.field);

                            expect(errors.length).equal(1, prettifyRes(body));

                            expect(errors.includes('unique_bin_number')).equal(true, prettifyRes(body));
                        }));
            });
        });

        it('Shouldn`t update bin rule with Regular Expression with duplicated data', function () {
            let binRuleData = {
                binRuleType: 'regExp',
                regExp: '123456',
                merchantId: dummy.MERCHANT_ID,
            };

            return binRuleSeed.up(binRuleData).then((res) => {
                binRuleId = res.body.id;

                let binRuleSecondData = {
                    binRuleType: 'regExp',
                    regExp: '442523',
                    merchantId: dummy.MERCHANT_ID,
                };

                return binRuleSeed.up(binRuleSecondData)
                    .then(() => request
                        .asStuff
                        .put(`/v1/bin-rules/${binRuleId}`)
                        .send(binRuleSecondData)
                        .then(({ status, body }) => {
                            expect(status)
                                .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                            let errors = body.errors.map(error => error.field);

                            expect(errors.length).equal(1, prettifyRes(body));

                            expect(errors.includes('unique_reg_exp')).equal(true, prettifyRes(body));
                        }));
            });
        });

        it('Shouldn`t update bin rule with Custom Fields with invalid data', function () {
            return binRuleSeed.up().then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'customFields',
                    cardTypes: ['mastercard'],
                    countries: ['USasg'],
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ status, body }) => {
                        expect(status)
                            .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                        let errors = body.errors.map(error => error.field);

                        expect(errors.length).equal(2, prettifyRes(body));

                        expect(errors.includes('countries')).equal(true, prettifyRes(body));
                        expect(errors.includes('type')).equal(true, prettifyRes(body));
                    });
            });
        });

        it('Shouldn`t update bin rule with Bin Number Range with invalid data', function () {
            return binRuleSeed.up().then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'range',
                    rangeFrom: '1',
                    rangeTo: '2',
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ status, body }) => {
                        expect(status)
                            .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                        let errors = body.errors.map(error => error.field);

                        expect(errors.length).equal(2, prettifyRes(body));

                        expect(errors.includes('range_from')).equal(true, prettifyRes(body));
                        expect(errors.includes('range_to')).equal(true, prettifyRes(body));
                    });
            });
        });

        it('Shouldn`t update bin rule with Bin Number with invalid data', function () {
            return binRuleSeed.up().then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'binNumber',
                    binNumber: 'fghds',
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ status, body }) => {
                        expect(status)
                            .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                        let errors = body.errors.map(error => error.field);

                        expect(errors.length).equal(1, prettifyRes(body));

                        expect(errors.includes('bin_number')).equal(true, prettifyRes(body));
                    });
            });
        });

        it('Shouldn`t update bin rule with Regular Expression with invalid data', function () {
            return binRuleSeed.up().then((res) => {
                binRuleId = res.body.id;

                let binRuleUpdateData = {
                    binRuleType: 'regExp',
                    regExp: '',
                    merchantId: dummy.MERCHANT_ID,
                };

                return request
                    .asStuff
                    .put(`/v1/bin-rules/${binRuleId}`)
                    .send(binRuleUpdateData)
                    .then(({ status, body }) => {
                        expect(status)
                            .equal(400, prettifyRes(body, 'Bin Rule shouldn`t be updated with status 400'));

                        let errors = body.errors.map(error => error.field);

                        expect(errors.length).equal(1, prettifyRes(body));
                        expect(errors.includes('reg_exp')).equal(true, prettifyRes(body));
                    });
            });
        });
    });
};
