'use strict';

let { prettifyRes } = require('common');
let { down, up } = require('seeds/scoring-rule.seed');

let scoringRuleId;

module.exports = () => {
    describe('#update', function () {
        beforeEach('create new Scoring Rule', function () {
            return up().then(({ body: { id } }) => {
                scoringRuleId = id;
            });
        });

        afterEach('Clean up Scoring Rule', function () {
            return down(scoringRuleId);
        });

        it('should update scoring rule parameter', function () {
            let scoringRuleData = {
                parameter: 'registeredCountry',
                group: 'location',
                condition: 'equal',
            };

            return request
                .asStuff
                .put(`/v1/scoring-rules/${scoringRuleId}`)
                .send(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Scoring Rule should be updated with status 200'));

                    expect(body.parameter)
                        .equal(scoringRuleData.parameter, prettifyRes(res, 'should update parameter'));

                    expect(body.id).equal(scoringRuleId);
                });
        });

        it('should update complete scoring rule', function () {
            let scoringRuleData = {
                group: 'velocity',
                parameter: 'failedAttemptsPerDayCount',
                condition: 'more',
                value: ['5'],
            };

            return request
                .asStuff
                .put(`/v1/scoring-rules/${scoringRuleId}`)
                .send(scoringRuleData)
                .then((res) => {
                    let { body } = res;

                    expect(res.status)
                        .equal(200, prettifyRes(res, 'Scoring Rule should be updated with status 200'));

                    expect(body.id).equal(scoringRuleId);

                    expect(body.group).equal(scoringRuleData.group);
                    expect(body.parameter).equal(scoringRuleData.parameter);
                    expect(body.condition).equal(scoringRuleData.condition);
                    expect(body.value[0]).equal(scoringRuleData.value[0]);
                });
        });

        it('shouldn\'t update scoring rule unique group', function () {
            let scoringRuleData = {
                group: 'velocity',
                parameter: 'failedAttemptsPerDayCount',
                condition: 'more',
                value: ['5'],
                score_adjustment: 1,
                is_enabled: true,
                merchant_id: 'Hk0egjObl',
            };

            return up(scoringRuleData)
                .then(({ body: { id: secondEntityId } }) => request
                    .asStuff
                    .put(`/v1/scoring-rules/${scoringRuleId}`)
                    .send(scoringRuleData)
                    .then((res) => {
                        expect(res.status)
                            .equal(400, prettifyRes(res, 'Scoring Rule shouldn\'t be updated with status 400'));

                        let errors = res.body.errors.map(({ field }) => field);

                        expect(errors.length).equal(1, prettifyRes(res));
                        expect(errors.includes('scoring_rule')).equal(true, prettifyRes(res));
                    })
                    .then(() => down(secondEntityId)));
        });
    });
};
