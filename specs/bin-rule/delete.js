'use strict';

let binRuleSeed = require('seeds/bin-rule.seed');

module.exports = () => {
    describe('#delete', function() {
        it('SHould delete Bin Rule', function () {
            return binRuleSeed.up().then(({ body }) => binRuleSeed.down(body.id));
        });
    });
};
