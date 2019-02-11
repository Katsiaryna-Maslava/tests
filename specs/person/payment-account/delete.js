'use strict';

let paymentAccountSeed = require('seeds/payment-account.seed');
let personTestSeed = require('seeds/person.seed');

let personId;

module.exports = () => {
    describe('#delete', function() {
        before('Create Person', function() {
            return personTestSeed.up()
                .then(({ body: { id } }) => {
                    personId = id;
                });
        });

        after('Delete Person', function() {
            return personTestSeed.down(personId);
        });

        it('should delete Payment Account', async function() {
            let { body: { id } } = await paymentAccountSeed.up(personId);

            return paymentAccountSeed.down(personId, id);
        });
    });
};
