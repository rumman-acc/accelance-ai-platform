"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const src_1 = require("../../../src");
class GoogleSheets_DocumentLoaders {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listSpreadsheets(nodeData, options) {
                const returnData = [];
                try {
                    let credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
                    credentialData = await (0, src_1.refreshOAuth2Token)(nodeData.credential ?? '', credentialData, options);
                    const accessToken = (0, src_1.getCredentialParam)('access_token', credentialData, nodeData);
                    if (!accessToken) {
                        return returnData;
                    }
                    // Query for Google Sheets files specifically
                    const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false";
                    const url = new URL('https://www.googleapis.com/drive/v3/files');
                    url.searchParams.append('q', query);
                    url.searchParams.append('pageSize', '100');
                    url.searchParams.append('fields', 'files(id, name, modifiedTime, webViewLink)');
                    url.searchParams.append('orderBy', 'modifiedTime desc');
                    const response = await fetch(url.toString(), {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        console.error(`Failed to list spreadsheets: ${response.statusText}`);
                        return returnData;
                    }
                    const data = await response.json();
                    for (const file of data.files) {
                        const obj = {
                            name: file.id,
                            label: file.name,
                            description: `Modified: ${new Date(file.modifiedTime).toLocaleDateString()}`
                        };
                        returnData.push(obj);
                    }
                }
                catch (error) {
                    console.error('Error listing Google Sheets:', error);
                }
                return returnData;
            }
        };
        this.label = 'Google Sheets';
        this.name = 'googleSheets';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'google-sheets.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from Google Sheets as documents`;
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Google Sheets OAuth2 Credential',
            credentialNames: ['googleSheetsOAuth2']
        };
        this.inputs = [
            {
                label: 'Select Spreadsheet',
                name: 'spreadsheetIds',
                type: 'asyncMultiOptions',
                loadMethod: 'listSpreadsheets',
                description: 'Select spreadsheet from your Google Drive',
                refresh: true
            },
            {
                label: 'Sheet Names',
                name: 'sheetNames',
                type: 'string',
                description: 'Comma-separated list of sheet names to load. If empty, loads all sheets.',
                placeholder: 'Sheet1, Sheet2',
                optional: true
            },
            {
                label: 'Range',
                name: 'range',
                type: 'string',
                description: 'Range to load (e.g., A1:E10). If empty, loads entire sheet.',
                placeholder: 'A1:E10',
                optional: true
            },
            {
                label: 'Include Headers',
                name: 'includeHeaders',
                type: 'boolean',
                description: 'Whether to include the first row as headers',
                default: true
            },
            {
                label: 'Value Render Option',
                name: 'valueRenderOption',
                type: 'options',
                description: 'How values should be represented in the output',
                options: [
                    {
                        label: 'Formatted Value',
                        name: 'FORMATTED_VALUE'
                    },
                    {
                        label: 'Unformatted Value',
                        name: 'UNFORMATTED_VALUE'
                    },
                    {
                        label: 'Formula',
                        name: 'FORMULA'
                    }
                ],
                default: 'FORMATTED_VALUE',
                optional: true
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description: 'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ];
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, _, options) {
        const _spreadsheetIds = nodeData.inputs?.spreadsheetIds;
        const sheetNames = nodeData.inputs?.sheetNames;
        const range = nodeData.inputs?.range;
        const includeHeaders = nodeData.inputs?.includeHeaders;
        const valueRenderOption = nodeData.inputs?.valueRenderOption || 'FORMATTED_VALUE';
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        if (!_spreadsheetIds) {
            throw new Error('At least one spreadsheet is required');
        }
        let spreadsheetIds = (0, src_1.convertMultiOptionsToStringArray)(_spreadsheetIds);
        let credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        credentialData = await (0, src_1.refreshOAuth2Token)(nodeData.credential ?? '', credentialData, options);
        const accessToken = (0, src_1.getCredentialParam)('access_token', credentialData, nodeData);
        if (!accessToken) {
            throw new Error('No access token found in credential');
        }
        let docs = [];
        try {
            // Process each spreadsheet
            for (const spreadsheetId of spreadsheetIds) {
                try {
                    // Get spreadsheet metadata first
                    const spreadsheetMetadata = await this.getSpreadsheetMetadata(spreadsheetId, accessToken);
                    // Determine which sheets to load
                    let sheetsToLoad = [];
                    if (sheetNames) {
                        sheetsToLoad = sheetNames.split(',').map((name) => name.trim());
                    }
                    else {
                        // Get all sheet names from metadata
                        sheetsToLoad = spreadsheetMetadata.sheets?.map((sheet) => sheet.properties.title) || [];
                    }
                    // Load data from each sheet
                    for (const sheetName of sheetsToLoad) {
                        const sheetRange = range ? `${sheetName}!${range}` : sheetName;
                        const sheetData = await this.getSheetData(spreadsheetId, sheetRange, valueRenderOption, accessToken);
                        if (sheetData.values && sheetData.values.length > 0) {
                            const sheetDoc = this.convertSheetToDocument(sheetData, sheetName, spreadsheetId, spreadsheetMetadata, includeHeaders);
                            docs.push(sheetDoc);
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to process spreadsheet ${spreadsheetId}: ${error.message}`);
                    // Continue processing other spreadsheets even if one fails
                }
            }
            // Apply text splitter if provided
            if (textSplitter && docs.length > 0) {
                docs = await textSplitter.splitDocuments(docs);
            }
            // Apply metadata transformations
            if (metadata) {
                const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
                docs = docs.map((doc) => ({
                    ...doc,
                    metadata: _omitMetadataKeys === '*'
                        ? {
                            ...parsedMetadata
                        }
                        : (0, lodash_1.omit)({
                            ...doc.metadata,
                            ...parsedMetadata
                        }, omitMetadataKeys)
                }));
            }
            else {
                docs = docs.map((doc) => ({
                    ...doc,
                    metadata: _omitMetadataKeys === '*'
                        ? {}
                        : (0, lodash_1.omit)({
                            ...doc.metadata
                        }, omitMetadataKeys)
                }));
            }
        }
        catch (error) {
            throw new Error(`Failed to load Google Sheets data: ${error.message}`);
        }
        if (output === 'document') {
            return docs;
        }
        else {
            let finaltext = '';
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`;
            }
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
    }
    async getSpreadsheetMetadata(spreadsheetId, accessToken) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get spreadsheet metadata: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    }
    async getSheetData(spreadsheetId, range, valueRenderOption, accessToken) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
        const params = new URLSearchParams({
            valueRenderOption,
            dateTimeRenderOption: 'FORMATTED_STRING',
            majorDimension: 'ROWS'
        });
        const response = await fetch(`${url}?${params}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get sheet data: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    }
    convertSheetToDocument(sheetData, sheetName, spreadsheetId, spreadsheetMetadata, includeHeaders) {
        const values = sheetData.values || [];
        if (values.length === 0) {
            return {
                pageContent: '',
                metadata: {
                    source: `Google Sheets: ${spreadsheetMetadata.properties?.title || 'Unknown'} - ${sheetName}`,
                    spreadsheetId,
                    sheetName,
                    spreadsheetTitle: spreadsheetMetadata.properties?.title,
                    range: sheetData.range,
                    rowCount: 0,
                    columnCount: 0
                }
            };
        }
        let headers = [];
        let dataRows = [];
        if (includeHeaders && values.length > 0) {
            headers = values[0] || [];
            dataRows = values.slice(1);
        }
        else {
            // Generate default headers like A, B, C, etc.
            const maxColumns = Math.max(...values.map((row) => row.length));
            headers = Array.from({ length: maxColumns }, (_, i) => String.fromCharCode(65 + i));
            dataRows = values;
        }
        // Convert to markdown table format
        let content = '';
        if (headers.length > 0) {
            // Create header row
            content += '| ' + headers.join(' | ') + ' |\n';
            // Create separator row
            content += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
            // Add data rows
            for (const row of dataRows) {
                const paddedRow = [...row];
                // Pad row to match header length
                while (paddedRow.length < headers.length) {
                    paddedRow.push('');
                }
                content += '| ' + paddedRow.join(' | ') + ' |\n';
            }
        }
        return {
            pageContent: content,
            metadata: {
                source: `Google Sheets: ${spreadsheetMetadata.properties?.title || 'Unknown'} - ${sheetName}`,
                spreadsheetId,
                sheetName,
                spreadsheetTitle: spreadsheetMetadata.properties?.title,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
                range: sheetData.range,
                rowCount: values.length,
                columnCount: headers.length,
                headers: includeHeaders ? headers : undefined,
                totalDataRows: dataRows.length
            }
        };
    }
}
module.exports = { nodeClass: GoogleSheets_DocumentLoaders };
//# sourceMappingURL=GoogleSheets.js.map