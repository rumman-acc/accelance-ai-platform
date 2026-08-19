"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AzureBlobStorageApi {
    constructor() {
        this.label = 'Azure Blob Storage API';
        this.name = 'azureBlobStorageApi';
        this.version = 1.0;
        this.description =
            'Register an application in Azure AD, then assign it a "Storage Blob Data Contributor" role on the target storage account. Use the app registration\'s Tenant ID, Client ID, and a generated Client Secret below.';
        this.inputs = [
            {
                label: 'Tenant ID',
                name: 'tenantId',
                type: 'string',
                placeholder: '<AZURE_TENANT_ID>'
            },
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string',
                placeholder: '<AZURE_CLIENT_ID>'
            },
            {
                label: 'Client Secret',
                name: 'clientSecret',
                type: 'password',
                placeholder: '<AZURE_CLIENT_SECRET>'
            },
            {
                label: 'Storage Account Name',
                name: 'accountName',
                type: 'string',
                placeholder: '<AZURE_STORAGE_ACCOUNT_NAME>'
            }
        ];
    }
}
module.exports = { credClass: AzureBlobStorageApi };
//# sourceMappingURL=AzureBlobStorageApi.credential.js.map