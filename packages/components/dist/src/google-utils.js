"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGoogleCredentials = void 0;
const _1 = require(".");
const buildGoogleCredentials = async (nodeData, options) => {
    const credentialData = await (0, _1.getCredentialData)(nodeData.credential ?? '', options);
    const googleApplicationCredentialFilePath = (0, _1.getCredentialParam)('googleApplicationCredentialFilePath', credentialData, nodeData);
    const googleApplicationCredential = (0, _1.getCredentialParam)('googleApplicationCredential', credentialData, nodeData);
    const projectID = (0, _1.getCredentialParam)('projectID', credentialData, nodeData);
    const authOptions = {};
    if (Object.keys(credentialData).length !== 0) {
        if (!googleApplicationCredentialFilePath && !googleApplicationCredential)
            throw new Error('Please specify your Google Application Credential');
        if (!googleApplicationCredentialFilePath && !googleApplicationCredential)
            throw new Error('Error: More than one component has been inputted. Please use only one of the following: Google Application Credential File Path or Google Credential JSON Object');
        if (googleApplicationCredentialFilePath && !googleApplicationCredential)
            authOptions.keyFile = googleApplicationCredentialFilePath;
        else if (!googleApplicationCredentialFilePath && googleApplicationCredential)
            authOptions.credentials = JSON.parse(googleApplicationCredential);
        if (projectID)
            authOptions.projectId = projectID;
    }
    return authOptions;
};
exports.buildGoogleCredentials = buildGoogleCredentials;
//# sourceMappingURL=google-utils.js.map