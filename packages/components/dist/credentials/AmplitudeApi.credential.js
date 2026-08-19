"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AmplitudeApi {
    constructor() {
        this.label = 'Amplitude API';
        this.name = 'amplitudeApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://amplitude.com/docs/apis/keys-and-tokens">official guide</a> on how to get your API Key and Secret Key from Amplitude Settings -> Projects -> your project -> General';
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                placeholder: '<AMPLITUDE_API_KEY>'
            },
            {
                label: 'Secret Key',
                name: 'secretKey',
                type: 'password',
                placeholder: '<AMPLITUDE_SECRET_KEY>'
            }
        ];
    }
}
module.exports = { credClass: AmplitudeApi };
//# sourceMappingURL=AmplitudeApi.credential.js.map