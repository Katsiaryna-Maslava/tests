'use strict';

let { prettifyRes } = require('common');
let { down, up, negativeUp } = require('seeds/scoring-rule.seed');

module.exports = () => {
    let scoringRuleId;

    describe('#create', function () {
        afterEach('Clean up', function () {
            return down(scoringRuleId)
                .then(() => {
                    scoringRuleId = null;
                });
        });

        it('should create valid scoring rule (Location)', function () {
            let scoringRuleData = {
                group: 'location',
                parameter: 'countryByIp',
                condition: 'equal',
                score_adjustment: 1,
                is_enabled: true,
                value: ['AF'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    scoringRuleId = body.id;

                    expect(scoringRuleId).be.a('string');

                    expect(body.group).equal(scoringRuleData.group);
                    expect(body.parameter).equal(scoringRuleData.parameter);
                    expect(body.score_adjustment).equal(scoringRuleData.score_adjustment);
                    expect(body.value[0]).equal(scoringRuleData.value[0]);
                    expect(body.is_enabled).equal(scoringRuleData.is_enabled);
                });
        });

        it('shouldn\'t create invalid scoring rule (Location)', function () {
            let scoringRuleData = {
                group: 'location',
                condition: 'equal',
                is_enabled: true,
                value: ['AF'],
                merchant_id: 'Hk0egjObl',
            };

            return negativeUp(scoringRuleData)
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(3, prettifyRes(res));
                    expect(errors.includes('parameter')).equal(true, prettifyRes(res));
                    expect(errors.includes('condition')).equal(true, prettifyRes(res));
                    expect(errors.includes('score_adjustment')).equal(true, prettifyRes(res));
                });
        });

        it('shouldn\'t create duplicate scoring rule (Location)', function () {
            let scoringRuleData = {
                group: 'location',
                parameter: 'countryByIp',
                condition: 'equal',
                score_adjustment: 1,
                is_enabled: true,
                value: ['AF'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then(({ body: { id } }) => {
                    scoringRuleId = id;
                })
                .then(() => negativeUp(scoringRuleData))
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(1, prettifyRes(res));
                    expect(errors.includes('scoring_rule')).equal(true, prettifyRes(res));
                });
        });

        it('should create valid scoring rule (Identity)', function () {
            let scoringRuleData = {
                group: 'location',
                parameter: 'locationMismatch',
                condition: 'more',
                score_adjustment: 12,
                is_enabled: true,
                value: [40],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    scoringRuleId = body.id;

                    expect(scoringRuleId).be.a('string');

                    expect(body.group).equal(scoringRuleData.group);
                    expect(body.parameter).equal(scoringRuleData.parameter);
                    expect(body.score_adjustment).equal(scoringRuleData.score_adjustment);
                    expect(Number(body.value[0])).equal(scoringRuleData.value[0]);
                    expect(body.is_enabled).equal(scoringRuleData.is_enabled);
                });
        });

        it('shouldn\'t create invalid scoring rule (Identity)', function () {
            let scoringRuleData = {
                group: 'identity',
                condition: 'is',
                is_enabled: true,
                value: ['identity'],
                merchant_id: 'Hk0egjObl',
            };

            return negativeUp(scoringRuleData)
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(3, prettifyRes(res));
                    expect(errors.includes('parameter')).equal(true, prettifyRes(res));
                    expect(errors.includes('condition')).equal(true, prettifyRes(res));
                    expect(errors.includes('score_adjustment')).equal(true, prettifyRes(res));
                });
        });

        it('shouldn\'t create duplicate scoring rule (Identity)', function () {
            let scoringRuleData = {
                group: 'location',
                parameter: 'locationMismatch',
                condition: 'more',
                score_adjustment: 12,
                is_enabled: true,
                value: [40],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then(({ body: { id } }) => {
                    scoringRuleId = id;
                })
                .then(() => negativeUp(scoringRuleData))
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(1, prettifyRes(res));
                    expect(errors.includes('scoring_rule')).equal(true, prettifyRes(res));
                });
        });

        it('should create valid scoring rule (History)', function () {
            let scoringRuleData = {
                group: 'history',
                parameter: 'paymentAccount',
                condition: 'is',
                score_adjustment: 12,
                is_enabled: true,
                value: ['new'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    scoringRuleId = body.id;

                    expect(scoringRuleId).be.a('string');

                    expect(body.group).equal(scoringRuleData.group);
                    expect(body.parameter).equal(scoringRuleData.parameter);
                    expect(body.score_adjustment).equal(scoringRuleData.score_adjustment);
                    expect(body.value[0]).equal(scoringRuleData.value[0]);
                    expect(body.is_enabled).equal(scoringRuleData.is_enabled);
                });
        });

        it('shouldn\'t create invalid scoring rule (History)', function () {
            let scoringRuleData = {
                group: 'history',
                merchant_id: 'Hk0egjObl',
            };

            return negativeUp(scoringRuleData)
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(5, prettifyRes(res));
                    expect(errors.includes('parameter')).equal(true, prettifyRes(res));
                    expect(errors.includes('condition')).equal(true, prettifyRes(res));
                    expect(errors.includes('value')).equal(true, prettifyRes(res));
                    expect(errors.includes('score_adjustment')).equal(true, prettifyRes(res));
                    expect(errors.includes('is_enabled')).equal(true, prettifyRes(res));
                });
        });

        it('shouldn\'t create duplicate scoring rule (History)', function () {
            let scoringRuleData = {
                group: 'history',
                parameter: 'paymentAccount',
                condition: 'is',
                score_adjustment: 12,
                is_enabled: true,
                value: ['new'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then(({ body: { id } }) => {
                    scoringRuleId = id;
                })
                .then(() => negativeUp(scoringRuleData))
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(1, prettifyRes(res));
                    expect(errors.includes('scoring_rule')).equal(true, prettifyRes(res));
                });
        });

        it('should create valid scoring rule (Velocity)', function () {
            let scoringRuleData = {
                group: 'velocity',
                parameter: 'failedAttemptsPerHourCount',
                condition: 'more',
                score_adjustment: 12,
                is_enabled: true,
                value: ['333'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    scoringRuleId = body.id;

                    expect(scoringRuleId).be.a('string');

                    expect(body.group).equal(scoringRuleData.group);
                    expect(body.parameter).equal(scoringRuleData.parameter);
                    expect(body.score_adjustment).equal(scoringRuleData.score_adjustment);
                    expect(body.value[0]).equal(scoringRuleData.value[0]);
                    expect(body.is_enabled).equal(scoringRuleData.is_enabled);
                });
        });

        it('shouldn\'t create invalid scoring rule (Velocity)', function () {
            let scoringRuleData = {
                group: 'velocity',
                merchant_id: 'Hk0egjObl',
            };

            return negativeUp(scoringRuleData)
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(5, prettifyRes(res));
                    expect(errors.includes('parameter')).equal(true, prettifyRes(res));
                    expect(errors.includes('condition')).equal(true, prettifyRes(res));
                    expect(errors.includes('value')).equal(true, prettifyRes(res));
                    expect(errors.includes('score_adjustment')).equal(true, prettifyRes(res));
                    expect(errors.includes('is_enabled')).equal(true, prettifyRes(res));
                });
        });

        it('shouldn\'t create duplicate scoring rule (Velocity)', function () {
            let scoringRuleData = {
                group: 'velocity',
                parameter: 'failedAttemptsPerHourCount',
                condition: 'more',
                score_adjustment: 12,
                is_enabled: true,
                value: ['333'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then(({ body: { id } }) => {
                    scoringRuleId = id;
                })
                .then(() => negativeUp(scoringRuleData))
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(1, prettifyRes(res));
                    expect(errors.includes('scoring_rule')).equal(true, prettifyRes(res));
                });
        });

        it('should create valid scoring rule (Fraud)', function () {
            let scoringRuleData = {
                group: 'fraud',
                parameter: 'proxy',
                condition: 'is',
                score_adjustment: 12,
                is_enabled: true,
                value: ['new'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    scoringRuleId = body.id;

                    expect(scoringRuleId).be.a('string');

                    expect(body.group).equal(scoringRuleData.group);
                    expect(body.parameter).equal(scoringRuleData.parameter);
                    expect(body.score_adjustment).equal(scoringRuleData.score_adjustment);
                    expect(body.value[0]).equal(scoringRuleData.value[0]);
                    expect(body.is_enabled).equal(scoringRuleData.is_enabled);
                });
        });

        it('shouldn\'t create invalid scoring rule (Fraud)', function () {
            let scoringRuleData = {
                group: 'fraud',
                merchant_id: 'Hk0egjObl',
            };

            return negativeUp(scoringRuleData)
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(5, prettifyRes(res));
                    expect(errors.includes('parameter')).equal(true, prettifyRes(res));
                    expect(errors.includes('condition')).equal(true, prettifyRes(res));
                    expect(errors.includes('value')).equal(true, prettifyRes(res));
                    expect(errors.includes('score_adjustment')).equal(true, prettifyRes(res));
                    expect(errors.includes('is_enabled')).equal(true, prettifyRes(res));
                });
        });

        it('shouldn\'t create duplicate scoring rule (Fraud)', function () {
            let scoringRuleData = {
                group: 'fraud',
                parameter: 'proxy',
                condition: 'is',
                score_adjustment: 12,
                is_enabled: true,
                value: ['new'],
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then(({ body: { id } }) => {
                    scoringRuleId = id;
                })
                .then(() => negativeUp(scoringRuleData))
                .then((res) => {
                    let errors = res.body.errors.map(({ field }) => field);

                    expect(errors.length).equal(1, prettifyRes(res));
                    expect(errors.includes('scoring_rule')).equal(true, prettifyRes(res));
                });
        });
    });
};
