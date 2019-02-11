'use strict';

let { prettifyRes } = require('common');
let { dummy: { BRAND_ID } } = require('config.test');

module.exports = () => {
    describe('#delete', function() {
        it('Should delete KYC Threshold', async function () {
            let kycThresholdData = {
                single_payout_threshold_amount: 100,
                cumulative_payout_threshold_amount: 1000,
            };

            let brand = await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(kycThresholdData);

            expect(brand.body.single_payout_threshold_amount).equal(
                kycThresholdData.single_payout_threshold_amount,
                prettifyRes(brand, 'Single payout threshold amount should be set'),
            );
            expect(brand.body.cumulative_payout_threshold_amount).equal(
                kycThresholdData.cumulative_payout_threshold_amount,
                prettifyRes(brand, 'Cumulative payout threshold amount should be set'),
            );

            let clearedKycThresholdData = {
                cumulative_payout_threshold_amount: null,
                single_payout_threshold_amount: null,
            };

            let { body: updatedBrand } = await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(clearedKycThresholdData);

            expect(updatedBrand.single_payout_threshold_amount).to.be.null;
            expect(updatedBrand.cumulative_payout_threshold_amount).to.be.null;
        });
    });
};
