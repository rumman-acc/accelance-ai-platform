"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TrelloApi {
    constructor() {
        this.label = 'Trello API';
        this.name = 'trelloApi';
        this.version = 1.0;
        this.description =
            'Get your API Key from <a target="_blank" href="https://trello.com/power-ups/admin">trello.com/power-ups/admin</a> and generate an API Token from <a target="_blank" href="https://trello.com/app-key">trello.com/app-key</a>';
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'string',
                placeholder: '<TRELLO_API_KEY>'
            },
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<TRELLO_API_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: TrelloApi };
//# sourceMappingURL=TrelloApi.credential.js.map