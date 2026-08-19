"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NotionApi {
    constructor() {
        this.label = 'Notion API';
        this.name = 'notionApi';
        this.version = 1.0;
        this.description =
            'Internal Integration Secret from a Notion integration. Refer to <a target="_blank" href="https://www.notion.so/profile/integrations">Notion integrations settings</a> to create one and share the relevant pages/databases with it.';
        this.inputs = [
            {
                label: 'Internal Integration Secret',
                name: 'notionIntegrationToken',
                type: 'password',
                placeholder: '<NOTION_INTEGRATION_SECRET>'
            }
        ];
    }
}
module.exports = { credClass: NotionApi };
//# sourceMappingURL=NotionApi.credential.js.map