"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServiceNowApi {
    constructor() {
        this.label = 'ServiceNow API';
        this.name = 'serviceNowApi';
        this.version = 1.0;
        this.description =
            'Create an OAuth API endpoint for external clients in ServiceNow (System OAuth &gt; Application Registry) to obtain the Client ID and Client Secret';
        this.inputs = [
            {
                label: 'Instance',
                name: 'instance',
                type: 'string',
                placeholder: 'yourcompany',
                description: 'the part before .service-now.com in your instance URL'
            },
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string'
            },
            {
                label: 'Client Secret',
                name: 'clientSecret',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: ServiceNowApi };
//# sourceMappingURL=ServiceNowApi.credential.js.map