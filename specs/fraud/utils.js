'use strict';

let paymentAccountTestSeed = require('seeds/payment-account.seed');
let personTestSeed = require('seeds/person.seed');

module.exports = {
    createDependencies,
    cleanupDependencies,
};

async function createDependencies() {
    let { body: person } = await personTestSeed.up();
    let { body: paymentAccount } = await paymentAccountTestSeed.up(person.id);

    return {
        person,
        paymentAccount,
    };
}

async function cleanupDependencies(dependencies) {
    await personTestSeed.down(dependencies.person.id);
}
