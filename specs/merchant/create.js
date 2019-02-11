'use strict';

let { prettifyRes } = require('common/index');

module.exports = () => {
    describe('#create', () => {
        it('Should create merchant successfully', async () => {
            let merchantData = {
                name: 'Test merchant 1',
                address: 'Kungsgatan 10, 11143, Oslo, Norway.',
                currency: 'USD',
            };

            let merchantResponse = await request
                .asStuff
                .post('/v1/merchants')
                .send(merchantData);

            expect(merchantResponse.status).equal(
                200,
                prettifyRes(merchantResponse, 'Merchant should be created with status 200'),
            );
        });
        it('Should not create merchant without currency', async () => {
            let merchantData = {
                name: 'Test Merchant 2',
                address: 'Kungsgatan 10, 11143, Oslo, Norway.',
            };
            let merchantResponse = await request
                .asStuff
                .post('/v1/merchants')
                .send(merchantData);

            expect(merchantResponse.status).equal(
                400,
                prettifyRes(merchantResponse, "Merchant shouldn't be created with status 400"),
            );
        });
        it('Should not create merchant with existing already merchants name', async () => {
            let firstMerchantData = {
                name: 'Test Merchant 3',
                address: 'Kungsgatan 10, 11143, Oslo, Norway.',
                currency: 'USD',
            };
            let firstMerchantResponse = await request
                .asStuff
                .post('/v1/merchants')
                .send(firstMerchantData);

            expect(firstMerchantResponse.status).equal(
                200,
                prettifyRes(firstMerchantResponse, 'Merchant should be created with status 200'),
            );
            let secondMerchantData = {
                name: firstMerchantResponse.body.name,
                address: 'Kungsgatan 10, 11143, Oslo, Norway.',
                currency: 'USD',
            };
            let secondMerchantResponse = await request
                .asStuff
                .post('/v1/merchants')
                .send(secondMerchantData);

            expect(secondMerchantResponse.status).equal(
                400,
                prettifyRes(secondMerchantResponse, "Merchant shouldn't be created with status 400"),
            );
        });
    });
};
