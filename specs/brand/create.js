'use strict';

let { prettifyRes } = require('common');

let brandTestSeed = require('seeds/brand.seed');
let coreTest = require('core/tests/integration/specs/brand/create');

module.exports = () => {
    describe('#create', function() {
        coreTest();

        it('Shouldn\'t create invalid brand', async function() {
            let brandData = {
                name: '',
                wagering_phone: '',
                person_service_phone: '',
                currency_code: '',
                deposit_bonus: 'asfasf',
                merchant_id: '',
            };

            let { res, brandId: newBrandId } = await brandTestSeed.up(brandData);

            this.test.brandId = newBrandId;

            expect(res.status).equal(400, prettifyRes(res, 'Brand should not be created'));

            let errors = res.body.errors.map(e => e.field);

            expect(res.body.errors.length).equal(6, prettifyRes(res));
            expect(errors.includes('merchant_id')).equal(true, prettifyRes(res));
            expect(errors.includes('name')).equal(true, prettifyRes(res));
            expect(errors.includes('person_service_phone')).equal(true, prettifyRes(res));
            expect(errors.includes('wagering_phone')).equal(true, prettifyRes(res));
            expect(errors.includes('deposit_bonus')).equal(true, prettifyRes(res));
            expect(errors.includes('currency_code')).equal(true, prettifyRes(res));
        });
    });
};
