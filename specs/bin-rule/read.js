'use strict';

let binRuleSeed = require('seeds/bin-rule.seed');
let { prettifyRes } = require('common');

let binRuleId;

module.exports = () => {
    describe('#read', function() {
        beforeEach('Create Bin Rule', function () {
            return binRuleSeed.up().then(({ body }) => {
                binRuleId = body.id;

                return null;
            });
        });

        afterEach('Clean Up', function () {
            return binRuleId && binRuleSeed.down(binRuleId);
        });

        it('Should get Bin Rule', function () {
            return request
                .asStuff
                .get(`/v1/bin-rules/${binRuleId}`)
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Bin Rule should be returned with status 200'));

                    expect(res.body.id).equal(binRuleId, prettifyRes(res.body));
                });
        });

        it('Shouldn`t get non-existing Bin Rule', function() {
            return request
                .asStuff
                .get('/v1/bin-rules/invalidId')
                .then((res) => {
                    expect(res.status)
                        .equal(404, prettifyRes(res, 'Bin Rule shouldn`t be returned with status 404'));
                });
        });

        it('Should get Bin Rules list', function() {
            return request
                .asStuff
                .get('/v1/bin-rules')
                .then((res) => {
                    expect(res.status).equal(200, prettifyRes(res, 'Bin Rules should be returned with status 200'));

                    expect(res.body).to.be.an('array');
                    expect(res.body[0]).to.be.an('object');
                });
        });
    });
};
