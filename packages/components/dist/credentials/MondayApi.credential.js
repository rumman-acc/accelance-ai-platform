"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MondayApi {
    constructor() {
        this.label = 'monday.com API';
        this.name = 'mondayApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://developer.monday.com/api-reference/docs/authentication">official guide</a> on how to get an API token from monday.com. Go to your Avatar &gt; Admin &gt; API, or Developer settings &gt; My Access Tokens';
        this.inputs = [
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<MONDAY_API_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: MondayApi };
//# sourceMappingURL=MondayApi.credential.js.map