"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CircleCIApi {
    constructor() {
        this.label = 'CircleCI API';
        this.name = 'circleciApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://circleci.com/docs/managing-api-tokens/">official guide</a> on how to get an API Token from CircleCI User Settings → Personal API Tokens';
        this.inputs = [
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<CIRCLECI_API_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: CircleCIApi };
//# sourceMappingURL=CircleCIApi.credential.js.map