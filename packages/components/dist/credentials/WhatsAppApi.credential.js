"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WhatsAppApi {
    constructor() {
        this.label = 'WhatsApp Business API';
        this.name = 'whatsappApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started">official guide</a> on how to set up Meta\'s WhatsApp Business Platform / Cloud API and generate a System User access token';
        this.inputs = [
            {
                label: 'Phone Number ID',
                name: 'phoneNumberId',
                type: 'string',
                placeholder: '<WHATSAPP_PHONE_NUMBER_ID>'
            },
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                description: 'Use a permanent System User access token, not the temporary 24-hour token',
                placeholder: '<WHATSAPP_ACCESS_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: WhatsAppApi };
//# sourceMappingURL=WhatsAppApi.credential.js.map