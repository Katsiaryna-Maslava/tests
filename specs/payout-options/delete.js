'use strict';

let { up, down } = require('seeds/payout-options-and-limits.seed');

let payoutOptionId;

module.exports = () => {
    describe('#delete', function() {
        beforeEach('create new Payout Option', function() {
            return up().then((id) => {
                payoutOptionId = id;
            });
        });

        it('should delete Payout Option', function() {
            return down(payoutOptionId);
        });
    });
};
