'use strict';

let { prettifyRes } = require('common');
let { dummy: { BRAND_ID } } = require('config.test');

module.exports = () => {
    describe('#create', function() {
        it('Should fill KYC Threshold', async function () {
            let { body: brand } = await request
                .asStuff
                .get(`/v1/brands/${BRAND_ID}`);

            expect(brand.single_payout_threshold_amount).to.be.null;
            expect(brand.cumulative_payout_threshold_amount).to.be.null;

            let kycThresholdData = {
                single_payout_threshold_amount: 100,
                cumulative_payout_threshold_amount: 1000,
            };

            let filledBrand = await request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(kycThresholdData);

            expect(filledBrand.body.single_payout_threshold_amount).equal(
                kycThresholdData.single_payout_threshold_amount,
                prettifyRes(filledBrand, 'Single payout threshold amount should be set'),
            );
            expect(filledBrand.body.cumulative_payout_threshold_amount).equal(
                kycThresholdData.cumulative_payout_threshold_amount,
                prettifyRes(filledBrand, 'Cumulative payout threshold amount should be set'),
            );

            let clearedKycThresholdData = {
                cumulative_payout_threshold_amount: null,
                single_payout_threshold_amount: null,
            };

            return request
                .asStuff
                .put(`/v1/brands/${BRAND_ID}`)
                .send(clearedKycThresholdData);
        });
    });
};
